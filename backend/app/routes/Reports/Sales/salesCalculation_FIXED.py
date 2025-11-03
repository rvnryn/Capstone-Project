from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime
from app.routes.Inventory.today_inventory import get_db
from app.routes.Menu.menu import recalculate_stock_status
from app.supabase import postgrest_client
from typing import Optional
from app.utils.unit_converter import convert_units, normalize_unit, format_quantity_with_unit
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/sales/recalculate-inventory-today")
async def recalculate_inventory_today_from_sales(
    request: Request,
    db=Depends(get_db),
):
    """
    Deduct sold quantities from inventory_today based on sales records (FIFO by batch_date).
    Supports menu ingredients: deduct ingredients for each sold menu item.
    """
    try:
        today = datetime.utcnow().date()

        # Fetch today's sales
        sales_res = postgrest_client.table("sales_report").select("*").eq("sale_date", str(today)).execute()
        sales_data = getattr(sales_res, "data", None)
        if not sales_data and isinstance(sales_res, dict):
            sales_data = sales_res.get("data", [])
        sales_data = sales_data or []

        deduction_summary = []
        errors = []

        for sale in sales_data:
            menu_item_name = sale.get("item_name")
            quantity_sold = sale.get("quantity", 0) or sale.get("quantity_sold", 0)

            if not menu_item_name or quantity_sold <= 0:
                continue

            try:
                # Step 1: Find the menu item
                menu_res = postgrest_client.table("menu").select("menu_id, dish_name").ilike("dish_name", menu_item_name).limit(1).execute()
                menu_data = getattr(menu_res, "data", None)
                if not menu_data and isinstance(menu_res, dict):
                    menu_data = menu_res.get("data", [])
                menu_data = menu_data or []

                if not menu_data:
                    errors.append(f"Menu item '{menu_item_name}' not found in menu")
                    continue

                menu_id = menu_data[0]["menu_id"]

                # Step 2: Get all ingredients for this menu item from menu_ingredients table
                ingredients_res = postgrest_client.table("menu_ingredients").select("ingredient_name, quantity, measurements").eq("menu_id", menu_id).execute()
                ingredients_data = getattr(ingredients_res, "data", None)
                if not ingredients_data and isinstance(ingredients_res, dict):
                    ingredients_data = ingredients_res.get("data", [])
                ingredients_data = ingredients_data or []

                if not ingredients_data:
                    errors.append(f"No ingredients found for menu item '{menu_item_name}'")
                    continue

                # Step 3: For each ingredient, deduct from inventory_today using FIFO with unit conversion
                for ingredient in ingredients_data:
                    ingredient_name = ingredient.get("ingredient_name")
                    qty_per_serving = float(ingredient.get("quantity", 0))
                    recipe_unit = normalize_unit(ingredient.get("measurements", ""))

                    if not ingredient_name or qty_per_serving <= 0:
                        continue

                    total_qty_to_deduct = qty_per_serving * quantity_sold

                    # FIFO deduction from inventory_today (order by batch_date ascending)
                    inv_res = postgrest_client.table("inventory_today").select("*").ilike("item_name", ingredient_name).order("batch_date", desc=False).execute()
                    inv_items = getattr(inv_res, "data", None)
                    if not inv_items and isinstance(inv_res, dict):
                        inv_items = inv_res.get("data", [])
                    inv_items = inv_items or []

                    if not inv_items:
                        errors.append(f"Ingredient '{ingredient_name}' not found in today's inventory")
                        continue

                    # Get inventory unit from settings
                    inventory_unit = recipe_unit
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
                            deduction_summary.append({
                                "menu_item": menu_item_name,
                                "ingredient": ingredient_name,
                                "batch_date": inv_item["batch_date"],
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
                errors.append(f"Error processing menu item '{menu_item_name}': {str(e)}")

        # Recalculate stock status after all deductions
        recalculate_stock_status()

        return {
            "message": "inventory_today successfully recalculated based on sales and menu ingredients.",
            "deductions": deduction_summary,
            "errors": errors if errors else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"[{type(e).__name__}] {str(e)}")


@router.get("/sales/calculate-cogs")
async def calculate_sales_cogs(
    sale_date: Optional[str] = None,
):
    """
    FIXED VERSION: Calculate Cost of Goods Sold (COGS) for a given date.
    Properly resolves menu items → ingredients → inventory using FIFO.
    Formula: COGS = Σ (ingredient_qty_used × ingredient_unit_cost)
    """
    try:
        target_date = datetime.strptime(sale_date, "%Y-%m-%d").date() if sale_date else datetime.utcnow().date()

        # Fetch all sales for the target date
        sales_res = postgrest_client.table("sales_report") \
            .select("*") \
            .eq("sale_date", str(target_date)) \
            .execute()
        sales_data = getattr(sales_res, "data", None) or []
        if isinstance(sales_res, dict):
            sales_data = sales_res.get("data", [])

        total_cogs = 0.0
        cogs_breakdown = []
        errors = []

        for sale in sales_data:
            menu_item_name = sale.get("item_name")
            quantity_sold = sale.get("quantity", 0)

            if not menu_item_name or quantity_sold <= 0:
                continue

            try:
                # Step 1: Find the menu item
                menu_res = postgrest_client.table("menu") \
                    .select("menu_id, dish_name") \
                    .ilike("dish_name", menu_item_name) \
                    .limit(1) \
                    .execute()
                menu_data = getattr(menu_res, "data", None) or []
                if isinstance(menu_res, dict):
                    menu_data = menu_res.get("data", [])

                if not menu_data:
                    logger.warning(f"Menu item '{menu_item_name}' not found for COGS calculation")
                    errors.append(f"Menu item '{menu_item_name}' not found")
                    continue

                menu_id = menu_data[0]["menu_id"]

                # Step 2: Get all ingredients for this menu item
                ingredients_res = postgrest_client.table("menu_ingredients") \
                    .select("ingredient_name, quantity, measurements") \
                    .eq("menu_id", menu_id) \
                    .execute()
                ingredients_data = getattr(ingredients_res, "data", None) or []
                if isinstance(ingredients_res, dict):
                    ingredients_data = ingredients_res.get("data", [])

                if not ingredients_data:
                    logger.warning(f"No ingredients found for menu item '{menu_item_name}'")
                    errors.append(f"No ingredients found for '{menu_item_name}'")
                    continue

                # Step 3: Calculate COGS for each ingredient
                for ingredient in ingredients_data:
                    ingredient_name = ingredient.get("ingredient_name")
                    qty_per_serving = float(ingredient.get("quantity", 0))
                    recipe_unit = normalize_unit(ingredient.get("measurements", ""))

                    if not ingredient_name or qty_per_serving <= 0:
                        continue

                    total_qty_used = qty_per_serving * quantity_sold

                    # Get unit cost from inventory_today (FIFO - use oldest batches)
                    inv_res = postgrest_client.table("inventory_today") \
                        .select("*") \
                        .ilike("item_name", ingredient_name) \
                        .order("batch_date", desc=False) \
                        .execute()
                    inv_items = getattr(inv_res, "data", None) or []
                    if isinstance(inv_res, dict):
                        inv_items = inv_res.get("data", [])

                    if not inv_items:
                        # Fallback to average unit_cost from all inventory tables
                        avg_cost = await get_average_unit_cost(ingredient_name)
                        ingredient_cogs = total_qty_used * avg_cost

                        if avg_cost > 0:
                            logger.info(f"Using average unit cost for '{ingredient_name}': ₱{avg_cost:.4f}")
                    else:
                        # Use FIFO unit costs
                        ingredient_cogs = 0.0
                        qty_remaining = total_qty_used

                        for inv_item in inv_items:
                            if qty_remaining <= 0:
                                break

                            current_qty = float(inv_item.get("stock_quantity", 0))
                            deduct_qty = min(current_qty, qty_remaining)
                            unit_cost = float(inv_item.get("unit_cost", 0))

                            ingredient_cogs += deduct_qty * unit_cost
                            qty_remaining -= deduct_qty

                        # If we couldn't get enough from inventory_today, use average for remainder
                        if qty_remaining > 0:
                            avg_cost = await get_average_unit_cost(ingredient_name)
                            ingredient_cogs += qty_remaining * avg_cost
                            logger.warning(
                                f"Insufficient inventory_today for '{ingredient_name}': "
                                f"used average cost for remaining {qty_remaining:.2f} {recipe_unit}"
                            )

                    total_cogs += ingredient_cogs
                    cogs_breakdown.append({
                        "menu_item": menu_item_name,
                        "ingredient": ingredient_name,
                        "quantity_used": total_qty_used,
                        "unit": recipe_unit,
                        "cost": round(ingredient_cogs, 2)
                    })

            except Exception as e:
                logger.error(f"Error calculating COGS for '{menu_item_name}': {str(e)}")
                errors.append(f"Error calculating COGS for '{menu_item_name}': {str(e)}")

        return {
            "sale_date": str(target_date),
            "total_cogs": round(total_cogs, 2),
            "breakdown": cogs_breakdown,
            "errors": errors if errors else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"[{type(e).__name__}] {str(e)}")


async def get_average_unit_cost(ingredient_name: str) -> float:
    """
    Get average unit cost for an ingredient across all inventory tables.
    Uses weighted average based on stock quantities.
    """
    tables = ["inventory_today", "inventory", "inventory_surplus"]
    total_cost = 0.0
    total_qty = 0.0

    for table in tables:
        try:
            res = postgrest_client.table(table) \
                .select("stock_quantity, unit_cost") \
                .ilike("item_name", ingredient_name) \
                .execute()
            items = getattr(res, "data", None) or []
            if isinstance(res, dict):
                items = res.get("data", [])

            for item in items:
                qty = float(item.get("stock_quantity", 0))
                cost = float(item.get("unit_cost", 0))

                if qty > 0 and cost > 0:
                    total_cost += qty * cost
                    total_qty += qty
        except Exception as e:
            logger.warning(f"Error fetching unit cost from {table} for {ingredient_name}: {e}")
            continue

    if total_qty > 0:
        return total_cost / total_qty
    else:
        logger.warning(f"No unit cost found for ingredient '{ingredient_name}' in any inventory table")
        return 0.0
