from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
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


@router.delete("/{holiday_id}")
def delete_custom_holiday(holiday_id: int, db: Session = Depends(get_db)):
    holiday = db.query(CustomHoliday).filter(CustomHoliday.id == holiday_id).first()
    if not holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")
    db.delete(holiday)
    db.commit()
    return {"ok": True}
