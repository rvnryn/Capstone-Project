from fastapi import APIRouter, HTTPException, Depends, Query, Request
from slowapi.util import get_remote_address
from slowapi import Limiter
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, text, cast, Date, String
from app.supabase import get_db
from app.models.inventory import Inventory
from app.models.inventory_surplus import InventorySurplus
from app.models.notification_settings import NotificationSettings
from app.models.inventory_spoilage import InventorySpoilage
from datetime import datetime, timedelta, timezone, date
import pandas as pd
from prophet import Prophet
import matplotlib.pyplot as plt


router = APIRouter()

limiter = Limiter(key_func=get_remote_address, default_limits=["10/minute"])

@limiter.limit("10/minute")
@router.get("/dashboard/low-stock")
async def get_low_stock_inventory(
    request: Request,
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    try:
        stmt = (
            select(Inventory)
            .where(Inventory.stock_status == "Low")
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(stmt)
        items = result.scalars().all()
        return [item.as_dict() for item in items]
    except Exception as e:
        print("Error fetching low stock inventory:", e)
        raise HTTPException(status_code=500, detail=str(e))


async def get_expiration_alert_days(db: AsyncSession):
    try:
        stmt = select(NotificationSettings.expiration_days).limit(1)
        result = await db.execute(stmt)
        days = result.scalar_one_or_none()
        return int(days) if days is not None else 7
    except Exception:
        return 7


@limiter.limit("10/minute")
@router.get("/dashboard/expiring-ingredients")
async def get_expiring_ingredients(
    request: Request,
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    try:
        today = datetime.now(timezone.utc).date()
        alert_days = await get_expiration_alert_days(db)
        threshold_date = today + timedelta(days=alert_days)
        print(f"[DEBUG] Today: {today}, Threshold Date: {threshold_date}")
        stmt_inventory = (
            select(Inventory)
            .where(
                and_(
                    cast(Inventory.expiration_date, Date) > today,
                    cast(Inventory.expiration_date, Date) <= threshold_date,
                )
            )
            .order_by(cast(Inventory.expiration_date, Date))
            .offset(skip)
            .limit(limit)
        )

        stmt_surplus = (
            select(InventorySurplus)
            .where(
                and_(
                    cast(InventorySurplus.expiration_date, Date) > today,
                    cast(InventorySurplus.expiration_date, Date) <= threshold_date,
                )
            )
            .order_by(cast(InventorySurplus.expiration_date, Date))
            .offset(skip)
            .limit(limit)
        )
        result_inventory = await db.execute(stmt_inventory)
        result_surplus = await db.execute(stmt_surplus)
        expiring_inventory = result_inventory.scalars().all()
        expiring_surplus = result_surplus.scalars().all()
        print(
            f"[DEBUG] Expiring Inventory Items: {[str(item.expiration_date) for item in expiring_inventory]}"
        )
        print(
            f"[DEBUG] Expiring Surplus Items: {[str(item.expiration_date) for item in expiring_surplus]}"
        )
        all_expiring = [
            item.as_dict() for item in expiring_inventory + expiring_surplus
        ]
        all_expiring.sort(key=lambda x: x.get("expiration_date", ""))
        print(
            f"[DEBUG] All Expiring Returned: {[x.get('expiration_date', '') for x in all_expiring]}"
        )
        return all_expiring
    except Exception as e:
        print("Error fetching expiring ingredients:", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dashboard/expired-ingredients")
async def get_expired_ingredients(
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    try:
        today = datetime.now(timezone.utc).date()
        stmt_spoilage = (
            select(InventorySpoilage)
            .where(
                (cast(InventorySpoilage.reason, String) == "Expired"),
            )
            .order_by(cast(InventorySpoilage.expiration_date, Date))
            .offset(skip)
            .limit(limit)
        )

        result_spoilage = await db.execute(stmt_spoilage)
        expired_spoilage = result_spoilage.scalars().all()

        all_expired = []
        seen = set()

        for spoil in expired_spoilage:
            d = spoil.as_dict()
            # Use spoilage fields exactly as in the database, but provide fallback values
            item_name = d.get("item_name") or "N/A"
            category = d.get("category") or "N/A"
            batch_date = d.get("batch_date")
            stock = d.get("quantity_spoiled")
            if stock is None:
                stock = d.get("quantity")
            if stock is None:
                stock = d.get("stock")
            if stock is None:
                stock = 0

            def format_date(val):
                if not val:
                    return "N/A"
                if isinstance(val, str):
                    # Try several common formats
                    for fmt in [
                        "%Y-%m-%d",
                        "%Y-%m-%dT%H:%M:%S.%fZ",
                        "%Y-%m-%d %H:%M:%S%z",
                        "%Y-%m-%d %H:%M:%S",
                        "%Y-%m-%dT%H:%M:%S%z",
                        "%Y-%m-%dT%H:%M:%S",
                    ]:
                        try:
                            return datetime.strptime(val, fmt).strftime("%b %d, %Y")
                        except Exception:
                            continue
                    return "N/A"
                elif isinstance(val, date):
                    return val.strftime("%b %d, %Y")
                return "N/A"

            batch_date_formatted = format_date(batch_date)
            expiration_date = d.get("expiration_date")
            expiration_date_formatted = format_date(expiration_date)
            spoilage_date = d.get("spoilage_date")
            spoilage_date_formatted = format_date(spoilage_date)

            mapped = {
                "id": d.get("spoilage_id"),
                "item_id": d.get("item_id"),
                "item_name": item_name,
                "category": category,
                "stock": stock,
                "batch_date": batch_date_formatted,
                "quantity_spoiled": d.get("quantity_spoiled") or d.get("quantity") or 0,
                "expiration_date": expiration_date_formatted,
                "spoilage_date": spoilage_date_formatted,
                "reason": d.get("reason") or "Expired",
                "created_at": d.get("created_at"),
                "updated_at": d.get("updated_at"),
            }
            dedup_key = (
                mapped["item_id"],
                mapped["batch_date"],
                mapped["spoilage_date"],
            )
            if dedup_key in seen:
                continue
            seen.add(dedup_key)
            all_expired.append(mapped)

        all_expired.sort(
            key=lambda x: (
                x["expiration_date"]
                if isinstance(x["expiration_date"], date)
                and x["expiration_date"] is not None
                else datetime.min.date()
            )
        )
        return all_expired
    except Exception as e:
        print("Error fetching expired ingredients:", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dashboard/surplus-ingredients")
async def get_surplus_ingredients(
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    try:
        stmt = select(InventorySurplus).offset(skip).limit(limit)
        result = await db.execute(stmt)
        items = result.scalars().all()
        return [item.as_dict() for item in items]
    except Exception as e:
        print("Error fetching surplus ingredients:", e)
        raise HTTPException(status_code=500, detail=str(e))


@limiter.limit("10/minute")
@router.get("/dashboard/out-of-stock")
async def get_out_of_stock_inventory(
    request: Request,
    db: AsyncSession = Depends(get_db),
    table: str = Query("inventory_today", regex="^(inventory|inventory_today)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    """
    Get items that are completely out of stock (aggregate across all batches).

    Uses multi-batch logic:
    - Groups by item_name
    - Only includes items where SUM(stock_quantity) = 0 across ALL batches
    - Shows all batches for each out-of-stock item

    Args:
        table: Which inventory table to query ("inventory_today" or "inventory")
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return
    """
    try:
        if table == "inventory_today":
            # Use aggregate logic: only show items where ALL batches are depleted
            stmt = text("""
                WITH item_totals AS (
                    SELECT
                        item_name,
                        SUM(stock_quantity) as total_stock,
                        COUNT(*) as batch_count
                    FROM inventory_today
                    GROUP BY item_name
                )
                SELECT
                    it.item_id,
                    it.item_name,
                    it.batch_date,
                    it.stock_quantity,
                    it.stock_status,
                    it.expiration_date,
                    it.category,
                    totals.total_stock,
                    totals.batch_count
                FROM inventory_today it
                INNER JOIN item_totals totals ON LOWER(it.item_name) = LOWER(totals.item_name)
                WHERE totals.total_stock = 0
                ORDER BY it.item_name, it.batch_date
                LIMIT :limit OFFSET :skip
            """)
            result = await db.execute(stmt, {"limit": limit, "skip": skip})

            items = []
            for row in result:
                items.append({
                    "item_id": row.item_id,
                    "item_name": row.item_name,
                    "batch_date": row.batch_date.isoformat() if row.batch_date else None,
                    "stock_quantity": float(row.stock_quantity),
                    "stock_status": row.stock_status,
                    "total_stock": float(row.total_stock),
                    "batch_count": row.batch_count,
                    "expiration_date": row.expiration_date.isoformat() if row.expiration_date else None,
                    "category": row.category
                })
            return items
        else:
            # Original logic for master inventory (no batching in master inventory)
            stmt = (
                select(Inventory)
                .where(Inventory.stock_status == "Out Of Stock")
                .offset(skip)
                .limit(limit)
            )
            result = await db.execute(stmt)
            items = result.scalars().all()
            return [item.as_dict() for item in items]
    except Exception as e:
        print("Error fetching out of stock inventory:", e)
        raise HTTPException(status_code=500, detail=str(e))


@limiter.limit("10/minute")
@router.get("/dashboard/spoilage")
async def get_spoilage_inventory(
    request: Request,
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    try:
        stmt = (
            select(InventorySpoilage)
            .order_by(InventorySpoilage.spoilage_date.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(stmt)
        items = result.scalars().all()

        def format_date(val):
            if not val:
                return "N/A"
            if isinstance(val, str):
                for fmt in [
                    "%Y-%m-%d",
                    "%Y-%m-%dT%H:%M:%S.%fZ",
                    "%Y-%m-%d %H:%M:%S%z",
                    "%Y-%m-%d %H:%M:%S",
                    "%Y-%m-%dT%H:%M:%S%z",
                    "%Y-%m-%dT%H:%M:%S",
                ]:
                    try:
                        return datetime.strptime(val, fmt).strftime("%b %d, %Y")
                    except Exception:
                        continue
                return "N/A"
            elif isinstance(val, date):
                return val.strftime("%b %d, %Y")
            return "N/A"

        formatted_items = []
        for spoil in items:
            d = spoil.as_dict()
            item_name = d.get("item_name") or "N/A"
            category = d.get("category") or "N/A"
            batch_date = d.get("batch_date")
            stock = d.get("quantity_spoiled")
            if stock is None:
                stock = d.get("quantity")
            if stock is None:
                stock = d.get("stock")
            if stock is None:
                stock = 0

            batch_date_formatted = format_date(batch_date)
            expiration_date = d.get("expiration_date")
            expiration_date_formatted = format_date(expiration_date)
            spoilage_date = d.get("spoilage_date")
            spoilage_date_formatted = format_date(spoilage_date)

            mapped = {
                "id": d.get("spoilage_id"),
                "item_id": d.get("item_id"),
                "item_name": item_name,
                "category": category,
                "stock": stock,
                "batch_date": batch_date_formatted,
                "quantity_spoiled": d.get("quantity_spoiled") or d.get("quantity") or 0,
                "expiration_date": expiration_date_formatted,
                "spoilage_date": spoilage_date_formatted,
                "reason": d.get("reason") or "Spoilage",
                "created_at": d.get("created_at"),
                "updated_at": d.get("updated_at"),
            }
            formatted_items.append(mapped)

        return formatted_items
    except Exception as e:
        print("Error fetching spoilage inventory:", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/inventory-forecast")
async def inventory_forecast(
    item_id: int = Query(..., description="Item ID to forecast"),
    periods: int = Query(30, description="Days to forecast"),
    db: AsyncSession = Depends(get_db),
):

    print(f"[Inventory Forecast] Received item_id: {item_id}")
    query = text(
        "SELECT action_date, remaining_stock FROM inventory_log WHERE item_id = :item_id ORDER BY action_date"
    )
    result = await db.execute(query, {"item_id": item_id})
    rows = result.fetchall()
    print(f"[Inventory Forecast] Rows found for item_id {item_id}: {len(rows)}")
    if not rows:
        raise HTTPException(status_code=404, detail="No data for this item_id")
    df = pd.DataFrame(rows, columns=["action_date", "remaining_stock"])

    df["ds"] = pd.to_datetime(df["action_date"]).dt.tz_localize(None)
    df = df.sort_values("ds")
    df["y"] = df["remaining_stock"]
    # 3. Train Prophet model
    model = Prophet()
    model.fit(df[["ds", "y"]])

    future = model.make_future_dataframe(periods=periods)
    forecast = model.predict(future)

    forecast_json = (
        forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]]
        .tail(periods)
        .to_dict(orient="records")
    )
    return {"item_id": item_id, "forecast": forecast_json}
