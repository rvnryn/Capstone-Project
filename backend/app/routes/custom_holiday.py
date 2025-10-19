from fastapi import APIRouter, HTTPException, Depends
from datetime import date
from ..models.custom_holiday import CustomHoliday
from ..models.base import Base
from app.supabase import get_db
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/custom-holidays", tags=["custom-holidays"])


class CustomHolidayCreate(BaseModel):
    date: date
    name: str
    description: Optional[str] = None


class CustomHolidayRead(BaseModel):
    id: int
    date: date
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession


@router.get("/", response_model=List[CustomHolidayRead])
async def get_custom_holidays(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CustomHoliday).order_by(CustomHoliday.date))
    return result.scalars().all()


@router.post("/", response_model=CustomHolidayRead)
async def add_custom_holiday(
    holiday: CustomHolidayCreate, db: AsyncSession = Depends(get_db)
):
    db_holiday = CustomHoliday(**holiday.dict())
    db.add(db_holiday)
    try:
        await db.commit()
        await db.refresh(db_holiday)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    # Ensure id is present and integer
    return CustomHolidayRead.from_orm(db_holiday)


@router.put("/{holiday_id}", response_model=CustomHolidayRead)
async def update_custom_holiday(
    holiday_id: int, holiday: CustomHolidayCreate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(CustomHoliday).filter(CustomHoliday.id == holiday_id))
    db_holiday = result.scalar_one_or_none()
    if not db_holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")

    # Update fields
    db_holiday.date = holiday.date
    db_holiday.name = holiday.name
    db_holiday.description = holiday.description

    try:
        await db.commit()
        await db.refresh(db_holiday)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    return CustomHolidayRead.from_orm(db_holiday)


@router.delete("/{holiday_id}")
async def delete_custom_holiday(holiday_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CustomHoliday).filter(CustomHoliday.id == holiday_id))
    holiday = result.scalar_one_or_none()
    if not holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")

    try:
        await db.delete(holiday)
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    return {"ok": True}
