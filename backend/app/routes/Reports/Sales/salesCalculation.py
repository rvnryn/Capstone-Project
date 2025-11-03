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
    Calculate Cost of Goods Sold (COGS) for a given date.
    Formula: COGS = Σ (quantity_sold × unit_price)
    """
    try:
        target_date = datetime.strptime(sale_date, "%Y-%m-%d").date() if sale_date else datetime.utcnow().date()

        sales_res = postgrest_client.table("sales_report").select("*").eq("sale_date", target_date).execute()
        sales_data = getattr(sales_res, "data", None)
        if not sales_data and isinstance(sales_res, dict):
            sales_data = sales_res.get("data", [])
        sales_data = sales_data or []

        total_cogs = 0.0

        for sale in sales_data:
            item_name = sale.get("item_name")
            quantity_sold = sale.get("quantity_sold", 0)

            inv_res = postgrest_client.table("inventory_today").select("*").eq("item_name", item_name).order("batch_date", asc=True).execute()
            inv_items = getattr(inv_res, "data", None)
            if not inv_items and isinstance(inv_res, dict):
                inv_items = inv_res.get("data", [])
            inv_items = inv_items or []

            qty_to_deduct = quantity_sold
            for inv_item in inv_items:
                if qty_to_deduct <= 0:
                    break
                current_qty = inv_item.get("stock_quantity", 0)
                deduct_qty = min(current_qty, qty_to_deduct)
                unit_price = inv_item.get("unit_price", 0)
                total_cogs += deduct_qty * unit_price
                qty_to_deduct -= deduct_qty

        return {"sale_date": str(target_date), "total_cogs": total_cogs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"[{type(e).__name__}] {str(e)}")
