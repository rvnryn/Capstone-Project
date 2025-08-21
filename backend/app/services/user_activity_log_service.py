import datetime
from sqlalchemy.orm import Session
from app.routes.user_activity_log import UserActivityLog
from app.schemas import UserActivityLogCreate

def create_user_activity_log(activity: UserActivityLogCreate, db: Session):
    new_activity = UserActivityLog(**activity.dict())
    db.add(new_activity)
    db.commit()
    db.refresh(new_activity)
    return new_activity

def get_user_activity_logs(
    db: Session,
    user_id: int = None,
    action_type: str = None,
    role: str = None,
    start_date: str = None,
    end_date: str = None,
    report_date: str = None,
    limit: int = 100,
):
    query = db.query(UserActivityLog)
    if user_id:
        query = query.filter(UserActivityLog.user_id == user_id)
    if action_type:
        query = query.filter(UserActivityLog.action_type == action_type)
    if role:
        query = query.filter(UserActivityLog.role == role)
    if start_date:
        query = query.filter(UserActivityLog.activity_date >= start_date)
    if end_date:
        query = query.filter(UserActivityLog.activity_date <= end_date)
    if report_date:
        query = query.filter(UserActivityLog.report_date == report_date)
    return query.order_by(UserActivityLog.activity_date.desc()).limit(limit).all()

def log_user_action(
    db: Session,
    user_id: int,
    action_type: str,
    description: str,
    username: str = None,
    role: str = None,
    activity_date: datetime = None,
    report_date: datetime = None,
):
    from datetime import datetime
    now = activity_date or datetime.utcnow()
    log = UserActivityLogCreate(
        user_id=user_id,
        action_type=action_type,
        description=description,
        activity_date=now,
        report_date=report_date or now,
        username=username,
        role=role,
    )
    return create_user_activity_log(log, db)