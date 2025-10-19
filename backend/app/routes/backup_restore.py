from fastapi.responses import StreamingResponse
from fastapi import UploadFile, File, Form
import asyncio
import os
from fastapi import (
    APIRouter,
    HTTPException,
    Depends,
    Form,
)
from sqlalchemy import text, Column
from app.supabase import get_db
from datetime import datetime, date
from app.utils.rbac import require_role
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
from cryptography.fernet import Fernet
import base64
import pathlib
from supabase import create_client, Client
import sqlalchemy
from sqlalchemy.engine import create_engine
import pandas as pd
import json
import io
import gzip
from app.supabase import POSTGRES_URL
import traceback
from starlette.concurrency import run_in_threadpool

# Import SUPABASE_URL and SUPABASE_API_KEY directly from supabase.py (always patched with protocol)
from app.supabase import SUPABASE_URL, SUPABASE_API_KEY
SUPABASE_BUCKET = "cardiacdelights-backup"  # Ensure this bucket exists in Supabase Storage
# SUPABASE_BUCKET = "test" 
supabase: Client = create_client(SUPABASE_URL, SUPABASE_API_KEY)
print(supabase.storage.from_("cardiacdelights-backup").list())
BACKUP_DIR = str(pathlib.Path.home() / "Documents" / "cardiacdelights_backups")
router = APIRouter()


# Fernet key derivation function
def derive_fernet_key(
    password: str, salt: bytes = b"cardiacdelights-backup-salt"
) -> bytes:
    print(f"[Fernet Key Debug] Password: '{password}' | Salt: {salt}")
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=390000,
        backend=default_backend(),
    )
    key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
    print(f"[Fernet Key Debug] Derived Key: {key}")
    return key


def upload_to_supabase_storage(filepath):
    with open(filepath, "rb") as f:
        data = f.read()
    filename = os.path.basename(filepath)
    response = supabase.storage.from_(SUPABASE_BUCKET).upload(filename, data)
    print(f"Uploaded backup to Supabase Storage: {response}")
    return filename


def download_from_supabase_storage(filename):
    response = supabase.storage.from_(SUPABASE_BUCKET).download(filename)
    return response


@router.get("/backup")
async def get_backup(password: str = os.getenv("BACKUP_ENCRYPTION_PASSWORD")):
    try:
        # Generate backup and upload to Supabase Storage and save to local BACKUP_DIR
        print(f"[Restore Debug] Using POSTGRES_URL: {POSTGRES_URL}")
        engine = create_engine(POSTGRES_URL.replace("asyncpg", "psycopg2"))
        insp = sqlalchemy.inspect(engine)
        tables = insp.get_table_names()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_data = {}
        # List of tables to skip (logs, audit, cache, etc.)
        skip_tables = ["logs", "audit", "cache"]
        for table in tables:
            if table in skip_tables:
                continue
            # For very large tables, read in chunks
            from sqlalchemy import text

            with engine.connect() as conn:
                row_count = conn.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
            if row_count > 10000:
                # Read in chunks of 5000 rows
                offset = 0
                chunk_size = 5000
                all_rows = []
                while offset < row_count:
                    chunk_df = pd.read_sql_query(
                        f"SELECT * FROM {table} LIMIT {chunk_size} OFFSET {offset}",
                        engine,
                    )
                    all_rows.extend(chunk_df.to_dict(orient="records"))
                    offset += chunk_size
                backup_data[table] = all_rows
            else:
                df = pd.read_sql_table(table, engine)
                backup_data[table] = df.to_dict(orient="records")
        key = derive_fernet_key(password)
        fernet = Fernet(key)
        print(
            f"[Backup Debug] Password: '{password}' | Salt: b'cardiacdelights-backup-salt'"
        )
        print(f"[Backup Debug] Derived Key: {key}")
        buf = io.BytesIO()
        with gzip.GzipFile(fileobj=buf, mode="w") as gz_file:
            gz_file.write(
                json.dumps(backup_data, default=str, indent=2).encode("utf-8")
            )
        buf.seek(0)
        encrypted = fernet.encrypt(buf.getvalue())
        print(f"[Backup Debug] Encrypted file length: {len(encrypted)} bytes")
        print(f"[Backup Debug] First 64 bytes: {encrypted[:64]}")
        backup_filename = f"backup_{timestamp}.json.enc"
        # Save to local BACKUP_DIR
        os.makedirs(BACKUP_DIR, exist_ok=True)
        local_path = os.path.join(BACKUP_DIR, backup_filename)
        with open(local_path, "wb") as f:
            f.write(encrypted)
        print(f"[Backup Debug] Saved local backup to {local_path}")
        # Upload to Supabase Storage
        supabase.storage.from_(SUPABASE_BUCKET).upload(backup_filename, encrypted)
        # Return file as response
        response_buf = io.BytesIO(encrypted)
        return StreamingResponse(
            response_buf,
            media_type="application/octet-stream",
            headers={"Content-Disposition": f"attachment; filename={backup_filename}"},
        )
    except Exception as e:
        import traceback

        print(
            f"[Backup Debug] Password: '{password}' | Salt: b'cardiacdelights-backup-salt'"
        )
        print(f"[Backup Debug] Derived Key: {key}")
        print("Backup error:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Backup failed: {str(e)}")


@router.post("/restore-local")
async def restore_local_backup(
    file: UploadFile = File(...), password: str = Form(...), session=Depends(get_db)
):
    try:
        file_bytes = await file.read()
        user = None
        result = await restore(file_bytes, password, user, session)
        return result
    except Exception as e:
        print("Restore local backup error:", traceback.format_exc())
        raise HTTPException(
            status_code=500, detail=f"Restore from local backup failed: {str(e)}"
        )


def scheduled_backup():
    try:
        # Use same logic as /api/backup endpoint
        engine = create_engine(POSTGRES_URL.replace("asyncpg", "psycopg2"))
        insp = sqlalchemy.inspect(engine)
        tables = insp.get_table_names()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_data = {}
        for table in tables:
            df = pd.read_sql_table(table, engine)
            backup_data[table] = df.to_dict(orient="records")
        # Use default password for scheduled backups
        password = os.getenv("BACKUP_ENCRYPTION_PASSWORD", "default_password")
        key = derive_fernet_key(password)
        fernet = Fernet(key)
        buf = io.BytesIO()
        with gzip.GzipFile(fileobj=buf, mode="w") as gz_file:
            gz_file.write(
                json.dumps(backup_data, default=str, indent=2).encode("utf-8")
            )
        buf.seek(0)
        encrypted = fernet.encrypt(buf.getvalue())
        print(f"[Backup Debug] Encrypted file length: {len(encrypted)} bytes")
        print(f"[Backup Debug] First 64 bytes: {encrypted[:64]}")
        backup_filename = f"backup_{timestamp}.json.enc"
        supabase.storage.from_(SUPABASE_BUCKET).upload(backup_filename, encrypted)
        print(f"Backup completed: {backup_filename} (Supabase Storage only)")
    except Exception as e:
        print(f"Scheduled backup failed: {str(e)}")


from apscheduler.schedulers.background import BackgroundScheduler

scheduler = BackgroundScheduler()
scheduler.start()


def reschedule_backup(frequency, day_of_week, day_of_month, time_of_day):
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
        scheduler.add_job(scheduled_backup, "cron", hour=hour, minute=minute)
    elif frequency == "weekly":
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


@router.post("/schedule")
async def update_schedule(settings: dict, session=Depends(get_db)):
    user_id = 1  # Replace with actual user/session logic
    time_of_day_raw = settings.get("time_of_day", "")

    def convert_time_to_24h(time_str):
        import re

        time_str = str(time_str).strip()
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
        match_24 = re.match(r"^(?:[01]\d|2[0-3]):[0-5]\d$", time_str)
        if match_24:
            hour, minute = map(int, time_str.split(":"))
            ampm = "AM" if hour < 12 else "PM"
            hour12 = hour if 1 <= hour <= 12 else (hour - 12 if hour > 12 else 12)
            return time_str, f"{hour12}:{minute:02d} {ampm}"
        return None, None

    time_of_day_24h, time_of_day_12h = convert_time_to_24h(time_of_day_raw)
    if not time_of_day_24h:
        raise HTTPException(
            status_code=422,
            detail="Invalid time_of_day. Use HH:MM (24-hour) or HH:MM AM/PM (12-hour) format.",
        )
    from sqlalchemy import (
        select,
        update,
        insert,
        Table,
        Column,
        Integer,
        String,
        MetaData,
    )

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
async def get_schedule(session=Depends(get_db)):
    user_id = 1  # Replace with actual user/session logic
    from sqlalchemy import select, MetaData, Table, Integer, String

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
    stmt = select(backup_schedule).where(backup_schedule.c.user_id == user_id)
    result = await session.execute(stmt)
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="No schedule found")
    time_of_day_24h = row["time_of_day"]

    def convert_time_to_24h(time_str):
        import re

        time_str = str(time_str).strip()
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
        match_24 = re.match(r"^(?:[01]\d|2[0-3]):[0-5]\d$", time_str)
        if match_24:
            hour, minute = map(int, time_str.split(":"))
            ampm = "AM" if hour < 12 else "PM"
            hour12 = hour if 1 <= hour <= 12 else (hour - 12 if hour > 12 else 12)
            return time_str, f"{hour12}:{minute:02d} {ampm}"
        return None, None

    _, time_of_day_12h = convert_time_to_24h(time_of_day_24h)
    out = dict(row)
    out["time_of_day_12h"] = time_of_day_12h
    return out



@router.get("/list-backups")
async def list_supabase_backups():
    print("[List Backups Debug] Endpoint hit. Attempting to list backups...")
    try:
        files = await run_in_threadpool(lambda: supabase.storage.from_(SUPABASE_BUCKET).list())
        print(f"[List Backups Debug] Supabase .list() returned: {files}")
        return {"files": [f["name"] for f in files]}
    except Exception as e:
        print(f"[List Backups Debug] Exception: {e}")
        raise HTTPException(status_code=500, detail="Failed to list backups")


# Restore logic: decrypt, decompress, and restore backup data
async def restore(upload_file, password, user, db):
    try:
        print(f"[Restore Debug] Using POSTGRES_URL: {POSTGRES_URL}")
        # Read encrypted backup file contents
        if hasattr(upload_file, "read"):
            if asyncio.iscoroutinefunction(upload_file.read):
                encrypted_data = await upload_file.read()
            else:
                encrypted_data = upload_file.read()
        else:
            encrypted_data = upload_file

        print(f"[Restore Debug] Encrypted file length: {len(encrypted_data)} bytes")
        print(f"[Restore Debug] First 64 bytes: {encrypted_data[:64]}")

        # Derive Fernet key
        key = derive_fernet_key(password)
        fernet = Fernet(key)
        # Decrypt
        try:
            decrypted = fernet.decrypt(encrypted_data)
            print(
                f"[Restore Debug] Decryption successful. Decrypted length: {len(decrypted)}"
            )
        except Exception:
            print(
                f"[Restore Debug] Fernet decryption failed. Encrypted data type: {type(encrypted_data)}"
            )
            print(f"[Restore Debug] Encrypted file length: {len(encrypted_data)} bytes")
            print(f"[Restore Debug] First 64 bytes: {encrypted_data[:64]}")
            raise HTTPException(status_code=400, detail="Decryption failed. Check your password and backup file.")

        # Decompress
        buf = io.BytesIO(decrypted)
        with gzip.GzipFile(fileobj=buf, mode="r") as gz_file:
            backup_json = gz_file.read().decode("utf-8")
        print(
            f"[Restore Debug] Decompression successful. JSON length: {len(backup_json)}"
        )
        backup_data = json.loads(backup_json)
        print(f"[Restore Debug] JSON loaded. Keys: {list(backup_data.keys())}")

        # Restore tables
        engine = create_engine(POSTGRES_URL.replace("asyncpg", "psycopg2"))
        with engine.connect() as conn:
            for table_name, records in backup_data.items():
                print(
                    f"[Restore Debug] Restoring table: {table_name}, Records: {len(records)}"
                )
                df = pd.DataFrame(records)
                # Skip all DB operations for empty DataFrames
                if df.empty and len(df.columns) == 0:
                    print(
                        f"[Restore Debug] Skipping restore for {table_name}: empty DataFrame with no columns."
                    )
                    continue
                # Only drop table if not suppliers (so replace works, but append does not lose schema)
                if table_name != "suppliers":
                    try:
                        conn.execute(text(f"DROP TABLE IF EXISTS {table_name} CASCADE"))
                    except Exception as drop_err:
                        print(
                            f"[Restore Debug] Error dropping table {table_name}: {drop_err}"
                        )
                print(
                    f"[Restore Debug] DataFrame for {table_name} (first 5 rows):\n{df.head()}"
                )
                print(
                    f"[Restore Debug] DataFrame columns for {table_name}: {list(df.columns)}"
                )
                if not df.empty:
                    try:
                        df.to_sql(table_name, conn, if_exists="replace", index=False)
                        conn.commit()
                        result = conn.execute(
                            text(f"SELECT COUNT(*) FROM {table_name}")
                        )
                        count = (
                            result.scalar()
                            if hasattr(result, "scalar")
                            else list(result)[0][0]
                        )
                        print(
                            f"[Restore Debug] {table_name} row count after restore: {count}"
                        )
                        result2 = conn.execute(
                            text(f"SELECT * FROM {table_name} LIMIT 5")
                        )
                        rows = result2.fetchall()
                        print(
                            f"[Restore Debug] First rows in {table_name} after restore: {rows}"
                        )
                    except Exception as to_sql_err:
                        print(
                            f"[Restore Debug] Error restoring table {table_name} with to_sql: {to_sql_err}"
                        )

        return {"message": "Restore completed successfully."}
    except Exception as e:
        print(f"[Restore Debug] Exception during restore: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Restore failed: {str(e)}")


@router.post("/restore")
async def restore_backup(
    file: UploadFile = File(...), password: str = Form(...), session=Depends(get_db)
):
    print("[Restore Debug] Starting restore function...")
    user = None
    try:
        file_bytes = await file.read()
        result = await restore(file_bytes, password, user, session)
        return result
    except Exception as e:
        print("Restore error:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Restore failed: {str(e)}")


# Load and schedule backup jobs on startup
async def load_and_schedule(session):
    from sqlalchemy import select, MetaData, Table, Integer, String

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
    stmt = select(backup_schedule)
    result = await session.execute(stmt)
    rows = result.mappings().all()
    for row in rows:
        frequency = row["frequency"]
        day_of_week = row.get("day_of_week")
        day_of_month = row.get("day_of_month")
        time_of_day = row.get("time_of_day")
        if frequency and time_of_day:
            reschedule_backup(frequency, day_of_week, day_of_month, time_of_day)


@router.get("/download-backup")
async def download_backup(filename: str):
    try:
        file_data = download_from_supabase_storage(filename)
        if not file_data:
            raise HTTPException(status_code=404, detail="Backup file not found")
        print(f"[Download Debug] Downloaded file length: {len(file_data)} bytes")
        print(f"[Download Debug] First 64 bytes: {file_data[:64]}")
        return StreamingResponse(
            io.BytesIO(file_data),
            media_type="application/octet-stream",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")


@router.delete("/delete-backup")
async def delete_backup(filename: str):
    try:
        response = supabase.storage.from_(SUPABASE_BUCKET).remove([filename])
        print(f"[Delete Debug] Supabase response: {response}")
        # Supabase returns a list; if empty, deletion succeeded
        if isinstance(response, list) and len(response) == 0:
            return {"message": f"Backup file '{filename}' deleted successfully."}
        # If response contains error info, return it
        if isinstance(response, list) and len(response) > 0:
            print(f"[Delete Debug] Error detail: {response}")
            raise HTTPException(status_code=404, detail=f"Supabase error: {response}")
        return {"message": f"Backup file '{filename}' deleted (unknown status)."}
    except Exception as e:
        import traceback

        print(f"[Delete Debug] Exception: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")
