from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.supabase import get_db
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, select
from app.models.base import Base

router = APIRouter()

class UserActivityLog(Base):
    __tablename__ = "user_activity_log"

    activity_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    action_type = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    activity_date = Column(DateTime, nullable=True)
    report_date = Column(DateTime, nullable=True)
    user_name = Column(String, nullable=True)
    role = Column(String, nullable=True)

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
async def create_user_activity(activity: UserActivityLogSchema, db: Session = Depends(get_db)):
    new_activity = UserActivityLog(**activity.dict(exclude_unset=True))
    db.add(new_activity)
    await db.flush()
    await db.commit()
    print("Committed, checking for activity...")
    activity = db.query(UserActivityLog).order_by(UserActivityLog.activity_id.desc()).first()
    print("Latest activity:", activity)
    await db.refresh(new_activity)
    return new_activity

@router.get("/user-activity", response_model=List[UserActivityLogSchema])
async def get_user_activities(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    stmt = select(UserActivityLog)
    if user_id:
        stmt = stmt.where(UserActivityLog.user_id == user_id)
    stmt = stmt.order_by(UserActivityLog.activity_date.desc())
    result = await db.execute(stmt)
    activities = result.scalars().all()
    return activities
