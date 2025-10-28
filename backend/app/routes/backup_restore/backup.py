from fastapi import UploadFile, File, Form
from apscheduler.schedulers.background import BackgroundScheduler
import io
import gzip
import json
import pandas as pd
import os
import pathlib
import base64
import subprocess
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Body
from fastapi.responses import StreamingResponse
from sqlalchemy.engine import create_engine
from starlette.concurrency import run_in_threadpool
from app.supabase import get_db, POSTGRES_URL, SUPABASE_URL, SUPABASE_API_KEY
from app.utils.rbac import require_role
from app.models.user_activity_log import UserActivityLog
from fastapi import APIRouter, HTTPException, Depends, Body
from sqlalchemy import update, insert, Table, Column, Integer, String, MetaData, select, text
from supabase import create_client, Client
from apscheduler.schedulers.background import BackgroundScheduler 
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
import asyncio
from app.supabase import get_db
from app.utils.rbac import get_owner_user
from app.models.user_activity_log import UserActivityLog
from sqlalchemy.orm import Session

router = APIRouter()
BACKUP_DIR = str(pathlib.Path.home() / "Documents" / "cardiacdelights_backups")
SUPABASE_BUCKET = "cardiacdelights-backup"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_API_KEY)
scheduler = BackgroundScheduler()
scheduler.start()

def derive_fernet_key(password: str, salt: bytes = b"cardiacdelights-backup-salt") -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=390000,
        backend=default_backend(),
    )
    return base64.urlsafe_b64encode(kdf.derive(password.encode()))

def convert_time_to_12h(time_str: str):
    try:
        dt = datetime.strptime(time_str, "%H:%M")
        return dt.strftime("%I:%M %p")
    except Exception:
        return None

def convert_time_to_24h(time_str: str):
    import re
    time_str = time_str.strip().upper().replace('.', '')
    # Try HH:MM AM/PM
    match = re.match(r'^(1[0-2]|0?[1-9]):([0-5][0-9]) ?([AP]M)$', time_str)
    if match:
        hour, minute, ampm = int(match.group(1)), int(match.group(2)), match.group(3)
        if ampm == 'PM' and hour != 12:
            hour += 12
        if ampm == 'AM' and hour == 12:
            hour = 0
        return f"{hour:02d}:{minute:02d}"
    # Try HH AM/PM
    match = re.match(r'^(1[0-2]|0?[1-9]) ?([AP]M)$', time_str)
    if match:
        hour, ampm = int(match.group(1)), match.group(2)
        if ampm == 'PM' and hour != 12:
            hour += 12
        if ampm == 'AM' and hour == 12:
            hour = 0
        return f"{hour:02d}:00"
    # Try 24-hour HH:MM
    match = re.match(r'^(?:[01]\d|2[0-3]):[0-5]\d$', time_str)
    if match:
        return time_str
    return None

def upload_to_supabase_storage(filepath):
    with open(filepath, "rb") as f:
        data = f.read()
    filename = os.path.basename(filepath)
    response = supabase.storage.from_(SUPABASE_BUCKET).upload(filename, data)
    return response


@router.post("/schedule")
async def update_schedule(settings: dict, session=Depends(get_db), user=Depends(require_role("Owner"))):
    time_of_day_raw = settings.get("time_of_day", "")
    if not time_of_day_raw:
        raise HTTPException(status_code=422, detail="time_of_day is required")
    time_of_day_24h = convert_time_to_24h(time_of_day_raw)
    if not time_of_day_24h:
        raise HTTPException(
            status_code=422,
            detail="Invalid time_of_day. Use HH:MM AM/PM or HH:MM (24-hour) format.",
        )
    time_of_day_12h = convert_time_to_12h(time_of_day_24h)
    metadata = MetaData()
    backup_schedule = Table(
        "backup_schedule",
        metadata,
        Column("id", Integer, primary_key=True),
        Column("frequency", String),
        Column("day_of_week", String),
        Column("day_of_month", Integer),
        Column("time_of_day", String),
    )
    stmt = select(backup_schedule).where(backup_schedule.c.id == 1)
    result = await session.execute(stmt)
    row = result.scalar_one_or_none()
    if row:
        await session.execute(
            update(backup_schedule)
            .where(backup_schedule.c.id == 1)
            .values(
                frequency=settings["frequency"],
                day_of_week=settings.get("day_of_week"),
                day_of_month=settings.get("day_of_month"),
                time_of_day=time_of_day_24h,
            )
        )
    else:
        await session.execute(
            insert(backup_schedule).values(
                id=1,
                frequency=settings["frequency"],
                day_of_week=settings.get("day_of_week"),
                day_of_month=settings.get("day_of_month"),
                time_of_day=time_of_day_24h,
            )
        )
    await session.commit()
    reschedule_backup(
        settings["frequency"],
        settings.get("day_of_week"),
        settings.get("day_of_month"),
        time_of_day_24h,
    )
    user_row = getattr(user, "user_row", user) if user else None
    new_activity = UserActivityLog(
        user_id=user_row.get("user_id") if user_row else None,
        action_type="update backup schedule",
        description=f"Backup schedule updated: frequency={settings['frequency']}, day_of_week={settings.get('day_of_week')}, day_of_month={settings.get('day_of_month')}, time_of_day={time_of_day_12h}",
        activity_date=datetime.utcnow(),
        report_date=datetime.utcnow(),
        user_name=user_row.get("name") if user_row else None,
        role=user_row.get("user_role") if user_row else None,
    )
    session.add(new_activity)
    await session.flush()
    await session.commit()
    return {"message": "Backup schedule updated", "time_of_day": time_of_day_12h}


@router.get("/schedule")
async def get_schedule(session=Depends(get_db), user=Depends(require_role("Owner"))):
    metadata = MetaData()
    backup_schedule = Table(
        "backup_schedule",
        metadata,
        Column("id", Integer, primary_key=True),
        Column("frequency", String),
        Column("day_of_week", String),
        Column("day_of_month", Integer),
        Column("time_of_day", String),
    )
    stmt = select(backup_schedule).where(backup_schedule.c.id == 1)
    result = await session.execute(stmt)
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="No schedule found")
    out = dict(row)
    # Return time_of_day in 24-hour format for frontend compatibility
    out["time_of_day_12h"] = convert_time_to_12h(row["time_of_day"])
    # time_of_day is left as 24-hour format (as stored in DB)
    return out

@router.post("/backup")
async def manual_backup(session=Depends(get_db), user=Depends(require_role("Owner")), password: str = Body(...)):
    engine = create_engine(POSTGRES_URL.replace("asyncpg", "psycopg2"))
    insp = engine.inspect(engine)
    tables = insp.get_table_names()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_data = {}
    for table in tables:
        df = pd.read_sql_table(table, engine)
        backup_data[table] = df.to_dict(orient="records")
    key = derive_fernet_key(password)
    fernet = Fernet(key)
    buf = io.BytesIO()
    with gzip.GzipFile(fileobj=buf, mode="w") as gz_file:
        gz_file.write(json.dumps(backup_data, default=str, indent=2).encode("utf-8"))
    buf.seek(0)
    encrypted = fernet.encrypt(buf.getvalue())
    backup_filename = f"backup_{timestamp}.json.enc"
    os.makedirs(BACKUP_DIR, exist_ok=True)
    local_path = os.path.join(BACKUP_DIR, backup_filename)
    with open(local_path, "wb") as f:
        f.write(encrypted)
    upload_to_supabase_storage(local_path)
    user_row = getattr(user, "user_row", user) if user else None
    new_activity = UserActivityLog(
        user_id=user_row.get("user_id") if user_row else None,
        action_type="manual backup",
        description=f"Backup: triggered manually",
        activity_date=datetime.utcnow(),
        report_date=datetime.utcnow(),
        user_name=user_row.get("name") if user_row else None,
        role=user_row.get("user_role") if user_row else None,
    )
    session.add(new_activity)
    await session.flush()
    await session.commit()
    return {"message": "Backup triggered successfully.", "filename": backup_filename}

@router.get("/list-backups")
async def list_supabase_backups():
	try:
		files = await run_in_threadpool(lambda: supabase.storage.from_(SUPABASE_BUCKET).list())
		return {"files": [f["name"] for f in files]}
	except Exception as e:
		print(f"[List Backups Debug] Exception: {e}")
		raise HTTPException(status_code=500, detail="Failed to list backups")

async def load_and_schedule(session):
    from sqlalchemy import select, MetaData, Table, Integer, String

    metadata = MetaData()
    backup_schedule = Table(
        "backup_schedule",
        metadata,
        Column("id", Integer, primary_key=True),
        Column("frequency", String),
        Column("day_of_week", String),
        Column("day_of_month", Integer),
        Column("time_of_day", String),
    )
    stmt = select(backup_schedule).where(backup_schedule.c.id == 1)
    result = await session.execute(stmt)
    row = result.mappings().first()
    if row:
        frequency = row["frequency"]
        day_of_week = row.get("day_of_week")
        day_of_month = row.get("day_of_month")
        time_of_day = row.get("time_of_day")
        time_of_day_24h = convert_time_to_24h(time_of_day) if time_of_day else None
        if frequency and time_of_day_24h:
            reschedule_backup(frequency, day_of_week, day_of_month, time_of_day_24h)


# This version is for API endpoint (manual trigger)
async def scheduled_backup(session=Depends(get_db), user=Depends(require_role("Owner"))):
    await _run_scheduled_backup(session, user)

# This version is for APScheduler (automatic trigger)
def scheduled_backup_job():
    
    # Create DB session manually
    session = None
    from app.supabase import SyncSessionLocal
    try:
        session = SyncSessionLocal()
        # Get Owner user context (custom helper, or fallback to None)
        user = get_owner_user(session)
        run_scheduled_backup_sync(session, user)
    except Exception as e:
        print(f"[Scheduled Backup Job] Error: {e}")
    finally:
        if session:
            session.close()

# Shared backup logic
async def _run_scheduled_backup(session, user):
    from sqlalchemy import create_engine, inspect
    engine = create_engine(POSTGRES_URL.replace("asyncpg", "psycopg2"))
    insp = inspect(engine)
    tables = insp.get_table_names()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_data = {}
    for table in tables:
        df = pd.read_sql_table(table, engine)
        backup_data[table] = df.to_dict(orient="records")
    password = os.getenv("BACKUP_ENCRYPTION_PASSWORD", "default_password")
    key = derive_fernet_key(password)
    fernet = Fernet(key)
    buf = io.BytesIO()
    with gzip.GzipFile(fileobj=buf, mode="w") as gz_file:
        gz_file.write(json.dumps(backup_data, default=str, indent=2).encode("utf-8"))
    buf.seek(0)
    encrypted = fernet.encrypt(buf.getvalue())
    backup_filename = f"backup_{timestamp}.json.enc"
    os.makedirs(BACKUP_DIR, exist_ok=True)
    local_path = os.path.join(BACKUP_DIR, backup_filename)
    with open(local_path, "wb") as f:
        f.write(encrypted)
    upload_to_supabase_storage(local_path)
    user_row = getattr(user, "user_row", user) if user else None
    new_activity = UserActivityLog(
        user_id=user_row.get("user_id") if user_row else None,
        action_type="scheduled backup",
        description=f"Backup: triggered by schedule",
        activity_date=datetime.utcnow(),
        report_date=datetime.utcnow(),
        user_name=user_row.get("name") if user_row else None,
        role=user_row.get("user_role") if user_row else None,
    )
    session.add(new_activity)
    await session.flush()
    await session.commit()
    print(f"Backup completed and uploaded at {datetime.now(timezone.utc)} (encrypted)")
        
def reschedule_backup(frequency, day_of_week, day_of_month, time_of_day):
    import asyncio
    from functools import partial

    scheduler.remove_all_jobs()
    hour, minute = map(int, time_of_day.split(":"))
    WEEKDAY_MAP = {
        "monday": "mon",
        "tuesday": "tue",
        "wednesday": "wed",
        "thursday": "thu",
        "friday": "fri",
        "saturday": "sat",
        "sunday": "sun",
    }

    if frequency == "daily":
        scheduler.add_job(scheduled_backup_job, "cron", hour=hour, minute=minute)
    elif frequency == "weekly":
        day_of_week_short = WEEKDAY_MAP.get(str(day_of_week).lower(), day_of_week)
        scheduler.add_job(
            scheduled_backup_job,
            "cron",
            day_of_week=day_of_week_short,
            hour=hour,
            minute=minute,
        )
    elif frequency == "monthly":
        scheduler.add_job(
            scheduled_backup_job, "cron", day=day_of_month, hour=hour, minute=minute
        )

# Synchronous backup logic for scheduled jobs
def run_scheduled_backup_sync(session, user):
    from sqlalchemy import create_engine, inspect
    import gzip, io, json, os
    from datetime import datetime, timezone
    engine = create_engine(POSTGRES_URL.replace("asyncpg", "psycopg2"))
    insp = inspect(engine)
    tables = insp.get_table_names()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_data = {}
    for table in tables:
        import pandas as pd
        df = pd.read_sql_table(table, engine)
        backup_data[table] = df.to_dict(orient="records")
    password = os.getenv("BACKUP_ENCRYPTION_PASSWORD", "default_password")
    key = derive_fernet_key(password)
    from cryptography.fernet import Fernet
    fernet = Fernet(key)
    buf = io.BytesIO()
    with gzip.GzipFile(fileobj=buf, mode="w") as gz_file:
        gz_file.write(json.dumps(backup_data, default=str, indent=2).encode("utf-8"))
    buf.seek(0)
    encrypted = fernet.encrypt(buf.getvalue())
    backup_filename = f"backup_{timestamp}.json.enc"
    os.makedirs(BACKUP_DIR, exist_ok=True)
    local_path = os.path.join(BACKUP_DIR, backup_filename)
    with open(local_path, "wb") as f:
        f.write(encrypted)
    upload_to_supabase_storage(local_path)
    user_row = getattr(user, "user_row", user) if user else None
    from app.models.user_activity_log import UserActivityLog
    new_activity = UserActivityLog(
        user_id=user_row.get("user_id") if user_row else None,
        action_type="scheduled backup",
        description=f"Backup: triggered by schedule",
        activity_date=datetime.utcnow(),
        report_date=datetime.utcnow(),
        user_name=user_row.get("name") if user_row else None,
        role=user_row.get("user_role") if user_row else None,
    )
    session.add(new_activity)
    session.commit()
    print(f"Backup completed and uploaded at {datetime.now(timezone.utc)} (encrypted)")