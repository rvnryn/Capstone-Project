from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime
from app.routes.Inventory.today_inventory import get_db
from app.routes.Menu.menu import recalculate_stock_status
from app.supabase import postgrest_client
from typing import Optional

router = APIRouter()

@router.post("/sales/recalculate-inventory-today")
async def recalculate_inventory_today_from_sales(
    request: Request,
    db=Depends(get_db),
):
    """
    Deduct sold quantities from inventory_today based on sales records (FIFO by batch_date).
    Now supports menu recipes: deduct ingredients for each sold menu item.
    """
    try:
        today = datetime.utcnow().date()

        # Fetch today's sales
        sales_res = postgrest_client.table("sales_report").select("*").eq("sale_date", today).execute()
        sales_data = getattr(sales_res, "data", None)
        if not sales_data and isinstance(sales_res, dict):
            sales_data = sales_res.get("data", [])
        sales_data = sales_data or []

        for sale in sales_data:
            menu_item = sale.get("item_name")
            quantity_sold = sale.get("quantity_sold", 0)

            # Fetch menu recipe for this menu item
            recipe_res = postgrest_client.table("menu_recipe").select("*").eq("menu_item", menu_item).execute()
            recipe_data = getattr(recipe_res, "data", None)
            if not recipe_data and isinstance(recipe_res, dict):
                recipe_data = recipe_res.get("data", [])
            recipe_data = recipe_data or []

            # For each ingredient in the recipe, deduct from inventory
            for ingredient in recipe_data:
                ingredient_name = ingredient.get("ingredient_name")
                qty_per_serving = ingredient.get("quantity", 0)
                total_qty_to_deduct = qty_per_serving * quantity_sold

                # FIFO deduction from inventory_today
                inv_res = postgrest_client.table("inventory_today").select("*").eq("item_name", ingredient_name).order("batch_date", asc=True).execute()
                inv_items = getattr(inv_res, "data", None)
                if not inv_items and isinstance(inv_res, dict):
                    inv_items = inv_res.get("data", [])
                inv_items = inv_items or []

                qty_to_deduct = total_qty_to_deduct
                for inv_item in inv_items:
                    if qty_to_deduct <= 0:
                        break
                    current_qty = inv_item.get("stock_quantity", 0)
                    deduct_qty = min(current_qty, qty_to_deduct)
                    new_qty = max(current_qty - deduct_qty, 0)

                    postgrest_client.table("inventory_today").update(
                        {"stock_quantity": new_qty}
                    ).eq("item_id", inv_item["item_id"]).eq("batch_date", inv_item["batch_date"]).execute()

                    qty_to_deduct -= deduct_qty

        recalculate_stock_status()

        return {"message": "inventory_today successfully recalculated based on sales and menu recipes."}
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
