from fastapi import APIRouter, HTTPException, Depends, Query, Request
from slowapi.util import get_remote_address
from slowapi import Limiter

limiter = Limiter(key_func=get_remote_address, default_limits=["10/minute"])
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, text, cast, Date
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
        stmt_inventory = (
            select(Inventory)
            .where(cast(Inventory.expiration_date, Date) <= today)
            .order_by(cast(Inventory.expiration_date, Date))
            .offset(skip)
            .limit(limit)
        )

        stmt_surplus = (
            select(InventorySurplus)
            .where(cast(InventorySurplus.expiration_date, Date) < today)
            .order_by(cast(InventorySurplus.expiration_date, Date))
            .offset(skip)
            .limit(limit)
        )
        result_inventory = await db.execute(stmt_inventory)
        result_surplus = await db.execute(stmt_surplus)
        expired_inventory = result_inventory.scalars().all()
        expired_surplus = result_surplus.scalars().all()

        all_expired = [item.as_dict() for item in expired_inventory + expired_surplus]
        # Robustly convert expiration_date to date if it's a string
        for entry in all_expired:
            exp = entry.get("expiration_date")
            if isinstance(exp, str):
                try:
                    entry["expiration_date"] = datetime.strptime(exp, "%Y-%m-%d").date()
                except Exception:
                    entry["expiration_date"] = None
            elif exp is None:
                entry["expiration_date"] = None
        # Sort, using a safe default for missing/invalid dates
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
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    try:
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
        return [item.as_dict() for item in items]
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
