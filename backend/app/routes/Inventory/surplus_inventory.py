import asyncio
from fastapi import APIRouter, HTTPException, Depends, Request, Body
from datetime import datetime, timedelta
from typing import Optional
from fastapi_utils.tasks import repeat_every


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

from pydantic import BaseModel

router = APIRouter()


class TransferRequest(BaseModel):
    quantity: float


class SurplusItemCreate(BaseModel):
    item_name: str
    batch_date: Optional[str] = None
    category: str
    stock_status: str = "Normal"
    stock_quantity: float
    expiration_date: Optional[str] = None
    unit_price: Optional[float] = None


def log_user_activity(db, user, action_type, description):
    if db is None:
        logger.warning("No DB session provided for user activity log; skipping log.")
        return
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


@router.get("/inventory-surplus")
async def list_surplus(request: Request):
    try: 

        @run_blocking
        def _fetch():
            return postgrest_client.table("inventory_surplus").select("*").execute()

        items = await _fetch()
        return items.data
    except Exception as e:
        logger.exception("Error fetching inventory_surplus")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/inventory-surplus/{item_id}/{batch_date}")
async def get_surplus_item(request: Request, item_id: int, batch_date: str):
    try:

        @run_blocking
        def _fetch():
            return (
                postgrest_client.table("inventory_surplus")
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
        logger.exception("Error fetching inventory_surplus item")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/inventory-surplus/{item_id}/{batch_date}")
async def delete_surplus_item(
    request: Request,
    item_id: int,
    batch_date: str,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
    db=Depends(get_db)
):
    try:

        @run_blocking
        def _delete():
            return (
                postgrest_client.table("inventory_surplus")
                .delete()
                .eq("item_id", item_id)
                .execute()
            )

        response = await _delete()
        if not response.data:
            raise HTTPException(status_code=404, detail="Item not found")

        try:
            deleted_item = None
            if isinstance(response.data, list) and len(response.data) > 0:
                deleted_item = response.data[0]
            else:
                deleted_item = response.data
            item_name = (
                deleted_item.get("item_name")
                if deleted_item and isinstance(deleted_item, dict)
                else None
            )
            description = f"Deleted surplus item Id {item_id}" + (
                f" | item {item_name}" if item_name else ""
            )
            await log_user_activity(db, user, "delete surplus inventory", description)
        except Exception as e:
            logger.warning(f"Failed to record surplus inventory delete activity: {e}")
        return {"message": "Surplus item deleted successfully", "data": response.data}
    except Exception as e:
        logger.exception("Error deleting surplus item")
        raise HTTPException(status_code=500, detail="Internal server error")


@limiter.limit("10/minute")
@router.post("/inventory-surplus")
async def add_surplus_item(
    request: Request,
    item: SurplusItemCreate,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
    db=Depends(get_db),
):
    """Create a new surplus inventory item."""
    try:
        now = datetime.utcnow().isoformat()
        item_dict = item.dict()
        for key in ["batch_date", "expiration_date"]:
            if item_dict.get(key):
                # support date objects or ISO strings
                val = item_dict[key]
                if hasattr(val, "isoformat"):
                    item_dict[key] = val.isoformat()
        payload = {
            **item_dict,
            "created_at": now,
            "updated_at": now,
            "unit_price": item.unit_price,
        }

        @run_blocking
        def _insert():
            return postgrest_client.table("inventory_surplus").insert(payload).execute()

        response = await _insert()
        # Log user activity
        try:
            inserted = None
            if isinstance(response.data, list) and len(response.data) > 0:
                inserted = response.data[0]
            else:
                inserted = response.data
            item_name = (
                inserted.get("item_name")
                if inserted and isinstance(inserted, dict)
                else None
            )
            item_id = (
                inserted.get("item_id")
                if inserted and isinstance(inserted, dict)
                else None
            )
            description = f"Added surplus item Id {item_id or 'N/A'}" + (
                f" | item {item_name}" if item_name else ""
            )
            await log_user_activity(db, user, "add surplus inventory", description)
        except Exception as e:
            logger.warning(f"Failed to record add surplus inventory activity: {e}")
        return {"message": "Surplus item added successfully", "data": response.data}
    except Exception as e:
        logger.exception("Error during add_surplus_item")
        raise HTTPException(status_code=500, detail="Internal server error")


@limiter.limit("10/minute")
@router.put("/inventory-surplus/{item_id}/{batch_date}")
async def update_surplus_item(
    request: Request,
    item_id: int,
    batch_date: str,
    item: SurplusItemCreate | None = None,
    payload_update: dict | None = None,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
    db=Depends(get_db),
):
    """Update an existing surplus inventory item. Accepts partial updates."""
    try:
        # Accept either a Pydantic model or raw dict payload
        if item is not None:
            update_data = item.dict(exclude_unset=True)
        elif payload_update is not None:
            update_data = payload_update
        else:
            update_data = {}

        # Normalize dates
        for key in ["batch_date", "expiration_date"]:
            if key in update_data and update_data[key] is not None:
                val = update_data[key]
                if hasattr(val, "isoformat"):
                    update_data[key] = val.isoformat()

        # If stock_quantity is updated, recalc stock_status
        if "stock_quantity" in update_data:

            @run_blocking
            def _fetch_name():
                return (
                    postgrest_client.table("inventory_surplus")
                    .select("item_name")
                    .eq("item_id", item_id)
                    .eq("batch_date", batch_date)
                    .single()
                    .execute()
                )

            item_resp = await _fetch_name()
            item_name = (
                item_resp.data["item_name"] if item_resp and item_resp.data else None
            )
            if item_name:
                threshold = await get_threshold_for_item(item_name)
                update_data["stock_status"] = calculate_stock_status(
                    update_data["stock_quantity"], threshold
                )

        update_data["updated_at"] = datetime.utcnow().isoformat()

        @run_blocking
        def _update():
            return (
                postgrest_client.table("inventory_surplus")
                .update(update_data)
                .eq("item_id", item_id)
                .execute()
            )

        response = await _update()
        if not response.data:
            raise HTTPException(status_code=404, detail="Item not found")
        # Log user activity for update
        try:
            if isinstance(response.data, list) and len(response.data) > 0:
                updated = response.data[0]
            else:
                updated = response.data
            item_name = (
                updated.get("item_name")
                if updated and isinstance(updated, dict)
                else None
            )
            description = f"Updated surplus item Id {item_id}" + (
                f" | item {item_name}" if item_name else ""
            )
            await log_user_activity(db, user, "update surplus inventory", description)
        except Exception as e:
            logger.warning(f"Failed to record update surplus inventory activity: {e}")
        return {"message": "Surplus item updated successfully", "data": response.data}
    except Exception as e:
        logger.exception("Error during update_surplus_item")
        raise HTTPException(status_code=500, detail="Internal server error")
