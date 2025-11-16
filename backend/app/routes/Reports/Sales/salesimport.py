from fastapi import APIRouter, HTTPException, Request, Depends
import pandas as pd
from io import BytesIO
from datetime import datetime, timedelta
from app.supabase import supabase, postgrest_client, get_db
import logging
from app.utils.unit_converter import convert_units, get_unit_type, normalize_unit, format_quantity_with_unit
from app.models.user_activity_log import UserActivityLog
from app.routes.Inventory.master_inventory import require_role
from app.routes.Inventory.aggregate_status import update_aggregate_stock_status

router = APIRouter()
logger = logging.getLogger(__name__)


async def validate_ingredients_availability(menu_item_name: str, quantity_sold: int, itemcode: str = None) -> dict:
    """
    Pre-check validation: Verify all ingredients are available BEFORE deducting.
    This prevents partial deductions when some ingredients are insufficient.

    Args:
        menu_item_name: Name of menu item
        quantity_sold: Quantity sold
        itemcode: Item code from sales data (optional, used for matching)

    Returns:
        Dictionary with availability status and details
    """
    try:
        # Find menu item - try itemcode first (most reliable), then name matching
        menu_data = None

        if itemcode:
            # Try matching by itemcode first
            menu_res = postgrest_client.table("menu").select("menu_id, dish_name").eq("itemcode", itemcode).limit(1).execute()
            menu_data = getattr(menu_res, "data", None) or []
            if menu_data:
                logger.info(f"Matched by itemcode '{itemcode}': {menu_data[0]['dish_name']}")

        # If not found by itemcode, try name matching
        if not menu_data:
            menu_res = postgrest_client.table("menu").select("menu_id, dish_name").ilike("dish_name", menu_item_name).limit(1).execute()
            menu_data = getattr(menu_res, "data", None) or []

        # If still not found, try fuzzy matching by removing spaces
        if not menu_data:
            normalized_search = menu_item_name.replace(" ", "").lower()
            all_menu_res = postgrest_client.table("menu").select("menu_id, dish_name").execute()
            all_menu_data = getattr(all_menu_res, "data", None) or []

            for menu in all_menu_data:
                if menu["dish_name"].replace(" ", "").lower() == normalized_search:
                    menu_data = [menu]
                    logger.info(f"Fuzzy matched '{menu_item_name}' to '{menu['dish_name']}'")
                    break

        if not menu_data:
            return {
                "available": False,
                "reason": f"Menu item '{menu_item_name}' not configured",
                "shortages": []
            }

        menu_id = menu_data[0]["menu_id"]

        # Get ingredients
        ingredients_res = postgrest_client.table("menu_ingredients").select("ingredient_name, quantity, measurements").eq("menu_id", menu_id).execute()
        ingredients_data = getattr(ingredients_res, "data", None) or []

        if not ingredients_data:
            return {
                "available": False,
                "reason": f"No ingredients configured for '{menu_item_name}'",
                "shortages": []
            }

        shortages = []

        # Check each ingredient
        for ingredient in ingredients_data:
            ingredient_name = ingredient.get("ingredient_name")
            qty_per_serving = float(ingredient.get("quantity", 0))
            recipe_unit = normalize_unit(ingredient.get("measurements", ""))

            total_qty_needed = qty_per_serving * quantity_sold

            # Get total available stock
            inv_res = postgrest_client.table("inventory_today").select("stock_quantity").ilike("item_name", ingredient_name).execute()
            inv_items = getattr(inv_res, "data", None) or []

            total_available = sum(float(item.get("stock_quantity", 0)) for item in inv_items)

            # Get inventory unit from settings
            settings_res = postgrest_client.table("inventory_settings").select("default_unit").ilike("name", ingredient_name).limit(1).execute()
            settings_data = getattr(settings_res, "data", None) or []
            inventory_unit = normalize_unit(settings_data[0].get("default_unit", recipe_unit)) if settings_data else recipe_unit

            # Convert needed quantity to inventory unit
            if recipe_unit != inventory_unit:
                qty_needed_in_inv_unit = convert_units(total_qty_needed, recipe_unit, inventory_unit)
                if qty_needed_in_inv_unit is None:
                    # Unit conversion failed - log warning but don't fail the sale
                    # Instead, assume 1:1 ratio and check if there's any stock
                    logger.warning(f"Cannot convert {recipe_unit} to {inventory_unit} for '{ingredient_name}'. Using direct comparison.")
                    qty_needed_in_inv_unit = total_qty_needed
                    # If there's any stock available, consider it sufficient (lenient mode)
                    if total_available > 0:
                        logger.info(f"Stock available for '{ingredient_name}' despite unit mismatch. Proceeding.")
                        continue
                    else:
                        shortages.append({
                            "ingredient": ingredient_name,
                            "issue": f"No stock available (unit mismatch: {recipe_unit} vs {inventory_unit})"
                        })
                        continue
            else:
                qty_needed_in_inv_unit = total_qty_needed

            # Check if sufficient
            if total_available < qty_needed_in_inv_unit:
                shortage_qty = qty_needed_in_inv_unit - total_available
                # Convert shortage back to recipe unit for reporting
                if recipe_unit != inventory_unit:
                    shortage_in_recipe = convert_units(shortage_qty, inventory_unit, recipe_unit) or shortage_qty
                    shortage_unit = recipe_unit
                else:
                    shortage_in_recipe = shortage_qty
                    shortage_unit = inventory_unit

                shortages.append({
                    "ingredient": ingredient_name,
                    "needed": format_quantity_with_unit(total_qty_needed, recipe_unit),
                    "available": format_quantity_with_unit(total_available, inventory_unit),
                    "shortage": format_quantity_with_unit(shortage_in_recipe, shortage_unit)
                })

        if shortages:
            return {
                "available": False,
                "reason": "Insufficient ingredients",
                "shortages": shortages
            }

        return {
            "available": True,
            "reason": "All ingredients available",
            "shortages": []
        }

    except Exception as e:
        logger.error(f"Error validating ingredients for '{menu_item_name}': {str(e)}")
        return {
            "available": False,
            "reason": f"Validation error: {str(e)}",
            "shortages": []
        }


async def log_inventory_transaction(
    item_id: int,
    item_name: str,
    batch_date: str,
    category: str,
    qty_before: float,
    qty_changed: float,
    qty_after: float,
    unit: str,
    sale_date: str,
    menu_item: str,
    recipe_unit: str = None,
    recipe_quantity: float = None
):
    """
    Log inventory transaction to audit trail.

    Args:
        item_id: Inventory item ID
        item_name: Item name
        batch_date: Batch date
        category: Category
        qty_before: Quantity before deduction
        qty_changed: Change amount (negative for deduction)
        qty_after: Quantity after deduction
        unit: Unit of measurement
        sale_date: Sale date
        menu_item: Menu item name
        recipe_unit: Original recipe unit (optional)
        recipe_quantity: Original recipe quantity (optional)
    """
    try:
        transaction_data = {
            "transaction_type": "DEDUCTION",
            "item_id": item_id,
            "item_name": item_name,
            "batch_date": batch_date,
            "category": category,
            "quantity_before": qty_before,
            "quantity_changed": qty_changed,  # Negative for deduction
            "quantity_after": qty_after,
            "unit_of_measurement": unit,
            "source_type": "SALES_IMPORT",
            "source_reference": sale_date,
            "menu_item": menu_item,
            "recipe_unit": recipe_unit,
            "recipe_quantity": recipe_quantity,
            "conversion_applied": recipe_unit != unit if recipe_unit else False,
            "created_at": datetime.utcnow().isoformat()
        }

        postgrest_client.table("inventory_transactions").insert(transaction_data).execute()
        logger.info(f"Logged transaction: {item_name} deduction of {abs(qty_changed)} {unit}")

    except Exception as e:
        # Log error but don't fail the deduction
        logger.error(f"Failed to log transaction for {item_name}: {str(e)}")


async def auto_deduct_inventory_from_sales_optimized(sale_date: str, enable_validation: bool = True, db=None):
    """
    OPTIMIZED VERSION: Uses batch operations to dramatically improve performance.
    Reduces thousands of queries down to ~10 queries total.

    Performance improvements:
    - Batch fetch all menu items, ingredients, and inventory settings
    - Build lookup dictionaries for O(1) access
    - Batch all updates at the end
    - Batch all transaction log inserts

    Args:
        sale_date: Date of sales to process
        enable_validation: If True, validate ingredient availability before deducting
        db: Database session for aggregate status updates

    Returns:
        Dictionary with deduction summary, errors, and status updates
    """
    try:
        logger.info(f"[OPTIMIZED] Starting sales import for {sale_date}")

        # STEP 1: Batch fetch sales data
        sales_res = postgrest_client.table("sales_report").select("*").like("sale_date", f"{sale_date}%").execute()
        sales_data = getattr(sales_res, "data", None) or []
        if not sales_data and isinstance(sales_res, dict):
            sales_data = sales_res.get("data", [])

        if not sales_data:
            return {"deductions": [], "errors": ["No sales data found for this date"]}

        logger.info(f"[OPTIMIZED] Processing {len(sales_data)} sales records")

        # STEP 2: Batch fetch all menu items (1 query)
        menu_res = postgrest_client.table("menu").select("menu_id, dish_name, itemcode").execute()
        all_menus = getattr(menu_res, "data", None) or []

        # Build menu lookup dictionaries
        menu_by_itemcode = {m["itemcode"]: m for m in all_menus if m.get("itemcode")}
        menu_by_name = {m["dish_name"].lower(): m for m in all_menus}
        menu_by_normalized = {m["dish_name"].replace(" ", "").lower(): m for m in all_menus}

        logger.info(f"[OPTIMIZED] Loaded {len(all_menus)} menu items")

        # STEP 3: Batch fetch all menu ingredients (1 query)
        ingredients_res = postgrest_client.table("menu_ingredients").select("menu_id, ingredient_name, quantity, measurements").execute()
        all_ingredients = getattr(ingredients_res, "data", None) or []

        # Build ingredients lookup by menu_id
        ingredients_by_menu = {}
        for ing in all_ingredients:
            menu_id = ing["menu_id"]
            if menu_id not in ingredients_by_menu:
                ingredients_by_menu[menu_id] = []
            ingredients_by_menu[menu_id].append(ing)

        logger.info(f"[OPTIMIZED] Loaded {len(all_ingredients)} menu ingredients")

        # STEP 4: Batch fetch all inventory settings (1 query)
        settings_res = postgrest_client.table("inventory_settings").select("name, default_unit").execute()
        all_settings = getattr(settings_res, "data", None) or []

        # Build settings lookup
        settings_by_name = {s["name"].lower(): s for s in all_settings}

        logger.info(f"[OPTIMIZED] Loaded {len(all_settings)} inventory settings")

        # STEP 5: Batch fetch all inventory_today items (1 query)
        inv_res = postgrest_client.table("inventory_today").select("*").order("batch_date", desc=False).execute()
        all_inventory = getattr(inv_res, "data", None) or []

        # Build inventory lookup by item_name (grouped by batches)
        inventory_by_name = {}
        for inv in all_inventory:
            item_name_lower = (inv.get("item_name") or "").lower()
            if item_name_lower not in inventory_by_name:
                inventory_by_name[item_name_lower] = []
            inventory_by_name[item_name_lower].append(inv)

        logger.info(f"[OPTIMIZED] Loaded {len(all_inventory)} inventory items")

        # STEP 6: Process sales and build update/insert batches
        deduction_summary = []
        errors = []
        validation_failures = []
        deducted_items = set()

        # Batch operations
        inventory_updates = []  # List of (item_id, batch_date, new_quantity)
        transaction_logs = []  # List of transaction records

        for sale in sales_data:
            menu_item_name = sale.get("item_name")
            itemcode = sale.get("itemcode")
            quantity_sold = sale.get("quantity", 0)

            if not menu_item_name or quantity_sold <= 0:
                continue

            # Find menu item using pre-loaded data
            menu_data = None
            if itemcode and itemcode in menu_by_itemcode:
                menu_data = menu_by_itemcode[itemcode]
            elif menu_item_name.lower() in menu_by_name:
                menu_data = menu_by_name[menu_item_name.lower()]
            elif menu_item_name.replace(" ", "").lower() in menu_by_normalized:
                menu_data = menu_by_normalized[menu_item_name.replace(" ", "").lower()]

            if not menu_data:
                errors.append(f"Menu item '{menu_item_name}' not found")
                continue

            menu_id = menu_data["menu_id"]
            ingredients = ingredients_by_menu.get(menu_id, [])

            if not ingredients:
                errors.append(f"No ingredients found for '{menu_item_name}'")
                continue

            # VALIDATION: Check all ingredients available (if enabled)
            if enable_validation:
                shortages = []
                for ingredient in ingredients:
                    ingredient_name = ingredient.get("ingredient_name")
                    qty_per_serving = float(ingredient.get("quantity", 0))
                    recipe_unit = normalize_unit(ingredient.get("measurements", ""))
                    total_qty_needed = qty_per_serving * quantity_sold

                    # Get inventory unit from settings
                    ingredient_name_lower = (ingredient_name or "").lower()
                    setting = settings_by_name.get(ingredient_name_lower)
                    inventory_unit = normalize_unit(setting.get("default_unit", recipe_unit)) if setting else recipe_unit

                    # Convert to inventory unit
                    if recipe_unit != inventory_unit:
                        qty_needed_in_inv_unit = convert_units(total_qty_needed, recipe_unit, inventory_unit)
                        if qty_needed_in_inv_unit is None:
                            qty_needed_in_inv_unit = total_qty_needed
                    else:
                        qty_needed_in_inv_unit = total_qty_needed

                    # Check available stock
                    inv_items = inventory_by_name.get(ingredient_name_lower, [])
                    total_available = sum(float(item.get("stock_quantity", 0)) for item in inv_items)

                    if total_available < qty_needed_in_inv_unit:
                        shortage_qty = qty_needed_in_inv_unit - total_available
                        shortages.append({
                            "ingredient": ingredient_name,
                            "needed": format_quantity_with_unit(total_qty_needed, recipe_unit),
                            "available": format_quantity_with_unit(total_available, inventory_unit),
                            "shortage": format_quantity_with_unit(shortage_qty, inventory_unit)
                        })

                if shortages:
                    validation_failures.append({
                        "menu_item": menu_item_name,
                        "quantity_sold": quantity_sold,
                        "reason": "Insufficient ingredients",
                        "shortages": shortages
                    })
                    logger.warning(f"Skipping {menu_item_name}: Insufficient ingredients")
                    continue

            # DEDUCTION: Process each ingredient
            for ingredient in ingredients:
                ingredient_name = ingredient.get("ingredient_name")
                qty_per_serving = float(ingredient.get("quantity", 0))
                recipe_unit = normalize_unit(ingredient.get("measurements", ""))

                if not ingredient_name or qty_per_serving <= 0:
                    continue

                deducted_items.add(ingredient_name)
                total_qty_to_deduct = qty_per_serving * quantity_sold

                # Get inventory unit
                ingredient_name_lower = (ingredient_name or "").lower()
                setting = settings_by_name.get(ingredient_name_lower)
                inventory_unit = normalize_unit(setting.get("default_unit", recipe_unit)) if setting else recipe_unit

                # Convert to inventory unit
                if recipe_unit != inventory_unit:
                    qty_to_deduct = convert_units(total_qty_to_deduct, recipe_unit, inventory_unit)
                    if qty_to_deduct is None:
                        errors.append(f"Cannot convert '{ingredient_name}' from {recipe_unit} to {inventory_unit}")
                        continue
                else:
                    qty_to_deduct = total_qty_to_deduct

                # FIFO deduction from inventory batches
                inv_items = inventory_by_name.get(ingredient_name_lower, [])
                remaining_to_deduct = qty_to_deduct

                for inv_item in inv_items:
                    if remaining_to_deduct <= 0:
                        break

                    current_qty = float(inv_item.get("stock_quantity", 0))
                    deduct_qty = min(current_qty, remaining_to_deduct)
                    new_qty = current_qty - deduct_qty

                    # Update the in-memory inventory (for subsequent sales in same batch)
                    inv_item["stock_quantity"] = new_qty

                    # Add to batch update list
                    inventory_updates.append({
                        "item_id": inv_item["item_id"],
                        "batch_date": inv_item["batch_date"],
                        "new_quantity": new_qty
                    })

                    # Add to transaction log batch
                    transaction_logs.append({
                        "transaction_type": "DEDUCTION",
                        "item_id": inv_item["item_id"],
                        "item_name": ingredient_name,
                        "batch_date": inv_item["batch_date"],
                        "category": inv_item.get("category", ""),
                        "quantity_before": current_qty,
                        "quantity_changed": -deduct_qty,
                        "quantity_after": new_qty,
                        "unit_of_measurement": inventory_unit,
                        "source_type": "SALES_IMPORT",
                        "source_reference": sale_date,
                        "menu_item": menu_item_name,
                        "recipe_unit": recipe_unit,
                        "recipe_quantity": qty_per_serving,
                        "conversion_applied": recipe_unit != inventory_unit,
                        "created_at": datetime.utcnow().isoformat()
                    })

                    deduction_summary.append({
                        "menu_item": menu_item_name,
                        "ingredient": ingredient_name,
                        "deducted": deduct_qty,
                        "new_stock": new_qty,
                        "unit": inventory_unit,
                        "recipe_unit": recipe_unit,
                        "conversion_applied": recipe_unit != inventory_unit
                    })

                    remaining_to_deduct -= deduct_qty

                if remaining_to_deduct > 0:
                    errors.append(f"Insufficient stock for '{ingredient_name}' (short by {format_quantity_with_unit(remaining_to_deduct, inventory_unit)})")

        # STEP 7: Execute batch updates (1 query per update - could be optimized further with bulk update endpoint)
        logger.info(f"[OPTIMIZED] Executing {len(inventory_updates)} inventory updates")
        for update in inventory_updates:
            try:
                postgrest_client.table("inventory_today").update({
                    "stock_quantity": update["new_quantity"],
                    "updated_at": datetime.utcnow().isoformat()
                }).eq("item_id", update["item_id"]).eq("batch_date", update["batch_date"]).execute()
            except Exception as e:
                logger.error(f"Failed to update inventory item {update['item_id']}: {e}")

        # STEP 8: Batch insert transaction logs (1 query)
        if transaction_logs:
            logger.info(f"[OPTIMIZED] Inserting {len(transaction_logs)} transaction logs")
            try:
                postgrest_client.table("inventory_transactions").insert(transaction_logs).execute()
            except Exception as e:
                logger.error(f"Failed to batch insert transaction logs: {e}")

        # STEP 9: Update aggregate stock status
        status_updates = []
        if db and deducted_items:
            logger.info(f"[OPTIMIZED] Updating aggregate stock status for {len(deducted_items)} items")
            for item_name in deducted_items:
                try:
                    new_status = await update_aggregate_stock_status(item_name, "inventory_today", db)
                    status_updates.append({
                        "item_name": item_name,
                        "new_status": new_status
                    })
                except Exception as e:
                    logger.error(f"Failed to update aggregate status for '{item_name}': {e}")

        logger.info(f"[OPTIMIZED] Completed: {len(deduction_summary)} deductions, {len(errors)} errors")

        return {
            "deductions": deduction_summary,
            "errors": errors if errors else None,
            "validation_failures": validation_failures if validation_failures else None,
            "status_updates": status_updates if status_updates else None
        }

    except Exception as e:
        logger.error(f"Error in auto_deduct_inventory_from_sales_optimized: {str(e)}")
        return {"errors": [str(e)]}


async def auto_deduct_inventory_from_sales(sale_date: str, enable_validation: bool = True, db=None):
    """
    Automatically deduct ingredients from today's inventory based on imported sales data.
    Now includes pre-check validation, transaction logging, and aggregate stock status updates.

    Args:
        sale_date: Date of sales to process
        enable_validation: If True, validate ingredient availability before deducting (default: True)
        db: Database session for aggregate status updates

    Returns:
        Dictionary with deduction summary, errors, and status updates
    """
    try:
        # Fetch sales for the given date (use LIKE to match date portion since sale_date includes time)
        sales_res = postgrest_client.table("sales_report").select("*").like("sale_date", f"{sale_date}%").execute()
        sales_data = getattr(sales_res, "data", None) or []
        if not sales_data and isinstance(sales_res, dict):
            sales_data = sales_res.get("data", [])

        deduction_summary = []
        errors = []
        validation_failures = []
        deducted_items = set()  # Track items that were deducted for status update

        for sale in sales_data:
            menu_item_name = sale.get("item_name")
            itemcode = sale.get("itemcode")
            quantity_sold = sale.get("quantity", 0)

            if not menu_item_name or quantity_sold <= 0:
                continue

            # PRE-CHECK VALIDATION: Verify all ingredients available
            if enable_validation:
                validation_result = await validate_ingredients_availability(menu_item_name, quantity_sold, itemcode)

                if not validation_result["available"]:
                    validation_failures.append({
                        "menu_item": menu_item_name,
                        "quantity_sold": quantity_sold,
                        "reason": validation_result["reason"],
                        "shortages": validation_result["shortages"]
                    })

                    # Enhanced logging: show which specific ingredients are causing the shortage
                    shortage_details = []
                    for shortage in validation_result.get("shortages", []):
                        ingredient = shortage.get("ingredient", "Unknown")
                        needed = shortage.get("needed", "N/A")
                        available = shortage.get("available", "N/A")
                        short_by = shortage.get("shortage", "N/A")
                        issue = shortage.get("issue", "")

                        if issue:
                            shortage_details.append(f"{ingredient}: {issue}")
                        else:
                            shortage_details.append(f"{ingredient} (needed: {needed}, available: {available}, short: {short_by})")

                    shortage_text = "; ".join(shortage_details) if shortage_details else "No details"
                    logger.warning(f"Skipping {menu_item_name} (qty: {quantity_sold}): {validation_result['reason']} - {shortage_text}")
                    continue  # Skip this sale if validation fails

            try:
                # Find the menu item - try itemcode first (most reliable), then name matching
                menu_data = None

                if itemcode:
                    # Try matching by itemcode first
                    menu_res = postgrest_client.table("menu").select("menu_id, dish_name").eq("itemcode", itemcode).limit(1).execute()
                    menu_data = getattr(menu_res, "data", None) or []
                    if isinstance(menu_res, dict):
                        menu_data = menu_res.get("data", [])
                    if menu_data:
                        logger.info(f"Matched by itemcode '{itemcode}': {menu_data[0]['dish_name']}")

                # If not found by itemcode, try name matching
                if not menu_data:
                    menu_res = postgrest_client.table("menu").select("menu_id, dish_name").ilike("dish_name", menu_item_name).limit(1).execute()
                    menu_data = getattr(menu_res, "data", None) or []
                    if isinstance(menu_res, dict):
                        menu_data = menu_res.get("data", [])

                # If still not found, try fuzzy matching by removing spaces
                if not menu_data:
                    normalized_search = menu_item_name.replace(" ", "").lower()
                    all_menu_res = postgrest_client.table("menu").select("menu_id, dish_name").execute()
                    all_menu_data = getattr(all_menu_res, "data", None) or []
                    if isinstance(all_menu_res, dict):
                        all_menu_data = all_menu_res.get("data", [])

                    for menu in all_menu_data:
                        if menu["dish_name"].replace(" ", "").lower() == normalized_search:
                            menu_data = [menu]
                            logger.info(f"Fuzzy matched '{menu_item_name}' to '{menu['dish_name']}'")
                            break

                if not menu_data:
                    logger.warning(f"Menu item '{menu_item_name}' (itemcode: {itemcode}) not found")
                    continue

                menu_id = menu_data[0]["menu_id"]

                # Get all ingredients for this menu item
                ingredients_res = postgrest_client.table("menu_ingredients").select("ingredient_name, quantity, measurements").eq("menu_id", menu_id).execute()
                ingredients_data = getattr(ingredients_res, "data", None) or []
                if isinstance(ingredients_res, dict):
                    ingredients_data = ingredients_res.get("data", [])

                if not ingredients_data:
                    logger.warning(f"No ingredients found for menu item '{menu_item_name}'")
                    continue

                # Deduct each ingredient from inventory_today using FIFO
                for ingredient in ingredients_data:
                    ingredient_name = ingredient.get("ingredient_name")
                    qty_per_serving = float(ingredient.get("quantity", 0))
                    recipe_unit = normalize_unit(ingredient.get("measurements", ""))

                    if not ingredient_name or qty_per_serving <= 0:
                        continue

                    # Track this ingredient for aggregate status update
                    deducted_items.add(ingredient_name)

                    total_qty_to_deduct = qty_per_serving * quantity_sold

                    # FIFO: order by batch_date ascending (oldest first)
                    inv_res = postgrest_client.table("inventory_today").select("*").ilike("item_name", ingredient_name).order("batch_date", desc=False).execute()
                    inv_items = getattr(inv_res, "data", None) or []
                    if isinstance(inv_res, dict):
                        inv_items = inv_res.get("data", [])

                    if not inv_items:
                        errors.append(f"Ingredient '{ingredient_name}' not found in today's inventory")
                        continue

                    # Get inventory unit from settings (assuming first item has correct unit)
                    # In a real system, you might want to fetch this from inventory_settings
                    inventory_unit = recipe_unit  # Default to recipe unit

                    # Check if we need to get the actual inventory unit from settings
                    try:
                        settings_res = postgrest_client.table("inventory_settings").select("default_unit").ilike("name", ingredient_name).limit(1).execute()
                        settings_data = getattr(settings_res, "data", None) or []
                        if isinstance(settings_res, dict):
                            settings_data = settings_res.get("data", [])
                        if settings_data and len(settings_data) > 0:
                            inventory_unit = normalize_unit(settings_data[0].get("default_unit", recipe_unit))
                    except Exception as e:
                        logger.warning(f"Could not fetch unit from settings for {ingredient_name}: {e}")

                    # Convert recipe quantity to inventory unit if needed
                    if recipe_unit != inventory_unit:
                        converted_qty = convert_units(total_qty_to_deduct, recipe_unit, inventory_unit)
                        if converted_qty is None:
                            errors.append(f"Cannot convert '{ingredient_name}' from {recipe_unit} to {inventory_unit} (incompatible units)")
                            continue
                        qty_to_deduct = converted_qty
                    else:
                        qty_to_deduct = total_qty_to_deduct

                    original_qty_to_deduct = qty_to_deduct

                    for inv_item in inv_items:
                        if qty_to_deduct <= 0:
                            break

                        current_qty = float(inv_item.get("stock_quantity", 0))
                        deduct_qty = min(current_qty, qty_to_deduct)
                        new_qty = max(current_qty - deduct_qty, 0)

                        # Update inventory_today
                        update_res = postgrest_client.table("inventory_today").update({
                            "stock_quantity": new_qty,
                            "updated_at": datetime.utcnow().isoformat()
                        }).eq("item_id", inv_item["item_id"]).eq("batch_date", inv_item["batch_date"]).execute()

                        if update_res.data:
                            # Log transaction for audit trail
                            await log_inventory_transaction(
                                item_id=inv_item["item_id"],
                                item_name=ingredient_name,
                                batch_date=inv_item["batch_date"],
                                category=inv_item.get("category", ""),
                                qty_before=current_qty,
                                qty_changed=-deduct_qty,
                                qty_after=new_qty,
                                unit=inventory_unit,
                                sale_date=sale_date,
                                menu_item=menu_item_name,
                                recipe_unit=recipe_unit,
                                recipe_quantity=qty_per_serving
                            )

                            deduction_summary.append({
                                "menu_item": menu_item_name,
                                "ingredient": ingredient_name,
                                "deducted": deduct_qty,
                                "new_stock": new_qty,
                                "unit": inventory_unit,
                                "recipe_unit": recipe_unit,
                                "conversion_applied": recipe_unit != inventory_unit
                            })

                        qty_to_deduct -= deduct_qty

                    if qty_to_deduct > 0:
                        # Convert shortage back to recipe unit for error message
                        if recipe_unit != inventory_unit:
                            shortage_in_recipe_unit = convert_units(qty_to_deduct, inventory_unit, recipe_unit) or qty_to_deduct
                            errors.append(f"Insufficient stock for '{ingredient_name}' (short by {format_quantity_with_unit(shortage_in_recipe_unit, recipe_unit)})")
                        else:
                            errors.append(f"Insufficient stock for '{ingredient_name}' (short by {format_quantity_with_unit(qty_to_deduct, inventory_unit)})")

            except Exception as e:
                logger.error(f"Error processing menu item '{menu_item_name}': {str(e)}")
                errors.append(f"Error processing '{menu_item_name}': {str(e)}")

        # Update aggregate stock status for all deducted items
        status_updates = []
        if db and deducted_items:
            logger.info(f"Updating aggregate stock status for {len(deducted_items)} deducted items")
            for item_name in deducted_items:
                try:
                    new_status = await update_aggregate_stock_status(item_name, "inventory_today", db)
                    status_updates.append({
                        "item_name": item_name,
                        "new_status": new_status
                    })
                    logger.info(f"Updated '{item_name}' aggregate status to: {new_status}")
                except Exception as e:
                    logger.error(f"Failed to update aggregate status for '{item_name}': {str(e)}")
        else:
            if not db:
                logger.warning("No database session provided - skipping aggregate status updates")

        return {
            "deductions": deduction_summary,
            "errors": errors if errors else None,
            "validation_failures": validation_failures if validation_failures else None,
            "status_updates": status_updates if status_updates else None
        }

    except Exception as e:
        logger.error(f"Error in auto_deduct_inventory_from_sales: {str(e)}")
        return {"errors": [str(e)]}


@router.post("/import-sales")
async def import_sales(
    request: Request,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
    db=Depends(get_db),
):
    data = await request.json()
    rows = data.get("rows", [])
    auto_deduct = data.get("auto_deduct", False)  # Default to False - explicit opt-in required

    # Import rows individually with all detailed fields (NO aggregation)
    imported = 0
    sale_dates = set()

    for row in rows:
        # Extract all fields from Excel import
        itemcode = row.get("itemcode") or row.get("itemcodex") or ""
        item_name = row.get("item_name") or row.get("itemname") or ""

        # Parse date and time
        date_str = row.get("date", "")
        time_str = row.get("time", "")

        # Combine date and time if both present
        if date_str and time_str:
            try:
                sale_datetime = f"{date_str} {time_str}"
            except:
                sale_datetime = date_str
        else:
            sale_datetime = date_str or datetime.utcnow().date().isoformat()

        # Build detailed row with all restaurant fields from your Excel
        db_row = {
            "itemcode": itemcode,
            "item_name": item_name,
            "quantity": int(row.get("quantity", 0)),
            "unit_price": float(row.get("price", 0)),  # Unit price
            "price": float(row.get("price", 0)),
            "subtotal": float(row.get("amount", 0)),  # Amount before discount
            "total_price": float(row.get("netamount", row.get("amount", 0))),  # Final price after discount
            "sale_date": sale_datetime,
            "category": row.get("category", ""),

            # Discount field (sdisc_perc is the discount percentage that has data)
            "discount_percentage": float(row.get("sdisc_perc", 0)),

            # Order details
            "order_number": row.get("orderno", ""),
            "transaction_number": row.get("transno", row.get("transactionno", "")),
            "receipt_number": row.get("receptno", row.get("receiptno", "")),

            # Service details
            "dine_type": row.get("dinetype", ""),
            "order_taker": row.get("ordertaker", ""),
            "cashier": row.get("cashier", ""),
            "terminal_no": row.get("terminalno", ""),

            # Customer details
            "member": row.get("member", ""),
        }

        res = supabase.table("sales_report").insert(db_row).execute()
        if res.data is not None:
            imported += 1
            if date_str:
                sale_dates.add(date_str)

    response = {
        "message": "Sales data imported successfully with detailed information",
        "rows": imported
    }

    # Automatically deduct inventory if enabled - WITH DATE VALIDATION
    if auto_deduct and sale_dates:
        logger.info(f"AUTO-DEDUCTION ENABLED: Processing {len(sale_dates)} sale dates: {list(sale_dates)}")

        # Get today's date in Philippine timezone (UTC+8)
        from datetime import timezone
        ph_tz = timezone(timedelta(hours=8))
        today_str = datetime.now(ph_tz).date().isoformat()
        logger.info(f"Today's date (PH timezone): {today_str}")

        # Separate today's sales from historical sales
        today_sales = []
        historical_sales = []

        for sale_date in sale_dates:
            if sale_date == today_str:
                today_sales.append(sale_date)
            else:
                historical_sales.append(sale_date)

        deduction_results = []

        # Only process today's sales for auto-deduction (USING OPTIMIZED VERSION)
        if today_sales:
            logger.info(f"Processing auto-deduction for TODAY's sales: {today_sales}")
            for sale_date in today_sales:
                deduction_result = await auto_deduct_inventory_from_sales_optimized(sale_date, enable_validation=True, db=db)
                deduction_results.append({
                    "sale_date": sale_date,
                    "result": deduction_result,
                    "processed": True
                })
            response["inventory_deduction"] = deduction_results
            response["message"] += " and inventory automatically updated for today's sales (OPTIMIZED with batch operations)"

        # Log warning for historical sales
        if historical_sales:
            logger.warning(f"SKIPPED auto-deduction for HISTORICAL sales (not today): {historical_sales}")
            for sale_date in historical_sales:
                deduction_results.append({
                    "sale_date": sale_date,
                    "result": {
                        "deductions": [],
                        "errors": None,
                        "validation_failures": None,
                        "skipped_reason": f"Historical sales date ({sale_date}) - auto-deduct only works for today's date ({today_str})"
                    },
                    "processed": False
                })
            response["inventory_deduction"] = deduction_results
            response["message"] += f". Warning: {len(historical_sales)} historical sale date(s) skipped (auto-deduct only works for today)"
    else:
        if not auto_deduct:
            logger.info("AUTO-DEDUCTION DISABLED: Skipping inventory deduction")
        else:
            logger.info("AUTO-DEDUCTION SKIPPED: No sale dates to process")

    # Log user activity for sales import
    try:
        user_row = getattr(user, "user_row", user)
        date_range = f"{min(sale_dates)} to {max(sale_dates)}" if len(sale_dates) > 1 else list(sale_dates)[0] if sale_dates else "N/A"
        new_activity = UserActivityLog(
            user_id=user_row.get("user_id"),
            action_type="import sales report",
            description=f"Imported {imported} sales records for date(s): {date_range}. Auto-deduct: {'Yes' if auto_deduct else 'No'}",
            activity_date=datetime.utcnow(),
            report_date=datetime.utcnow(),
            user_name=user_row.get("name"),
            role=user_row.get("user_role"),
        )
        db.add(new_activity)
        db.flush()
        db.commit()
    except Exception as e:
        logger.warning(f"Failed to record user activity for sales import: {e}")

    return response