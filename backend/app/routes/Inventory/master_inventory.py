from fastapi import APIRouter, HTTPException, Depends, Query, Request, Body
from slowapi.util import get_remote_address
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from datetime import datetime, date
from pydantic import BaseModel, Field, validator
from enum import Enum
from app.supabase import postgrest_client, get_db
from app.routes.Reports.UserActivity.userActivity import UserActivityLog
from app.utils.rbac import require_role
from typing import Optional, List
from app.routes.Menu.menu import recalculate_stock_status
from app.routes.General.notification import create_notification  # Import notification function
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


# ===========================
# ENUMS FOR VALIDATION
# ===========================

class CategoryEnum(str, Enum):
    """Standardized inventory categories"""
    MEATS = "Meats"
    SEAFOOD = "Seafood"
    VEGETABLES_FRUITS = "Vegetables & Fruits"
    DAIRY_EGGS = "Dairy & Eggs"
    SEASONINGS = "Seasonings & Condiments"
    RICE_NOODLES = "Rice & Noodles"
    COOKING_OILS = "Cooking Oils"
    BEVERAGE = "Beverage"


class StockStatusEnum(str, Enum):
    """Standardized stock status values"""
    NORMAL = "Normal"
    LOW = "Low"
    CRITICAL = "Critical"
    OUT_OF_STOCK = "Out Of Stock"
    HIGH = "High"


# ===========================
# PYDANTIC MODELS WITH VALIDATION
# ===========================

# Base model used for adding
class InventoryItemCreate(BaseModel):
    item_name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Item name (2-100 characters)"
    )
    batch_date: date | None = None
    category: CategoryEnum = Field(
        ...,
        description="Item category from predefined list"
    )
    stock_status: StockStatusEnum = Field(
        default=StockStatusEnum.NORMAL,
        description="Current stock status"
    )
    stock_quantity: float = Field(
        ...,
        ge=0,
        description="Stock quantity (must be >= 0)"
    )
    expiration_date: date | None = None
    unit_cost: Optional[float] = Field(
        None,
        ge=0,
        description="Unit cost in pesos (must be >= 0)"
    )

    @validator('item_name')
    def validate_item_name(cls, v):
        """Ensure item name doesn't contain only whitespace"""
        if not v or not v.strip():
            raise ValueError('Item name cannot be empty or only whitespace')
        return v.strip()

    @validator('expiration_date')
    def validate_expiration_date(cls, v, values):
        """Ensure expiration date is not in the past"""
        if v and v < date.today():
            raise ValueError('Expiration date cannot be in the past')

        # If batch_date exists, expiration must be after batch date
        if v and 'batch_date' in values and values['batch_date']:
            if v < values['batch_date']:
                raise ValueError('Expiration date must be after batch date')

        return v

    @validator('batch_date')
    def validate_batch_date(cls, v):
        """Batch date should not be in the future"""
        if v and v > date.today():
            raise ValueError('Batch date cannot be in the future')
        return v

    @validator('stock_quantity')
    def validate_stock_quantity(cls, v):
        """Additional validation for stock quantity"""
        if v < 0:
            raise ValueError('Stock quantity cannot be negative')
        if v > 1000000:  # Reasonable upper limit
            raise ValueError('Stock quantity exceeds maximum allowed (1,000,000)')
        return v

    @validator('unit_cost')
    def validate_unit_cost(cls, v):
        """Validate unit cost range"""
        if v is not None:
            if v < 0:
                raise ValueError('Unit cost cannot be negative')
            if v > 1000000:  # Reasonable upper limit (1M pesos per unit)
                raise ValueError('Unit cost exceeds maximum allowed (₱1,000,000)')
        return v


# Full model used for update/view
class InventoryItem(InventoryItemCreate):
    item_id: int
    created_at: str
    updated_at: str


class InventoryItemUpdate(BaseModel):
    """Update model - all fields optional but must follow same validation rules when provided"""
    item_name: Optional[str] = Field(
        None,
        min_length=2,
        max_length=100,
        description="Item name (2-100 characters)"
    )
    batch_date: Optional[date] = None
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
    expiration_date: Optional[date] = None
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

    @validator('expiration_date')
    def validate_expiration_date(cls, v, values):
        """Ensure expiration date is not in the past"""
        if v is not None:
            if v < date.today():
                raise ValueError('Expiration date cannot be in the past')

            # If batch_date exists, expiration must be after batch date
            if 'batch_date' in values and values['batch_date']:
                if v < values['batch_date']:
                    raise ValueError('Expiration date must be after batch date')

        return v

    @validator('batch_date')
    def validate_batch_date(cls, v):
        """Batch date should not be in the future"""
        if v is not None and v > date.today():
            raise ValueError('Batch date cannot be in the future')
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


class InventoryTodayItemCreate(BaseModel):
    """Today's inventory - similar validation rules"""
    item_id: int
    item_name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Item name (2-100 characters)"
    )
    batch_date: date | None = None
    category: CategoryEnum = Field(
        ...,
        description="Item category from predefined list"
    )
    stock_status: StockStatusEnum = Field(
        default=StockStatusEnum.NORMAL,
        description="Current stock status"
    )
    stock_quantity: float = Field(
        ...,
        ge=0,
        description="Stock quantity (must be >= 0)"
    )
    expiration_date: date | None = None
    unit_cost: Optional[float] = Field(
        None,
        ge=0,
        description="Unit cost in pesos (must be >= 0)"
    )
    created_at: str
    updated_at: str

    @validator('item_name')
    def validate_item_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Item name cannot be empty or only whitespace')
        return v.strip()

    @validator('expiration_date')
    def validate_expiration_date(cls, v, values):
        if v and v < date.today():
            raise ValueError('Expiration date cannot be in the past')
        if v and 'batch_date' in values and values['batch_date']:
            if v < values['batch_date']:
                raise ValueError('Expiration date must be after batch date')
        return v


class TransferRequest(BaseModel):
    """Transfer quantity validation"""
    item_id: Optional[int] = Field(None, description="Item ID (optional, used for /inventory-today/transfer endpoint)")
    quantity: float = Field(
        ...,
        gt=0,
        description="Transfer quantity (must be > 0)"
    )

    @validator('quantity')
    def validate_quantity(cls, v):
        if v <= 0:
            raise ValueError('Transfer quantity must be greater than 0')
        if v > 1000000:
            raise ValueError('Transfer quantity exceeds maximum allowed (1,000,000)')
        return v


class FIFOTransferRequest(BaseModel):
    """FIFO transfer with item name and quantity"""
    item_name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Item name to transfer"
    )
    quantity: float = Field(
        ...,
        gt=0,
        description="Transfer quantity (must be > 0)"
    )

    @validator('item_name')
    def validate_item_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Item name cannot be empty or only whitespace')
        return v.strip()

    @validator('quantity')
    def validate_quantity(cls, v):
        if v <= 0:
            raise ValueError('Transfer quantity must be greater than 0')
        if v > 1000000:
            raise ValueError('Transfer quantity exceeds maximum allowed (1,000,000)')
        return v


@router.get("/inventory")
async def list_inventory(request: Request):
    try:
        @run_blocking
        def _fetch():
            return (
                postgrest_client.table("inventory")
                .select("*")
                .order("batch_date", desc=False)
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
        batch_date_str = None
        for key in ["batch_date", "expiration_date"]:
            if item_dict[key]:
                item_dict[key] = item_dict[key].isoformat()
                if key == "batch_date":
                    batch_date_str = item_dict[key]

        # Check if item with same name and batch_date already exists
        @run_blocking
        def _check_existing():
            query = (
                postgrest_client.table("inventory")
                .select("*")
                .eq("item_name", item.item_name)
            )
            if batch_date_str:
                query = query.eq("batch_date", batch_date_str)
            else:
                query = query.is_("batch_date", "null")
            return query.execute()

        existing_response = await _check_existing()
        existing_items = existing_response.data if existing_response else []

        if existing_items and len(existing_items) > 0:
            # Item exists, update the stock quantity
            existing_item = existing_items[0]
            new_stock = float(existing_item["stock_quantity"]) + float(item.stock_quantity)
            threshold = await get_threshold_for_item(item.item_name)
            new_status = calculate_stock_status(new_stock, threshold)

            update_data = {
                "stock_quantity": new_stock,
                "stock_status": new_status,
                "updated_at": now,
                # Update unit_cost if provided
                "unit_cost": item.unit_cost if item.unit_cost is not None else existing_item.get("unit_cost", 0.00),
                # Update expiration_date if provided
                "expiration_date": item_dict.get("expiration_date") or existing_item.get("expiration_date"),
            }

            @run_blocking
            def _update():
                return (
                    postgrest_client.table("inventory")
                    .update(update_data)
                    .eq("item_id", existing_item["item_id"])
                    .execute()
                )

            response = await _update()
            await log_user_activity(
                db, user, "add master inventory", f"Added {item.stock_quantity} to existing inventory item: {item.item_name} (batch: {batch_date_str or 'N/A'}). New total: {new_stock}"
            )
            result = recalculate_stock_status()
            return {"message": "Item quantity updated successfully", "data": response.data}
        else:
            # Item doesn't exist, insert new record
            payload = {
                **item_dict,
                "created_at": now,
                "updated_at": now,
                "unit_cost": item.unit_cost if item.unit_cost is not None else 0.00,
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
        item_name_for_aggregate = None
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
                item_name_for_aggregate = item_name  # Save for aggregate status update
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

        # Update aggregate stock status for this item in master inventory
        if item_name_for_aggregate:
            try:
                from app.routes.Inventory.aggregate_status import update_aggregate_stock_status
                new_status = await update_aggregate_stock_status(item_name_for_aggregate, "inventory", db)
                logger.info(f"Updated aggregate status for '{item_name_for_aggregate}' in master inventory: {new_status}")
            except Exception as e:
                logger.error(f"Failed to update aggregate status: {str(e)}")

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
                "unit_cost": item.get("unit_cost", 0.00),
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

        # Create notification for transfer
        try:
            user_row = getattr(user, "user_row", user)
            user_id = user_row.get("user_id") if isinstance(user_row, dict) else getattr(user_row, "user_id", None)
            if user_id:
                create_notification(
                    user_id=user_id,
                    type="transfer",
                    message=f"Transferred {transfer_quantity} units of {item['item_name']} to Today's Inventory"
                )
        except Exception as e:
            logger.warning(f"Failed to create transfer notification: {e}")

        return {
            "message": "Item transferred to Today's Inventory",
            "data": insert_response.data,
        }
    except Exception as e:
        logger.exception("Error during transfer_to_today_inventory")
        raise HTTPException(status_code=500, detail="Internal server error")


@limiter.limit("10/minute")
@router.post("/inventory-today/transfer")
async def transfer_to_today_inventory_v2(
    request: Request,
    req: TransferRequest,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
    db=Depends(get_db),
):
    """
    Alternative endpoint for transferring items to Today's Inventory.
    Accepts item_id in the request body instead of URL path.
    """
    try:
        item_id = req.item_id
        transfer_quantity = req.quantity

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
                "category": item.get("category"),
                "stock_quantity": transfer_quantity,
                "stock_status": transfer_status,
                "expiration_date": item.get("expiration_date"),
                "created_at": now,
                "updated_at": now,
                "unit_cost": item.get("unit_cost", 0.00),
            }

            @run_blocking
            def _insert_today():
                return postgrest_client.table("inventory_today").insert(payload).execute()

            insert_response = await _insert_today()

        # Deduct from master inventory
        new_master_quantity = item["stock_quantity"] - transfer_quantity
        new_master_status = calculate_stock_status(new_master_quantity, threshold)

        # If stock reaches 0, delete the item from master inventory
        if new_master_quantity <= 0:
            @run_blocking
            def _delete_master():
                return (
                    postgrest_client.table("inventory")
                    .delete()
                    .eq("item_id", item_id)
                    .execute()
                )

            await _delete_master()
        else:
            # Otherwise, update the stock quantity
            @run_blocking
            def _update_master():
                return (
                    postgrest_client.table("inventory")
                    .update(
                        {
                            "stock_quantity": new_master_quantity,
                            "stock_status": new_master_status,
                            "updated_at": now,
                        }
                    )
                    .eq("item_id", item_id)
                    .execute()
                )

            await _update_master()

        # Log the activity
        await log_user_activity(
            db,
            user,
            "transfer inventory to today's inventory",
            f"Transferred {transfer_quantity} of Id {item['item_id']} | item {item['item_name']} to Today's Inventory",
        )

        # Create notification for the transfer
        try:
            user_row = getattr(user, "user_row", user)
            user_id = user_row.get("user_id") if isinstance(user_row, dict) else getattr(user_row, "user_id", None)
            if user_id:
                create_notification(
                    user_id=user_id,
                    type="transfer",
                    message=f"Transferred {transfer_quantity} units of {item['item_name']} to Today's Inventory"
                )
        except Exception as e:
            logger.warning(f"Failed to create transfer notification: {e}")

        return {
            "message": "Item transferred to Today's Inventory",
            "data": insert_response.data,
        }
    except Exception as e:
        logger.exception("Error during transfer_to_today_inventory_v2")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/inventory/fifo-transfer-to-today")
async def fifo_transfer_to_today(
    request: Request,
    req: FIFOTransferRequest,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
    db=Depends(get_db),
):
    """
    Transfer items to Today's Inventory using FIFO (First-In-First-Out) logic.
    Priority: Surplus Inventory (oldest first) -> Master Inventory (oldest first)

    This ensures:
    1. Surplus inventory is used first to minimize waste
    2. Oldest batches are used first (FIFO)
    3. Stock is aggregated from multiple sources if needed
    """
    try:
        item_name = req.item_name
        requested_quantity = req.quantity

        if requested_quantity <= 0:
            raise HTTPException(status_code=400, detail="Quantity must be greater than 0")

        now = datetime.utcnow().isoformat()
        threshold = await get_threshold_for_item(item_name)

        remaining_quantity = requested_quantity
        transfers = []

        # Step 1: Check Surplus Inventory first (FIFO - oldest batch_date first)
        @run_blocking
        def _fetch_surplus():
            return (
                postgrest_client.table("inventory_surplus")
                .select("*")
                .ilike("item_name", item_name)
                .order("batch_date", desc=False)  # FIFO: oldest first
                .execute()
            )

        surplus_response = await _fetch_surplus()
        surplus_items = surplus_response.data if surplus_response else []

        # Deduct from surplus inventory (FIFO)
        for surplus_item in surplus_items:
            if remaining_quantity <= 0:
                break

            available_qty = float(surplus_item.get("stock_quantity", 0))
            if available_qty <= 0:
                continue

            # Determine how much to take from this batch
            transfer_qty = min(remaining_quantity, available_qty)
            new_surplus_qty = available_qty - transfer_qty

            # Update or delete from surplus
            if new_surplus_qty <= 0:
                @run_blocking
                def _delete_surplus():
                    return (
                        postgrest_client.table("inventory_surplus")
                        .delete()
                        .eq("item_id", surplus_item["item_id"])
                        .eq("batch_date", surplus_item["batch_date"])
                        .execute()
                    )
                await _delete_surplus()
            else:
                new_surplus_status = calculate_stock_status(new_surplus_qty, threshold)

                @run_blocking
                def _update_surplus():
                    return (
                        postgrest_client.table("inventory_surplus")
                        .update({
                            "stock_quantity": new_surplus_qty,
                            "stock_status": new_surplus_status,
                            "updated_at": now,
                        })
                        .eq("item_id", surplus_item["item_id"])
                        .eq("batch_date", surplus_item["batch_date"])
                        .execute()
                    )
                await _update_surplus()

            # Add to today's inventory
            await _add_to_today_inventory(
                surplus_item,
                transfer_qty,
                threshold,
                now
            )

            transfers.append({
                "source": "surplus",
                "batch_date": surplus_item["batch_date"],
                "quantity": transfer_qty,
                "item_id": surplus_item["item_id"]
            })

            remaining_quantity -= transfer_qty

        # Step 2: If still need more, check Master Inventory (FIFO - oldest batch_date first)
        if remaining_quantity > 0:
            @run_blocking
            def _fetch_master():
                return (
                    postgrest_client.table("inventory")
                    .select("*")
                    .ilike("item_name", item_name)
                    .order("batch_date", desc=False)  # FIFO: oldest first
                    .execute()
                )

            master_response = await _fetch_master()
            master_items = master_response.data if master_response else []

            # Deduct from master inventory (FIFO)
            for master_item in master_items:
                if remaining_quantity <= 0:
                    break

                available_qty = float(master_item.get("stock_quantity", 0))
                if available_qty <= 0:
                    continue

                # Determine how much to take from this batch
                transfer_qty = min(remaining_quantity, available_qty)
                new_master_qty = available_qty - transfer_qty

                # Update or delete from master
                if new_master_qty <= 0:
                    @run_blocking
                    def _delete_master():
                        return (
                            postgrest_client.table("inventory")
                            .delete()
                            .eq("item_id", master_item["item_id"])
                            .execute()
                        )
                    await _delete_master()
                else:
                    new_master_status = calculate_stock_status(new_master_qty, threshold)

                    @run_blocking
                    def _update_master():
                        return (
                            postgrest_client.table("inventory")
                            .update({
                                "stock_quantity": new_master_qty,
                                "stock_status": new_master_status,
                                "updated_at": now,
                            })
                            .eq("item_id", master_item["item_id"])
                            .execute()
                        )
                    await _update_master()

                # Add to today's inventory
                await _add_to_today_inventory(
                    master_item,
                    transfer_qty,
                    threshold,
                    now
                )

                transfers.append({
                    "source": "master",
                    "batch_date": master_item["batch_date"],
                    "quantity": transfer_qty,
                    "item_id": master_item["item_id"]
                })

                remaining_quantity -= transfer_qty

        # Check if we could fulfill the entire request
        if remaining_quantity > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock. Only {requested_quantity - remaining_quantity} available, but {requested_quantity} requested."
            )

        # Log activity
        await log_user_activity(
            db,
            user,
            "FIFO transfer to today's inventory",
            f"Transferred {requested_quantity} of '{item_name}' to Today's Inventory using FIFO (Surplus: {sum(t['quantity'] for t in transfers if t['source'] == 'surplus')}, Master: {sum(t['quantity'] for t in transfers if t['source'] == 'master')})",
        )

        # Create notification for FIFO transfer
        try:
            user_row = getattr(user, "user_row", user)
            user_id = user_row.get("user_id") if isinstance(user_row, dict) else getattr(user_row, "user_id", None)
            if user_id:
                surplus_qty = sum(t["quantity"] for t in transfers if t["source"] == "surplus")
                master_qty = sum(t["quantity"] for t in transfers if t["source"] == "master")
                create_notification(
                    user_id=user_id,
                    type="transfer",
                    message=f"FIFO Transfer: {requested_quantity} units of {item_name} (Surplus: {surplus_qty}, Master: {master_qty})"
                )
        except Exception as e:
            logger.warning(f"Failed to create FIFO transfer notification: {e}")

        return {
            "message": "Item transferred to Today's Inventory using FIFO",
            "requested_quantity": requested_quantity,
            "transferred_quantity": requested_quantity - remaining_quantity,
            "transfers": transfers,
            "summary": {
                "from_surplus": sum(t["quantity"] for t in transfers if t["source"] == "surplus"),
                "from_master": sum(t["quantity"] for t in transfers if t["source"] == "master"),
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error during fifo_transfer_to_today")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


async def _add_to_today_inventory(source_item: dict, quantity: float, threshold: float, timestamp: str):
    """
    Helper function to add or update an item in today's inventory.
    """
    item_id = source_item["item_id"]
    batch_date = source_item["batch_date"]

    # Check if this exact item_id and batch_date already exists in today's inventory
    @run_blocking
    def _fetch_today():
        try:
            return (
                postgrest_client.table("inventory_today")
                .select("*")
                .eq("item_id", item_id)
                .eq("batch_date", batch_date)
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
        # Item exists, update quantity
        new_qty = float(today_item["stock_quantity"]) + quantity
        new_status = calculate_stock_status(new_qty, threshold)

        @run_blocking
        def _update_today():
            return (
                postgrest_client.table("inventory_today")
                .update({
                    "stock_quantity": new_qty,
                    "stock_status": new_status,
                    "updated_at": timestamp,
                })
                .eq("item_id", item_id)
                .eq("batch_date", batch_date)
                .execute()
            )
        await _update_today()
    else:
        # Item doesn't exist, insert new record
        transfer_status = calculate_stock_status(quantity, threshold)
        payload = {
            "item_id": source_item["item_id"],
            "item_name": source_item["item_name"],
            "batch_date": source_item["batch_date"],
            "category": source_item.get("category"),
            "stock_status": transfer_status,
            "stock_quantity": quantity,
            "expiration_date": source_item.get("expiration_date"),
            "created_at": timestamp,
            "updated_at": timestamp,
            "unit_cost": source_item.get("unit_cost", 0.00),
        }

        @run_blocking
        def _insert_today():
            return (
                postgrest_client.table("inventory_today")
                .insert(payload)
                .execute()
            )
        await _insert_today()
