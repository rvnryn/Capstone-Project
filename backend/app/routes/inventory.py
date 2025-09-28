from fastapi import APIRouter, HTTPException, Depends, Query, Request, Body
from slowapi.util import get_remote_address
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from slowapi.util import get_remote_address
from slowapi import Limiter
from fastapi import Request
from datetime import datetime, date
from pydantic import BaseModel
from app.supabase import supabase, get_db
from app.routes.userActivity import UserActivityLog
from app.utils.rbac import require_role
from typing import Optional, List
from app.routes.menu import recalculate_stock_status
import asyncio
import time
import logging


async def log_user_activity(db, user, action_type, description):
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
        await db.flush()
        await db.commit()
    except Exception as e:
        logger.warning(f"Failed to record user activity ({action_type}): {e}")


logger = logging.getLogger("app.routes.inventory")
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

# In-memory TTL cache for thresholds
_threshold_cache = {}
_THRESHOLD_TTL = 60.0  # seconds


def run_blocking(fn):
    async def wrapper(*args, **kwargs):
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, lambda: fn(*args, **kwargs))

    return wrapper


async def get_threshold_for_item(item_name: str) -> float:
    now = time.time()
    cache_entry = _threshold_cache.get(item_name)
    if cache_entry:
        value, ts = cache_entry
        if now - ts < _THRESHOLD_TTL:
            return value

    @run_blocking
    def _fetch(name: str):
        return (
            supabase.table("inventory_settings")
            .select("low_stock_threshold")
            .eq("name", name)
            .single()
            .execute()
        )

    try:
        response = await _fetch(item_name)
        threshold = (
            response.data["low_stock_threshold"]
            if response.data and "low_stock_threshold" in response.data
            else None
        )
        if threshold is not None:
            val = float(threshold)
            _threshold_cache[item_name] = (val, now)
            return val
    except Exception as e:
        logger.exception(f"Error fetching threshold for {item_name}")
    return 100.0


def calculate_stock_status(stock_quantity: float, threshold: float) -> str:
    """
    Calculate stock status based on quantity and threshold
    Returns: "Out Of Stock", "Critical", "Low", or "Normal"
    """
    if stock_quantity == 0:
        return "Out Of Stock"
    elif stock_quantity <= threshold * 0.5:
        # Critical: when stock is 50% or less of the threshold
        return "Critical"
    elif stock_quantity <= threshold:
        # Low: when stock is at or below threshold but above critical
        return "Low"
    else:
        # Normal: when stock is above threshold
        return "Normal"


limiter = Limiter(key_func=get_remote_address, default_limits=["10/minute"])
router = APIRouter()


# Base model used for adding
class InventoryItemCreate(BaseModel):
    item_name: str
    batch_date: date | None = None
    category: str
    stock_status: str = "Normal"
    stock_quantity: float
    expiration_date: date | None = None


# Full model used for update/view
class InventoryItem(InventoryItemCreate):
    item_id: int
    created_at: str
    updated_at: str


class InventoryItemUpdate(BaseModel):
    item_name: Optional[str] = None
    batch_date: Optional[date] = None
    category: Optional[str] = None
    stock_status: Optional[str] = None
    stock_quantity: Optional[float] = None
    expiration_date: Optional[date] = None


class InventoryTodayItemCreate(BaseModel):
    item_id: int
    item_name: str
    batch_date: date | None = None
    category: str
    stock_status: str = "Normal"
    stock_quantity: float
    expiration_date: date | None = None
    created_at: str
    updated_at: str


class TransferRequest(BaseModel):
    quantity: float


class SurplusItemCreate(BaseModel):
    item_name: str
    batch_date: Optional[date] = None
    category: str
    stock_status: str = "Normal"
    stock_quantity: float
    expiration_date: Optional[date] = None


class SurplusItem(SurplusItemCreate):
    item_id: int
    created_at: str
    updated_at: str


class SurplusItemUpdate(BaseModel):
    item_name: Optional[str] = None
    batch_date: Optional[date] = None
    category: Optional[str] = None
    stock_status: Optional[str] = None
    stock_quantity: Optional[float] = None
    expiration_date: Optional[date] = None


class SpoilageRequest(BaseModel):
    quantity: float
    reason: Optional[str] = None


@limiter.limit("10/minute")
@router.get("/inventory")
@router.get("/inventory")
async def list_inventory(
    request: Request, skip: int = Query(0, ge=0), limit: int = Query(20, le=100)
):
    try:

        @run_blocking
        def _fetch():
            return (
                supabase.table("inventory")
                .select("*")
                .range(skip, skip + limit - 1)
                .execute()
            )

        items = await _fetch()
        return items.data
    except Exception as e:
        logger.exception("Error listing inventory")
        raise HTTPException(status_code=500, detail="Internal server error")


@limiter.limit("10/minute")
@router.get("/inventory/{item_id}")
@router.get("/inventory/{item_id}")
async def get_inventory_item(request: Request, item_id: int):
    try:

        @run_blocking
        def _fetch():
            return (
                supabase.table("inventory")
                .select("*")
                .eq("item_id", item_id)
                .single()
                .execute()
            )

        response = await _fetch()
        if not response.data:
            raise HTTPException(status_code=404, detail="Item not found")
        return response.data
    except Exception as e:
        logger.exception("Error fetching inventory item")
        raise HTTPException(status_code=500, detail="Internal server error")


@limiter.limit("10/minute")
@router.post("/inventory")
async def add_inventory_item(
    request: Request,
    item: InventoryItemCreate,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
    db=Depends(get_db),
):
    try:
        now = datetime.utcnow().isoformat()
        item_dict = item.dict()
        for key in ["batch_date", "expiration_date"]:
            if item_dict[key]:
                item_dict[key] = item_dict[key].isoformat()
        payload = {
            **item_dict,
            "created_at": now,
            "updated_at": now,
        }

        @run_blocking
        def _insert():
            return supabase.table("inventory").insert(payload).execute()

        response = await _insert()
        await log_user_activity(
            db, user, "add master inventory", f"Added inventory item: {item.item_name}"
        )
        recalculate_stock_status()
        return {"message": "Item added successfully", "data": response.data}
    except Exception as e:
        logger.exception("Error during add_master_inventory_item")
        raise HTTPException(status_code=500, detail="Internal server error")


@limiter.limit("10/minute")
@router.put("/inventory/{item_id}")
async def update_inventory_item(
    request: Request,
    item_id: int,
    item: InventoryItemUpdate,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
    db=Depends(get_db),
):
    try:
        update_data = item.dict(exclude_unset=True)
        for key in ["batch_date", "expiration_date"]:
            if key in update_data and update_data[key] is not None:
                update_data[key] = update_data[key].isoformat()
        # If stock_quantity is being updated, recalculate stock_status
        if "stock_quantity" in update_data:

            @run_blocking
            def _fetch():
                return (
                    supabase.table("inventory")
                    .select("item_name")
                    .eq("item_id", item_id)
                    .single()
                    .execute()
                )

            item_resp = await _fetch()
            item_name = (
                item_resp.data["item_name"]
                if item_resp.data and "item_name" in item_resp.data
                else None
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
                supabase.table("inventory")
                .update(update_data)
                .eq("item_id", item_id)
                .execute()
            )

        response = await _update()
        if not response.data:
            raise HTTPException(status_code=404, detail="Item not found")
            # Log user activity (unchanged)
            await log_user_activity(
                db,
                user,
                "update master inventory",
                f"Updated inventory item: {item_id}",
            )
        recalculate_stock_status()
        return {"message": "Item updated successfully"}
    except Exception as e:
        logger.exception("Error during update_inventory_item")
        raise HTTPException(status_code=500, detail="Internal server error")


@limiter.limit("10/minute")
@router.delete("/inventory/{item_id}")
async def delete_inventory_item(
    request: Request,
    item_id: int,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
    db=Depends(get_db),
):
    try:

        @run_blocking
        def _check():
            return (
                supabase.table("inventory")
                .select("item_id")
                .eq("item_id", item_id)
                .execute()
            )

        check = await _check()
        if not check.data:
            raise HTTPException(status_code=404, detail="Item not found")

        @run_blocking
        def _delete():
            return supabase.table("inventory").delete().eq("item_id", item_id).execute()

        response = await _delete()
        await log_user_activity(
            db, user, "delete master inventory", f"Deleted inventory item: {item_id}"
        )
        recalculate_stock_status()
        return {"message": "Item deleted successfully", "data": response.data}
    except Exception as e:
        logger.exception("Error deleting inventory item")
        raise HTTPException(status_code=500, detail="Internal server error")


@limiter.limit("10/minute")
@router.post("/inventory/{item_id}/transfer-to-today")
async def transfer_to_today_inventory(
    request: Request,
    item_id: int,
    req: TransferRequest,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
    db=Depends(get_db),
):
    try:

        @run_blocking
        def _fetch_inventory():
            return (
                supabase.table("inventory")
                .select("*")
                .eq("item_id", item_id)
                .single()
                .execute()
            )

        response = await _fetch_inventory()
        item = response.data
        if not item:
            raise HTTPException(status_code=404, detail="Item not found in inventory")
        transfer_quantity = req.quantity
        if transfer_quantity <= 0 or transfer_quantity > item["stock_quantity"]:
            raise HTTPException(status_code=400, detail="Invalid transfer quantity")
        threshold = await get_threshold_for_item(item["item_name"])
        transfer_status = calculate_stock_status(transfer_quantity, threshold)
        now = datetime.utcnow().isoformat()

        # Check if item_id already exists in inventory_today
        @run_blocking
        def _fetch_today():
            return (
                supabase.table("inventory_today")
                .select("*")
                .eq("item_id", item_id)
                .single()
                .execute()
            )

        today_response = await _fetch_today()
        today_item = today_response.data

        if today_item:
            # If exists, add to the stock_quantity and update stock_status
            new_today_quantity = today_item["stock_quantity"] + transfer_quantity
            new_today_status = calculate_stock_status(new_today_quantity, threshold)

            @run_blocking
            def _update_today():
                return (
                    supabase.table("inventory_today")
                    .update(
                        {
                            "stock_quantity": new_today_quantity,
                            "stock_status": new_today_status,
                            "updated_at": now,
                        }
                    )
                    .eq("item_id", item_id)
                    .execute()
                )

            insert_response = await _update_today()
        else:
            # If not exists, insert as new
            payload = {
                "item_id": item["item_id"],
                "item_name": item["item_name"],
                "batch_date": item["batch_date"],
                "category": item["category"],
                "stock_status": transfer_status,
                "stock_quantity": transfer_quantity,
                "expiration_date": item.get("expiration_date"),
                "created_at": now,
                "updated_at": now,
            }

            @run_blocking
            def _insert_today():
                return supabase.table("inventory_today").insert(payload).execute()

            insert_response = await _insert_today()

        new_stock = item["stock_quantity"] - transfer_quantity
        if new_stock <= 0:

            @run_blocking
            def _delete():
                return (
                    supabase.table("inventory")
                    .delete()
                    .eq("item_id", item_id)
                    .execute()
                )

            await _delete()
        else:
            new_status = calculate_stock_status(new_stock, threshold)

            @run_blocking
            def _update():
                return (
                    supabase.table("inventory")
                    .update(
                        {
                            "stock_quantity": new_stock,
                            "stock_status": new_status,
                            "updated_at": now,
                        }
                    )
                    .eq("item_id", item_id)
                    .execute()
                )

            await _update()
        # Log user activity (unchanged)
        await log_user_activity(
            db,
            user,
            "transfer inventory to today's inventory",
            f"Transferred {transfer_quantity} of Id {item['item_id']} | item {item['item_name']} to Today's Inventory",
        )
        return {
            "message": "Item transferred to Today's Inventory",
            "data": insert_response.data,
        }
    except Exception as e:
        logger.exception("Error during transfer_to_today_inventory")
        raise HTTPException(status_code=500, detail="Internal server error")


@limiter.limit("10/minute")
@router.get("/inventory-today")
async def list_inventory_today(request: Request):
    try:

        @run_blocking
        def _fetch():
            return supabase.table("inventory_today").select("*").execute()

        items = await _fetch()
        return items.data
    except Exception as e:
        logger.exception("Error fetching inventory_today")
        raise HTTPException(status_code=500, detail="Internal server error")


@limiter.limit("10/minute")
@router.get("/inventory-today/{item_id}")
async def get_inventory_today_item(request: Request, item_id: int):
    try:

        @run_blocking
        def _fetch():
            return (
                supabase.table("inventory_today")
                .select("*")
                .eq("item_id", item_id)
                .single()
                .execute()
            )

        response = await _fetch()
        if not response.data:
            raise HTTPException(status_code=404, detail="Item not found")
        return response.data
    except Exception as e:
        logger.exception("Error fetching inventory_today item")
        raise HTTPException(status_code=500, detail="Internal server error")


@limiter.limit("10/minute")
@router.delete("/inventory-today/{item_id}")
async def delete_inventory_today_item(
    request: Request,
    item_id: int,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
    db=Depends(get_db),
):
    try:

        @run_blocking
        def _delete():
            return (
                supabase.table("inventory_today")
                .delete()
                .eq("item_id", item_id)
                .execute()
            )

        response = await _delete()
        if not response.data:
            raise HTTPException(status_code=404, detail="Item not found")
        # Log user activity
        try:
            user_row = getattr(user, "user_row", user)
            new_activity = UserActivityLog(
                user_id=user_row.get("user_id"),
                action_type="delete today's inventory",
                description=f"Deleted today's inventory item: {item_id}",
                activity_date=datetime.utcnow(),
                report_date=datetime.utcnow(),
                user_name=user_row.get("name"),
                role=user_row.get("user_role"),
            )
            db.add(new_activity)
            await db.flush()
            await db.commit()
        except Exception as e:
            logger.warning(f"Failed to record today's inventory delete activity: {e}")
        return {"message": "Item deleted successfully", "data": response.data}
    except Exception as e:
        logger.exception("Error deleting item from today's inventory")
        raise HTTPException(status_code=500, detail="Internal server error")


@limiter.limit("10/minute")
@router.put("/inventory-today/{item_id}")
async def update_inventory_today_item(
    request: Request,
    item_id: int,
    item: InventoryItemUpdate,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
    db=Depends(get_db),
):
    try:
        update_data = item.dict(exclude_unset=True)
        for key in ["batch_date", "expiration_date"]:
            if key in update_data and update_data[key] is not None:
                update_data[key] = update_data[key].isoformat()

        # If stock_quantity is being updated, recalculate stock_status
        if "stock_quantity" in update_data:

            @run_blocking
            def _fetch():
                return (
                    supabase.table("inventory_today")
                    .select("item_name")
                    .eq("item_id", item_id)
                    .single()
                    .execute()
                )

            item_resp = await _fetch()
            item_name = (
                item_resp.data["item_name"]
                if item_resp.data and "item_name" in item_resp.data
                else None
            )
            if item_name:
                threshold = get_threshold_for_item(item_name)
                update_data["stock_status"] = calculate_stock_status(
                    update_data["stock_quantity"], threshold
                )

        update_data["updated_at"] = datetime.utcnow().isoformat()

        @run_blocking
        def _update():
            return (
                supabase.table("inventory_today")
                .update(update_data)
                .eq("item_id", item_id)
                .execute()
            )

        response = await _update()
        if not response.data:
            raise HTTPException(status_code=404, detail="Item not found")
        # Log user activity
        try:
            user_row = getattr(user, "user_row", user)
            new_activity = UserActivityLog(
                user_id=user_row.get("user_id"),
                action_type="update today's inventory",
                description=f"Updated today's inventory item: {item_id}",
                activity_date=datetime.utcnow(),
                report_date=datetime.utcnow(),
                user_name=user_row.get("name"),
                role=user_row.get("user_role"),
            )
            db.add(new_activity)
            await db.flush()
            await db.commit()
            print("Today's inventory update activity logged successfully.")
        except Exception as e:
            print("Failed to record today's inventory update activity:", e)
        return {"message": "Item updated successfully"}
    except Exception as e:
        print("🔥 Error during update:", e)
        raise HTTPException(status_code=500, detail=str(e))


@limiter.limit("10/minute")
@router.post("/inventory-today/{item_id}/transfer-to-surplus")
async def transfer_to_today(
    request: Request,
    item_id: int,
    req: TransferRequest,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
    db=Depends(get_db),
):
    try:
        # Get the item from inventory_today
        @run_blocking
        def _fetch():
            return (
                supabase.table("inventory_today")
                .select("*")
                .eq("item_id", item_id)
                .single()
                .execute()
            )

        response = await _fetch()
        item = response.data
        if not item:
            raise HTTPException(
                status_code=404, detail="Item not found in inventory_today"
            )
        transfer_quantity = req.quantity
        if transfer_quantity <= 0 or transfer_quantity > item["stock_quantity"]:
            raise HTTPException(status_code=400, detail="Invalid transfer quantity")
        threshold = await get_threshold_for_item(item["item_name"])
        transfer_status = calculate_stock_status(transfer_quantity, threshold)
        now = datetime.utcnow().isoformat()
        payload = {
            "item_name": item["item_name"],
            "batch_date": item["batch_date"],
            "category": item["category"],
            "stock_status": transfer_status,
            "stock_quantity": transfer_quantity,
            "expiration_date": item.get("expiration_date"),
            "created_at": now,
            "updated_at": now,
        }

        @run_blocking
        def _insert_surplus():
            return supabase.table("inventory_surplus").insert(payload).execute()

        insert_response = await _insert_surplus()
        new_stock = item["stock_quantity"] - transfer_quantity
        if new_stock <= 0:

            @run_blocking
            def _delete():
                return (
                    supabase.table("inventory_today")
                    .delete()
                    .eq("item_id", item_id)
                    .execute()
                )

            await _delete()
        else:
            new_status = calculate_stock_status(new_stock, threshold)

            @run_blocking
            def _update():
                return (
                    supabase.table("inventory_today")
                    .update(
                        {
                            "stock_quantity": new_stock,
                            "stock_status": new_status,
                            "updated_at": now,
                        }
                    )
                    .eq("item_id", item_id)
                    .execute()
                )

            await _update()
        # Log user activity
        try:
            user_row = getattr(user, "user_row", user)
            new_activity = UserActivityLog(
                user_id=user_row.get("user_id"),
                action_type="transfer inventory to surplus",
                description=f"Transferred {item['stock_quantity']} of Id {item['item_id']} | item {item['item_name']} to Surplus Inventory",
                activity_date=datetime.utcnow(),
                report_date=datetime.utcnow(),
                user_name=user_row.get("name"),
                role=user_row.get("user_role"),
            )
            db.add(new_activity)
            await db.flush()
            await db.commit()
            print("Today's inventory transfer activity logged successfully.")
        except Exception as e:
            print("Failed to record today's inventory transfer activity:", e)
        return {"message": "Item transferred to Surplus", "data": insert_response.data}
    except Exception as e:
        print("🔥 Error during transfer_to_surplus:", e)
        raise HTTPException(status_code=500, detail=str(e))


@limiter.limit("10/minute")
@router.get("/inventory-surplus")
async def list_surplus(request: Request):
    try:

        @run_blocking
        def _fetch():
            return supabase.table("inventory_surplus").select("*").execute()

        items = await _fetch()
        return items.data
    except Exception as e:
        logger.exception("Error fetching inventory_surplus")
        raise HTTPException(status_code=500, detail="Internal server error")


@limiter.limit("10/minute")
@router.get("/inventory-surplus/{item_id}")
async def get_surplus_item(request: Request, item_id: int):
    try:

        @run_blocking
        def _fetch():
            return (
                supabase.table("inventory_surplus")
                .select("*")
                .eq("item_id", item_id)
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


@limiter.limit("10/minute")
@router.delete("/inventory-surplus/{item_id}")
async def delete_surplus_item(
    request: Request,
    item_id: int,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
    db=Depends(get_db),
):
    try:

        @run_blocking
        def _delete():
            return (
                supabase.table("inventory_surplus")
                .delete()
                .eq("item_id", item_id)
                .execute()
            )

        response = await _delete()
        if not response.data:
            raise HTTPException(status_code=404, detail="Item not found")
        # Log user activity
        try:
            user_row = getattr(user, "user_row", user)
            new_activity = UserActivityLog(
                user_id=user_row.get("user_id"),
                action_type="delete surplus inventory",
                description=f"Deleted surplus inventory item: {item_id}",
                activity_date=datetime.utcnow(),
                report_date=datetime.utcnow(),
                user_name=user_row.get("name"),
                role=user_row.get("user_role"),
            )
            db.add(new_activity)
            await db.flush()
            await db.commit()
        except Exception as e:
            logger.warning(f"Failed to record surplus inventory delete activity: {e}")
        return {"message": "Surplus item deleted successfully", "data": response.data}
    except Exception as e:
        logger.exception("Error deleting surplus item")
        raise HTTPException(status_code=500, detail="Internal server error")


@limiter.limit("10/minute")
@router.post("/inventory-surplus/{item_id}/transfer-to-today")
async def transfer_to_surplus(
    request: Request,
    item_id: int,
    req: TransferRequest,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
    db=Depends(get_db),
):
    try:

        @run_blocking
        def _fetch():
            return (
                supabase.table("inventory_surplus")
                .select("*")
                .eq("item_id", item_id)
                .single()
                .execute()
            )

        response = await _fetch()
        item = response.data
        if not item:
            raise HTTPException(
                status_code=404, detail="Item not found in inventory_today"
            )
        transfer_quantity = req.quantity
        if transfer_quantity <= 0 or transfer_quantity > item["stock_quantity"]:
            raise HTTPException(status_code=400, detail="Invalid transfer quantity")
        threshold = await get_threshold_for_item(item["item_name"])
        transfer_status = calculate_stock_status(transfer_quantity, threshold)
        now = datetime.utcnow().isoformat()
        payload = {
            "item_name": item["item_name"],
            "batch_date": item["batch_date"],
            "category": item["category"],
            "stock_status": transfer_status,
            "stock_quantity": transfer_quantity,
            "expiration_date": item.get("expiration_date"),
            "created_at": now,
            "updated_at": now,
        }

        @run_blocking
        def _insert_today():
            return supabase.table("inventory_today").insert(payload).execute()

        insert_response = await _insert_today()
        new_stock = item["stock_quantity"] - transfer_quantity
        if new_stock <= 0:

            @run_blocking
            def _delete():
                return (
                    supabase.table("inventory_surplus")
                    .delete()
                    .eq("item_id", item_id)
                    .execute()
                )

            await _delete()
        else:
            new_status = calculate_stock_status(new_stock, threshold)

            @run_blocking
            def _update():
                return (
                    supabase.table("inventory_surplus")
                    .update(
                        {
                            "stock_quantity": new_stock,
                            "stock_status": new_status,
                            "updated_at": now,
                        }
                    )
                    .eq("item_id", item_id)
                    .execute()
                )

            await _update()
        # Log user activity
        try:
            user_row = getattr(user, "user_row", user)
            new_activity = UserActivityLog(
                user_id=user_row.get("user_id"),
                action_type="transfer surplus inventory to today's inventory",
                description=f"Transferred {item['stock_quantity']} of Id {item['item_id']} | item {item['item_name']} to Today's Inventory",
                activity_date=datetime.utcnow(),
                report_date=datetime.utcnow(),
                user_name=user_row.get("name"),
                role=user_row.get("user_role"),
            )
            db.add(new_activity)
            await db.flush()
            await db.commit()
            print("Surplus inventory transfer activity logged successfully.")
        except Exception as e:
            print("Failed to record surplus inventory transfer activity:", e)
        return {"message": "Item transferred to today's", "data": insert_response.data}
    except Exception as e:
        print("🔥 Error during transfer_to_surplus:", e)
        raise HTTPException(status_code=500, detail=str(e))


@limiter.limit("10/minute")
@router.get("/inventory-spoilage")
async def list_spoilage(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, le=100),
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
    db=Depends(get_db),
):
    try:

        @run_blocking
        def _fetch():
            return (
                supabase.table("inventory_spoilage")
                .select("*")
                .range(skip, skip + limit - 1)
                .execute()
            )

        items = await _fetch()
        # Log user activity
        try:
            user_row = getattr(user, "user_row", user)
            new_activity = UserActivityLog(
                user_id=user_row.get("user_id"),
                action_type="list spoilage inventory",
                description=f"Listed spoilage inventory items (skip={skip}, limit={limit})",
                activity_date=datetime.utcnow(),
                report_date=datetime.utcnow(),
                user_name=user_row.get("name"),
                role=user_row.get("user_role"),
            )
            db.add(new_activity)
            await db.flush()
            await db.commit()
        except Exception as e:
            logger.warning(f"Failed to record spoilage inventory list activity: {e}")

        # If you want to include the new columns in the response, make sure they are present in the table and returned by supabase.
        return items.data
    except Exception as e:
        logger.exception("Error listing inventory_spoilage")
        raise HTTPException(status_code=500, detail="Internal server error")


@limiter.limit("10/minute")
@router.post("/inventory/{item_id}/transfer-to-spoilage")
async def transfer_to_spoilage(
    request: Request,
    item_id: int,
    req: SpoilageRequest = Body(...),
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
    db=Depends(get_db),
):
    try:

        @run_blocking
        def _fetch():
            return (
                supabase.table("inventory")
                .select("*")
                .eq("item_id", item_id)
                .single()
                .execute()
            )

        response = await _fetch()
        item = response.data
        if not item:
            raise HTTPException(status_code=404, detail="Item not found in inventory")
        spoil_quantity = req.quantity
        if spoil_quantity <= 0 or spoil_quantity > item["stock_quantity"]:
            raise HTTPException(status_code=400, detail="Invalid spoilage quantity")
        now = datetime.utcnow().isoformat()
        # Insert into inventory_spoilage
        spoilage_payload = {
            "item_id": item["item_id"],
            "item_name": item["item_name"],
            "quantity_spoiled": spoil_quantity,
            "spoilage_date": now[:10],
            "reason": req.reason,
            "user_id": getattr(user, "user_row", user).get("user_id"),
            "batch_date": item.get("batch_date"),
            "expiration_date": item.get("expiration_date"),
            "category": item.get("category"),
            "created_at": now,
            "updated_at": now,
        }
        # Ensure spoilage_id is never set in the insert payload
        if "spoilage_id" in spoilage_payload:
            del spoilage_payload["spoilage_id"]

        @run_blocking
        def _insert_spoilage():
            return (
                supabase.table("inventory_spoilage").insert(spoilage_payload).execute()
            )

        spoilage_response = await _insert_spoilage()
        # Update or delete inventory
        new_stock = item["stock_quantity"] - spoil_quantity
        if spoil_quantity >= item["stock_quantity"] or new_stock <= 0:
            # Delete the item from master inventory
            @run_blocking
            def _delete_item():
                return (
                    supabase.table("inventory")
                    .delete()
                    .eq("item_id", item_id)
                    .execute()
                )

            await _delete_item()
        else:
            threshold = await get_threshold_for_item(item["item_name"])
            new_status = calculate_stock_status(new_stock, threshold)

            @run_blocking
            def _update():
                return (
                    supabase.table("inventory")
                    .update(
                        {
                            "stock_quantity": new_stock,
                            "stock_status": new_status,
                            "updated_at": now,
                        }
                    )
                    .eq("item_id", item_id)
                    .execute()
                )

            await _update()
        # Log user activity
        await log_user_activity(
            db,
            user,
            "transfer inventory to spoilage",
            f"Transferred {spoil_quantity} of Id {item['item_id']} | item {item['item_name']} to Spoilage. Reason: {req.reason or 'N/A'}",
        )
        return {
            "message": "Item transferred to Spoilage",
            "data": spoilage_response.data,
        }
    except Exception as e:
        logger.exception("Error during transfer_to_spoilage")
        raise HTTPException(status_code=500, detail="Internal server error")


@limiter.limit("10/minute")
@router.delete("/inventory-spoilage/{spoilage_id}")
async def delete_spoilage_item(
    request: Request,
    spoilage_id: int,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
    db=Depends(get_db),
):
    try:

        @run_blocking
        def _delete():
            return (
                supabase.table("inventory_spoilage")
                .delete()
                .eq("spoilage_id", spoilage_id)
                .execute()
            )

        response = await _delete()
        if not response.data:
            raise HTTPException(status_code=404, detail="Spoilage record not found")
        # Log user activity
        try:
            user_row = getattr(user, "user_row", user)
            new_activity = UserActivityLog(
                user_id=user_row.get("user_id"),
                action_type="delete spoilage inventory",
                description=f"Deleted spoilage inventory record: {spoilage_id}",
                activity_date=datetime.utcnow(),
                report_date=datetime.utcnow(),
                user_name=user_row.get("name"),
                role=user_row.get("user_role"),
            )
            db.add(new_activity)
            await db.flush()
            await db.commit()
        except Exception as e:
            logger.warning(f"Failed to record spoilage inventory delete activity: {e}")
        return {
            "message": "Spoilage record deleted successfully",
            "data": response.data,
        }
    except Exception as e:
        logger.exception("Error deleting spoilage record")
        raise HTTPException(status_code=500, detail="Internal server error")
