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
from app.supabase import postgrest_client, get_db
from app.routes.Reports.UserActivity.userActivity import UserActivityLog
from app.utils.rbac import require_role
from typing import Optional, List
from app.routes.Menu.menu import recalculate_stock_status
import asyncio
import time
import logging
import importlib
from postgrest.exceptions import APIError

_fastapi_utils = importlib.util.find_spec("fastapi_utils.tasks")
if _fastapi_utils is not None:
    _mod = importlib.import_module("fastapi_utils.tasks")
    repeat_every = getattr(_mod, "repeat_every")
else:

    def repeat_every(*args, **kwargs):
        def _decorator(func):
            return func

        return _decorator


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

_threshold_cache = {}
_THRESHOLD_TTL = 60.0


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
        try:
            return (
                postgrest_client.table("inventory_settings")
                .select("low_stock_threshold")
                .eq("name", name)
                .single()
                .execute()
            )
        except APIError as e:
            # If no row found, return None
            if getattr(e, "code", None) == "PGRST116":
                return None
            raise

    try:
        response = await _fetch(item_name)
        threshold = (
            response.data["low_stock_threshold"]
            if response and response.data and "low_stock_threshold" in response.data
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
    unit_price: Optional[float] = None


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
    unit_price: Optional[float] = None


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


@router.get("/inventory")
async def list_inventory(
    request: Request, skip: int = Query(0, ge=0), limit: int = Query(20, le=100)
):
    try:

        @run_blocking
        def _fetch():
            return (
                postgrest_client.table("inventory")
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
async def get_inventory_item(request: Request, item_id: int):
    try:

        @run_blocking
        def _fetch():
            return (
                postgrest_client.table("inventory")
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
                "unit_price": item.unit_price,
        }

        @run_blocking
        def _insert():
            return postgrest_client.table("inventory").insert(payload).execute()

        response = await _insert()
        await log_user_activity(
            db, user, "add master inventory", f"Added inventory item: {item.item_name}"
        )
        result = recalculate_stock_status()
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
            # unit_price is included if present
        # If stock_quantity is being updated, recalculate stock_status
        if "stock_quantity" in update_data:

            @run_blocking
            def _fetch():
                return (
                    postgrest_client.table("inventory")
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
                postgrest_client.table("inventory")
                .update(update_data)
                .eq("item_id", item_id)
                .execute()
            )

        response = await _update()
        if not response.data:
            raise HTTPException(status_code=404, detail="Item not found")
        result = recalculate_stock_status()
        # Log recalc activity
        await log_user_activity(
            db,
            user,
            "update master inventory",
            f"Updated inventory item: {item_id}",
        )
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
                postgrest_client.table("inventory")
                .select("item_id")
                .eq("item_id", item_id)
                .execute()
            )

        check = await _check()
        if not check.data:
            raise HTTPException(status_code=404, detail="Item not found")

        @run_blocking
        def _delete():
            return (
                postgrest_client.table("inventory")
                .delete()
                .eq("item_id", item_id)
                .execute()
            )

        response = await _delete()
        await log_user_activity(
            db, user, "delete master inventory", f"Deleted inventory item: {item_id}"
        )
        result = recalculate_stock_status()
        return {"message": "Item deleted successfully", "data": response.data}
    except HTTPException:
        # Let FastAPI handle HTTPExceptions (like 404) as-is
        raise
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
                postgrest_client.table("inventory")
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
        from postgrest.exceptions import APIError

        @run_blocking
        def _fetch_today():
            try:
                return (
                    postgrest_client.table("inventory_today")
                    .select("*")
                    .eq("item_id", item_id)
                    .single()
                    .execute()
                )
            except APIError as e:
                if getattr(e, "code", None) == "PGRST116":
                    return None
                raise

        today_response = await _fetch_today()
        today_item = today_response.data if today_response else None

        if today_item:
            # If exists, add to the stock_quantity and update stock_status
            new_today_quantity = today_item["stock_quantity"] + transfer_quantity
            new_today_status = calculate_stock_status(new_today_quantity, threshold)

            @run_blocking
            def _update_today():
                return (
                    postgrest_client.table("inventory_today")
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
                    "unit_price": item.get("unit_price"),
            }

            @run_blocking
            def _insert_today():
                return (
                    postgrest_client.table("inventory_today").insert(payload).execute()
                )

            insert_response = await _insert_today()

        new_stock = item["stock_quantity"] - transfer_quantity
        if new_stock <= 0:

            @run_blocking
            def _delete():
                return (
                    postgrest_client.table("inventory")
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
                    postgrest_client.table("inventory")
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
