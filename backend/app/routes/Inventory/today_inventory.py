from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime
from pydantic import BaseModel, Field, validator
from typing import Optional
from app.routes.Inventory.master_inventory import (
    run_blocking,
    get_threshold_for_item,
    calculate_stock_status,
    postgrest_client,
    get_db,
    UserActivityLog,
    require_role,
    limiter,
    logger,
    CategoryEnum,
    StockStatusEnum,
)
import functools
import asyncio

router = APIRouter()


class InventoryItemUpdate(BaseModel):
    """Today's inventory update with comprehensive validation"""
    item_name: Optional[str] = Field(
        None,
        min_length=2,
        max_length=100,
        description="Item name (2-100 characters)"
    )
    batch_date: Optional[str] = None
    category: Optional[CategoryEnum] = Field(
        None,
        description="Item category from predefined list"
    )
    stock_status: Optional[StockStatusEnum] = Field(
        None,
        description="Current stock status"
    )
    stock_quantity: Optional[float] = Field(
        None,
        ge=0,
        description="Stock quantity (must be >= 0)"
    )
    expiration_date: Optional[str] = None
    unit_cost: Optional[float] = Field(
        None,
        ge=0,
        description="Unit cost in pesos (must be >= 0)"
    )

    @validator('item_name')
    def validate_item_name(cls, v):
        """Ensure item name doesn't contain only whitespace"""
        if v is not None:
            if not v.strip():
                raise ValueError('Item name cannot be empty or only whitespace')
            return v.strip()
        return v

    @validator('stock_quantity')
    def validate_stock_quantity(cls, v):
        """Additional validation for stock quantity"""
        if v is not None:
            if v < 0:
                raise ValueError('Stock quantity cannot be negative')
            if v > 1000000:
                raise ValueError('Stock quantity exceeds maximum allowed (1,000,000)')
        return v

    @validator('unit_cost')
    def validate_unit_cost(cls, v):
        """Validate unit cost range"""
        if v is not None:
            if v < 0:
                raise ValueError('Unit cost cannot be negative')
            if v > 1000000:
                raise ValueError('Unit cost exceeds maximum allowed (₱1,000,000)')
        return v


@router.get("/inventory-today")
async def list_inventory_today(request: Request):
    try:

        @run_blocking
        def _fetch():
            # Get inventory items and manually join with inventory_settings
            inv_response = postgrest_client.table("inventory_today").select("*").order("batch_date", desc=False).execute()
            settings_response = postgrest_client.table("inventory_settings").select("name, default_unit").execute()
            return (inv_response, settings_response)

        items_response, settings_response = await _fetch()

        # Create a lookup dict for settings by lowercase item name
        settings_dict = {}
        for setting in settings_response.data:
            name_lower = setting.get("name", "").lower().strip()
            settings_dict[name_lower] = setting.get("default_unit", "")

        # Add default_unit to each inventory item
        for item in items_response.data:
            item_name_lower = item.get("item_name", "").lower().strip()
            item["default_unit"] = settings_dict.get(item_name_lower, "")

        return items_response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@limiter.limit("10/minute")
@router.get("/inventory-today/{item_id}/{batch_date}")
async def get_inventory_today_item(request: Request, item_id: int, batch_date: str):
    try:
        
        @run_blocking
        def _fetch():
            return (
                postgrest_client.table("inventory_today")
                .select("*")
                .eq("item_id", item_id)
                .eq("batch_date", batch_date)
                .single()
                .execute()
            )

        response = await _fetch()
        if not response.data:
            raise HTTPException(status_code=404, detail="Item not found")
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@limiter.limit("10/minute")
@router.delete("/inventory-today/{item_id}/{batch_date}")
async def delete_inventory_today_item(
    request: Request,
    item_id: int,
    batch_date: str,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
    db=Depends(get_db),
):
    try:
        
        @run_blocking
        def _delete():
            return (
                postgrest_client.table("inventory_today")
                .delete()
                .eq("item_id", item_id)
                .eq("batch_date", batch_date)
                .execute()
            )

        response = await _delete()
        if not response.data:
            raise HTTPException(status_code=404, detail="Item not found")
        # Log user activity for deletion
        try:
            await log_user_activity(
                db,
                user,
                "delete inventory today",
                f"Deleted inventory item with id {item_id}",
            )
        except Exception:
            pass
        return {"message": "Item deleted successfully", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@limiter.limit("10/minute")
@router.put("/inventory-today/{item_id}/{batch_date}")
async def update_inventory_today_item(
    request: Request,
    item_id: int,
    batch_date: str,
    item: InventoryItemUpdate,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
    db=Depends(get_db),
):
    try:
        update_data = item.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow().isoformat()

        # Track item name for aggregate status update
        item_name_for_aggregate = update_data.get("item_name")

        # Calculate and update stock status if quantity or item_name is provided
        if "stock_quantity" in update_data and "item_name" in update_data:
            threshold = await get_threshold_for_item(update_data["item_name"])
            update_data["stock_status"] = calculate_stock_status(update_data["stock_quantity"], threshold)

        # If only stock_quantity is updated, fetch item_name for aggregate update
        if "stock_quantity" in update_data and not item_name_for_aggregate:
            @run_blocking
            def _fetch_item_name():
                return (
                    postgrest_client.table("inventory_today")
                    .select("item_name")
                    .eq("item_id", item_id)
                    .eq("batch_date", batch_date)
                    .single()
                    .execute()
                )
            item_resp = await _fetch_item_name()
            if item_resp.data:
                item_name_for_aggregate = item_resp.data.get("item_name")

        @run_blocking
        def _update():
            return (
                postgrest_client.table("inventory_today")
                .update(update_data)
                .eq("item_id", item_id)
                .eq("batch_date", batch_date)
                .execute()
            )

        response = await _update()
        if not response.data:
            raise HTTPException(status_code=404, detail="Item not found")

        # Update aggregate stock status for this item in today's inventory
        if item_name_for_aggregate and "stock_quantity" in update_data:
            try:
                from app.routes.Inventory.aggregate_status import update_aggregate_stock_status
                new_status = await update_aggregate_stock_status(item_name_for_aggregate, "inventory_today", db)
                logger.info(f"Updated aggregate status for '{item_name_for_aggregate}' in today's inventory: {new_status}")
            except Exception as e:
                logger.error(f"Failed to update aggregate status: {str(e)}")

        # Log user activity
        try:
            await log_user_activity(
                db,
                user,
                "update inventory today",
                f"Updated inventory item {item_id}",
            )
        except Exception:
            pass
        return {"message": "Item updated successfully", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))