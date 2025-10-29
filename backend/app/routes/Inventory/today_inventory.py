from fastapi import APIRouter, HTTPException, Depends, Request, logger
from fastapi_utils.tasks import repeat_every
from datetime import datetime
from app.supabase import postgrest_client, get_db
from app.utils.rbac import require_role
from pydantic import BaseModel
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
)
from datetime import datetime
import functools
import asyncio

router = APIRouter()


class InventoryItemUpdate(BaseModel):
    item_name: str | None = None
    batch_date: str | None = None
    category: str | None = None
    stock_status: str | None = None
    stock_quantity: float | None = None
    expiration_date: str | None = None
    unit_price: float | None = None


class TransferRequest(BaseModel):
    quantity: float


def run_blocking(func):
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, lambda: func(*args, **kwargs))
    return wrapper


def log_user_activity(db, user, action_type, description):
    try:
        user_row = getattr(user, "user_row", user)
        new_activity = UserActivityLog(
            user_id=user_row.get("user_id"),
            action_type=action_type,
            description=description,
            activity_date=datetime.utcnow(),
            report_date=datetime.utcnow(),
            user_name=user_row.get("name"),
            role=user_row.get("user_role"),
        )
        db.add(new_activity)
        db.flush()
        db.commit()
    except Exception as e:
        logger.warning(f"Failed to record user activity ({action_type}): {e}")

@router.get("/inventory-today")
async def list_inventory_today(request: Request):
    try:

        @run_blocking
        def _fetch():
            return postgrest_client.table("inventory_today").select("*").execute()

        items = await _fetch()
        return items.data
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
        
        # Calculate and update stock status if quantity or item_name is provided
        if "stock_quantity" in update_data and "item_name" in update_data:
            threshold = await get_threshold_for_item(update_data["item_name"])
            update_data["stock_status"] = calculate_stock_status(update_data["stock_quantity"], threshold)

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