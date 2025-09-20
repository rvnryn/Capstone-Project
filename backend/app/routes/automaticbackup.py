def convert_time_to_24h(time_str):
    import re
    import datetime

    time_str = str(time_str).strip()
    # Try 12-hour format with AM/PM
    match_12 = re.match(r"^(1[0-2]|0?[1-9]):([0-5][0-9]) ?([AaPp][Mm])$", time_str)
    if match_12:
        hour, minute, ampm = match_12.groups()
        hour = int(hour)
        minute = int(minute)
        if ampm.lower() == "pm" and hour != 12:
            hour += 12
        if ampm.lower() == "am" and hour == 12:
            hour = 0
        return (
            f"{hour:02d}:{minute:02d}",
            f"{(hour-12) if hour>12 else (hour if hour!=0 else 12)}:{minute:02d} {'PM' if ampm.lower() == 'pm' else 'AM'}",
        )
    # Try 24-hour format
    match_24 = re.match(r"^(?:[01]\d|2[0-3]):[0-5]\d$", time_str)
    if match_24:
        hour, minute = map(int, time_str.split(":"))
        ampm = "AM" if hour < 12 else "PM"
        hour12 = hour if 1 <= hour <= 12 else (hour - 12 if hour > 12 else 12)
        return time_str, f"{hour12}:{minute:02d} {ampm}"
    return None, None


# Map full weekday names to 3-letter abbreviations for APScheduler
WEEKDAY_MAP = {
    "monday": "mon",
    "tuesday": "tue",
    "wednesday": "wed",
    "thursday": "thu",
    "friday": "fri",
    "saturday": "sat",
    "sunday": "sun",
}
from fastapi import APIRouter, HTTPException, Depends
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, insert, Table, Column, Integer, String, MetaData
from datetime import datetime
import os
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

from app.supabase import get_db  # or your DB session dependency

router = APIRouter(prefix="/backup", tags=["backup"])
scheduler = BackgroundScheduler()
scheduler.start()

import pathlib

# Save backups in the user's Documents/cardiacdelights_backups directory
BACKUP_DIR = str(pathlib.Path.home() / "Documents" / "cardiacdelights_backups")

# --- SQLAlchemy Table for backup_schedule ---
metadata = MetaData()
backup_schedule = Table(
    "backup_schedule",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("user_id", Integer),
    Column("frequency", String),
    Column("day_of_week", String),
    Column("day_of_month", Integer),
    Column("time_of_day", String),
)


# --- Backup logic ---
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
from cryptography.fernet import Fernet
import base64


def derive_fernet_key(
    password: str, salt: bytes = b"cardiacdelights-backup-salt"
) -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=390000,
        backend=default_backend(),
    )
    key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
    return key


def backup_to_local():
    import sqlalchemy
    from sqlalchemy.engine import create_engine
    import pandas as pd
    import json
    import io
    import gzip
    import shutil

    if not os.path.exists(BACKUP_DIR):
        os.makedirs(BACKUP_DIR)
    # Use your actual database URL from environment or config
    from app.supabase import POSTGRES_URL

    engine = create_engine(POSTGRES_URL.replace("asyncpg", "psycopg2"))
    insp = sqlalchemy.inspect(engine)
    tables = insp.get_table_names()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_data = {}
    for table in tables:
        df = pd.read_sql_table(table, engine)
        backup_data[table] = df.to_dict(orient="records")

    # Always require password from environment variable
    password = os.getenv("BACKUP_ENCRYPTION_PASSWORD")
    if not password:
        raise RuntimeError(
            "BACKUP_ENCRYPTION_PASSWORD environment variable is required for automatic backup encryption."
        )
    key = derive_fernet_key(password)
    fernet = Fernet(key)

    # Compress and encrypt
    buf = io.BytesIO()
    with gzip.GzipFile(fileobj=buf, mode="w") as gz_file:
        gz_file.write(json.dumps(backup_data, default=str, indent=2).encode("utf-8"))
    buf.seek(0)
    encrypted = fernet.encrypt(buf.getvalue())

    # Save encrypted file
    backup_filename = f"backup_{timestamp}.json.enc"
    backup_path = os.path.join(BACKUP_DIR, backup_filename)
    with open(backup_path, "wb") as f:
        f.write(encrypted)
    return backup_path


# def backup_to_gdrive(filepath):
#     # Google Drive API integration
#     SERVICE_ACCOUNT_FILE = "app/credentials.json"
#     FOLDER_ID = "1nwUJZfn8B22r6HMQoGrtM2H1LsbiFn-E"
#     SCOPES = ["https://www.googleapis.com/auth/drive.file"]
#     credentials = service_account.Credentials.from_service_account_file(
#         SERVICE_ACCOUNT_FILE, scopes=SCOPES
#     )
#     drive_service = build("drive", "v3", credentials=credentials)
#     file_metadata = {"name": os.path.basename(filepath), "parents": [FOLDER_ID]}
#     media = MediaFileUpload(filepath, resumable=True)
#     file = (
#         drive_service.files()
#         .create(body=file_metadata, media_body=media, fields="id")
#         .execute()
#     )
#     print(f'Uploaded to Google Drive with file ID: {file.get("id")}')


def backup_to_s3(filepath):
    import boto3
    import os

    bucket_name = os.getenv("AWS_S3_BUCKET_NAME")
    if not bucket_name:
        print("AWS_S3_BUCKET_NAME not set in environment. Skipping S3 upload.")
        return
    s3 = boto3.client(
        "s3",
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        region_name=os.getenv("AWS_DEFAULT_REGION"),
    )
    key = os.path.basename(filepath)
    # Enforce only encrypted files are uploaded
    if not filepath.endswith(".enc"):
        print(
            "Error: Only encrypted backup files (.enc) may be uploaded to S3. Aborting upload."
        )
        return
    try:
        s3.upload_file(filepath, bucket_name, key)
        print(f"Uploaded encrypted backup to S3 bucket '{bucket_name}' as '{key}'")
    except Exception as e:
        print(f"Failed to upload to S3: {e}")


def scheduled_backup():
    filepath = backup_to_local()
    # backup_to_gdrive(filepath)
    backup_to_s3(filepath)
    print(f"Backup completed: {filepath} (local + Google Drive + S3)")


def reschedule_backup(frequency, day_of_week, day_of_month, time_of_day):
    scheduler.remove_all_jobs()
    hour, minute = map(int, time_of_day.split(":"))
    if frequency == "daily":
        scheduler.add_job(scheduled_backup, "cron", hour=hour, minute=minute)
    elif frequency == "weekly":
        # Convert full weekday name to 3-letter abbreviation if needed
        day_of_week_short = WEEKDAY_MAP.get(str(day_of_week).lower(), day_of_week)
        scheduler.add_job(
            scheduled_backup,
            "cron",
            day_of_week=day_of_week_short,
            hour=hour,
            minute=minute,
        )
    elif frequency == "monthly":
        scheduler.add_job(
            scheduled_backup, "cron", day=day_of_month, hour=hour, minute=minute
        )


# --- API Endpoints ---


@router.post("/schedule")
async def update_schedule(settings: dict, session: AsyncSession = Depends(get_db)):
    user_id = 1  # Replace with actual user/session logic
    time_of_day_raw = settings.get("time_of_day", "")
    time_of_day_24h, time_of_day_12h = convert_time_to_24h(time_of_day_raw)
    if not time_of_day_24h:
        raise HTTPException(
            status_code=422,
            detail="Invalid time_of_day. Use HH:MM (24-hour) or HH:MM AM/PM (12-hour) format.",
        )
    stmt = select(backup_schedule).where(backup_schedule.c.user_id == user_id)
    result = await session.execute(stmt)
    row = result.scalar_one_or_none()
    if row:
        await session.execute(
            update(backup_schedule)
            .where(backup_schedule.c.user_id == user_id)
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
                user_id=user_id,
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
    return {"message": "Backup schedule updated", "time_of_day": time_of_day_12h}


@router.get("/schedule")
async def get_schedule(session: AsyncSession = Depends(get_db)):
    user_id = 1  # Replace with actual user/session logic
    stmt = select(backup_schedule).where(backup_schedule.c.user_id == user_id)
    result = await session.execute(stmt)
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="No schedule found")
    # Add 12h format for frontend
    time_of_day_24h = row["time_of_day"]
    _, time_of_day_12h = convert_time_to_24h(time_of_day_24h)
    out = dict(row)
    out["time_of_day_12h"] = time_of_day_12h
    return out


# --- On startup, load and schedule ---
async def load_and_schedule(session: AsyncSession):
    user_id = 1  # Replace with actual user/session logic
    stmt = select(backup_schedule).where(backup_schedule.c.user_id == user_id)
    result = await session.execute(stmt)
    row = result.mappings().first()
    if row:
        reschedule_backup(
            row["frequency"],
            row["day_of_week"],
            row["day_of_month"],
            row["time_of_day"],
        )
