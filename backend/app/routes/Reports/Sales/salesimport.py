from fastapi import APIRouter, HTTPException, Request, Depends
import pandas as pd
from io import BytesIO
from datetime import datetime
from app.supabase import supabase, postgrest_client, get_db
import logging
from app.utils.unit_converter import convert_units, get_unit_type, normalize_unit, format_quantity_with_unit
from app.models.user_activity_log import UserActivityLog
from app.routes.Inventory.master_inventory import require_role

router = APIRouter()
logger = logging.getLogger(__name__)


async def auto_deduct_inventory_from_sales(sale_date: str):
    """
    Automatically deduct ingredients from today's inventory based on imported sales data.
    This function is called after sales import to update inventory quantities.
    """
    try:
        # Fetch sales for the given date
        sales_res = postgrest_client.table("sales_report").select("*").eq("sale_date", sale_date).execute()
        sales_data = getattr(sales_res, "data", None) or []
        if not sales_data and isinstance(sales_res, dict):
            sales_data = sales_res.get("data", [])

        deduction_summary = []
        errors = []

        for sale in sales_data:
            menu_item_name = sale.get("item_name")
            quantity_sold = sale.get("quantity", 0)

            if not menu_item_name or quantity_sold <= 0:
                continue

            try:
                # Find the menu item
                menu_res = postgrest_client.table("menu").select("menu_id, dish_name").ilike("dish_name", menu_item_name).limit(1).execute()
                menu_data = getattr(menu_res, "data", None) or []
                if isinstance(menu_res, dict):
                    menu_data = menu_res.get("data", [])

                if not menu_data:
                    logger.warning(f"Menu item '{menu_item_name}' not found")
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

        return {
            "deductions": deduction_summary,
            "errors": errors if errors else None
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
    auto_deduct = data.get("auto_deduct", True)  # Default to True for automatic deduction

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

    # Automatically deduct inventory if enabled
    if auto_deduct and sale_dates:
        deduction_results = []
        for sale_date in sale_dates:
            deduction_result = await auto_deduct_inventory_from_sales(sale_date)
            deduction_results.append({
                "sale_date": sale_date,
                "result": deduction_result
            })

        response["inventory_deduction"] = deduction_results
        response["message"] += " and inventory automatically updated"

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