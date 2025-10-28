from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.supabase import get_db
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy import select
from app.models.user_activity_log import UserActivityLog

router = APIRouter()


class UserActivityLogSchema(BaseModel):
    activity_id: Optional[int]
    user_id: Optional[int]
    action_type: Optional[str]
    description: Optional[str]
    activity_date: Optional[datetime]
    report_date: Optional[datetime]
    user_name: Optional[str]
    role: Optional[str]

    class Config:
        orm_mode = True


@router.post("/user-activity", response_model=UserActivityLogSchema)
async def create_user_activity(
    activity: UserActivityLogSchema, db: Session = Depends(get_db)
):
    new_activity = UserActivityLog(**activity.dict(exclude_unset=True))
    db.add(new_activity)
    await db.flush()
    await db.commit()
    print("Committed, checking for activity...")
    latest_activity = (
        db.query(UserActivityLog).order_by(UserActivityLog.activity_id.desc()).first()
    )
    print("Latest activity:", latest_activity)
    await db.refresh(new_activity)
    return new_activity


@router.get("/user-activity", response_model=List[UserActivityLogSchema])
async def get_user_activities(
    user_id: Optional[int] = None, db: Session = Depends(get_db)
):
    stmt = select(UserActivityLog)
    if user_id:
        stmt = stmt.where(UserActivityLog.user_id == user_id)
    stmt = stmt.order_by(UserActivityLog.activity_date.desc())
    result = await db.execute(stmt)
    activities = result.scalars().all()
    return activities
