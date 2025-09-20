from fastapi import APIRouter, HTTPException, Depends, Query, Request
from slowapi.util import get_remote_address
from slowapi import Limiter

limiter = Limiter(key_func=get_remote_address, default_limits=["10/minute"])
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from app.supabase import get_db
from app.models.inventory import Inventory
from app.models.inventory_surplus import InventorySurplus
from app.models.notification_settings import NotificationSettings
from datetime import datetime, timedelta, timezone


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
                    Inventory.expiration_date > today,
                    Inventory.expiration_date <= threshold_date,
                )
            )
            .order_by(Inventory.expiration_date)
            .offset(skip)
            .limit(limit)
        )
        stmt_surplus = (
            select(InventorySurplus)
            .where(
                and_(
                    InventorySurplus.expiration_date > today,
                    InventorySurplus.expiration_date <= threshold_date,
                )
            )
            .order_by(InventorySurplus.expiration_date)
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
            .where(Inventory.expiration_date <= today)
            .order_by(Inventory.expiration_date)
            .offset(skip)
            .limit(limit)
        )
        stmt_surplus = (
            select(InventorySurplus)
            .where(InventorySurplus.expiration_date < today)
            .order_by(InventorySurplus.expiration_date)
            .offset(skip)
            .limit(limit)
        )
        result_inventory = await db.execute(stmt_inventory)
        result_surplus = await db.execute(stmt_surplus)
        expired_inventory = result_inventory.scalars().all()
        expired_surplus = result_surplus.scalars().all()
        all_expired = [item.as_dict() for item in expired_inventory + expired_surplus]
        all_expired.sort(key=lambda x: x.get("expiration_date", ""))
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
