import boto3
import os
import json
import pickle
import gzip
import concurrent.futures
import requests
from google_auth_oauthlib.flow import InstalledAppFlow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from fastapi import APIRouter, UploadFile, File, HTTPException, Request, Depends, Query
from fastapi.responses import JSONResponse, StreamingResponse
import io
import time
import asyncio
from sqlalchemy import text
from app.supabase import SessionLocal, get_db
from datetime import datetime, date
from app.routes.userActivity import UserActivityLog
from app.utils.rbac import require_role
from fastapi import Form
import zipfile
import pandas as pd
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
from cryptography.fernet import Fernet
import base64


def derive_fernet_key(
    password: str, salt: bytes = b"cardiacdelights-backup-salt"
) -> bytes:
    # Derive a Fernet key from the password using PBKDF2HMAC
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=390000,
        backend=default_backend(),
    )
    key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
    return key


router = APIRouter()

TABLES = [
    "backup_history",
    "ingredients",
    "inventory",
    "inventory_log",
    "inventory_settings",
    "inventory_surplus",
    "inventory_today",
    "menu",
    "menu_ingredients",
    "notification",
    "notification_settings",
    "order_items",
    "orders",
    "suppliers",
    "user_activity_log",
    "users",
]

# --- Google Drive Integration ---
SCOPES = ["https://www.googleapis.com/auth/drive.file"]


def authenticate_google_drive():
    creds = None
    if os.path.exists("token.pickle"):
        with open("token.pickle", "rb") as token:
            creds = pickle.load(token)
    if not creds or not creds.valid:
        from google.auth.transport.requests import Request

        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            # Use the new client secret file name if present
            client_secret_file = "client_secret_72672884523-pmoocudj7qgtq516o96i01sfki4o5mor.apps.googleusercontent.com.json"
            if not os.path.exists(client_secret_file):
                client_secret_file = "credentials.json"
            flow = InstalledAppFlow.from_client_secrets_file(client_secret_file, SCOPES)
            creds = flow.run_local_server(port=0)
        with open("token.pickle", "wb") as token:
            pickle.dump(creds, token)
    service = build("drive", "v3", credentials=creds)
    return service


def authenticate_google_drive_with_token(access_token):
    creds = Credentials(token=access_token)
    service = build("drive", "v3", credentials=creds)
    return service


def upload_to_drive(filename):
    service = authenticate_google_drive()
    file_metadata = {"name": filename}
    media = MediaFileUpload(filename, mimetype="application/json")
    file = (
        service.files()
        .create(body=file_metadata, media_body=media, fields="id")
        .execute()
    )
    return file.get("id")


# Paginated fetch for large tables
async def fetch_table_paginated(table, batch_size=1000):
    all_rows = []
    offset = 0
    while True:
        async with SessionLocal() as session:
            result = await session.execute(
                text(f"SELECT * FROM {table} LIMIT :limit OFFSET :offset"),
                {"limit": batch_size, "offset": offset},
            )
            rows = result.mappings().all()
            if not rows:
                break
            all_rows.extend([dict(row) for row in rows])
            offset += batch_size
    return table, all_rows


def compress_json_gzip(data):
    buf = io.BytesIO()
    with gzip.GzipFile(fileobj=buf, mode="w") as gz_file:
        gz_file.write(json.dumps(data, default=str, indent=2).encode("utf-8"))
    buf.seek(0)
    return buf


@router.get("/backup")
async def backup(
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
    db=Depends(get_db),
    password: str = Query(..., description="Password to encrypt backup (required)"),
):
    start_time = time.time()

    # Use paginated fetch for each table
    async def fetch_table(table):
        return await fetch_table_paginated(table, batch_size=1000)

    tasks = [fetch_table(table) for table in TABLES]
    results = await asyncio.gather(*tasks)
    backup_data = {table: rows for table, rows in results}

    # Compress in a thread pool (CPU-bound)
    with concurrent.futures.ThreadPoolExecutor() as executor:
        future = executor.submit(compress_json_gzip, backup_data)
        buf = future.result()

    # Always require password for encryption
    key = derive_fernet_key(password)
    fernet = Fernet(key)
    encrypted = fernet.encrypt(buf.getvalue())
    buf = io.BytesIO(encrypted)
    filename = "backup.json.enc"
    media_type = "application/octet-stream"

    elapsed = time.time() - start_time

    try:
        user_row = getattr(user, "user_row", user)
        new_activity = UserActivityLog(
            user_id=user_row.get("user_id"),
            action_type="local backup",
            description=f"Performed local backup.",
            activity_date=datetime.utcnow(),
            report_date=datetime.utcnow(),
            user_name=user_row.get("name"),
            role=user_row.get("user_role"),
        )
        db.add(new_activity)
        await db.flush()
        await db.commit()
        print("local Backup activity logged successfully.")
    except Exception as e:
        print("Failed to record local Backup activity:", e)

    print(
        f"[PROFILE] Backup completed in {elapsed:.2f} seconds. Size: {buf.getbuffer().nbytes/1024:.1f} KB (encrypted/gzip)"
    )

    return StreamingResponse(
        buf,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.post("/backup_drive")
async def backup_drive(
    request: Request,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
    db=Depends(get_db),
):
    body = await request.json()
    access_token = body.get("access_token")
    password = body.get("password")
    if not access_token:
        raise HTTPException(status_code=400, detail="Missing access token")
    if not password:
        raise HTTPException(
            status_code=400, detail="Password is required for backup encryption."
        )

    # Use paginated fetch for each table
    async def fetch_table(table):
        return await fetch_table_paginated(table, batch_size=1000)

    tasks = [fetch_table(table) for table in TABLES]
    results = await asyncio.gather(*tasks)
    backup_data = {table: rows for table, rows in results}

    # Compress in a thread pool (CPU-bound)
    with concurrent.futures.ThreadPoolExecutor() as executor:
        future = executor.submit(compress_json_gzip, backup_data)
        buf = future.result()

    # Always require password for encryption
    key = derive_fernet_key(password)
    fernet = Fernet(key)
    encrypted = fernet.encrypt(buf.getvalue())
    buf = io.BytesIO(encrypted)
    backup_file = "backup_data.json.enc"
    mimetype = "application/octet-stream"

    # Save to local file
    with open(backup_file, "wb") as f:
        f.write(buf.read())
    buf.seek(0)

    # Upload to Google Drive
    service = authenticate_google_drive_with_token(access_token)
    file_metadata = {"name": backup_file}
    media = MediaFileUpload(backup_file, mimetype=mimetype)
    file = (
        service.files()
        .create(body=file_metadata, media_body=media, fields="id")
        .execute()
    )
    file_id = file.get("id")

    # Explicitly delete the media object to release the file handle
    del media

    # Now remove the file
    os.remove(backup_file)

    try:
        user_row = getattr(user, "user_row", user)
        new_activity = UserActivityLog(
            user_id=user_row.get("user_id"),
            action_type="Google Drive backup",
            description=f"Performed Google Drive backup.",
            activity_date=datetime.utcnow(),
            report_date=datetime.utcnow(),
            user_name=user_row.get("name"),
            role=user_row.get("user_role"),
        )
        db.add(new_activity)
        await db.flush()
        await db.commit()
        print("Google Drive backup activity logged successfully.")
    except Exception as e:
        print("Failed to record Google Drive backup activity:", e)

    return JSONResponse({"message": "Backup successful!", "file_id": file_id})


@router.post("/backup_s3")
async def backup_s3(
    request: Request,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
    db=Depends(get_db),
):
    body = await request.json()
    password = body.get("password")
    filename = (
        body.get("filename")
        or f"backup_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json.enc"
    )
    if not password:
        raise HTTPException(
            status_code=400, detail="Password is required for backup encryption."
        )

    # Fetch data
    async def fetch_table(table):
        return await fetch_table_paginated(table, batch_size=1000)

    tasks = [fetch_table(table) for table in TABLES]
    results = await asyncio.gather(*tasks)
    backup_data = {table: rows for table, rows in results}

    # Compress and encrypt
    with concurrent.futures.ThreadPoolExecutor() as executor:
        future = executor.submit(compress_json_gzip, backup_data)
        buf = future.result()
    key = derive_fernet_key(password)
    fernet = Fernet(key)
    encrypted = fernet.encrypt(buf.getvalue())
    buf = io.BytesIO(encrypted)

    # Upload to S3
    bucket_name = os.getenv("AWS_S3_BUCKET_NAME")
    region = os.getenv("AWS_DEFAULT_REGION")
    aws_access_key_id = os.getenv("AWS_ACCESS_KEY_ID")
    aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY")
    if not bucket_name:
        raise HTTPException(
            status_code=500, detail="AWS_S3_BUCKET_NAME not set in environment."
        )
    s3 = boto3.client(
        "s3",
        aws_access_key_id=aws_access_key_id,
        aws_secret_access_key=aws_secret_access_key,
        region_name=region,
    )
    buf.seek(0)
    s3.upload_fileobj(buf, bucket_name, filename)

    # Log activity
    try:
        user_row = getattr(user, "user_row", user)
        new_activity = UserActivityLog(
            user_id=user_row.get("user_id"),
            action_type="S3 backup",
            description=f"Performed S3 backup.",
            activity_date=datetime.utcnow(),
            report_date=datetime.utcnow(),
            user_name=user_row.get("name"),
            role=user_row.get("user_role"),
        )
        db.add(new_activity)
        await db.flush()
        await db.commit()
        print("S3 backup activity logged successfully.")
    except Exception as e:
        print("Failed to record S3 backup activity:", e)

    return JSONResponse({"message": "Backup uploaded to S3!", "filename": filename})


@router.post("/restore")
async def restore(
    file: UploadFile = File(...),
    password: str = Form(..., description="Password to decrypt backup (required)"),
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
    db=Depends(get_db),
):
    # Always initialize response to a default error structure
    response = JSONResponse(
        {"status": "error", "message": "Unknown failure"}, status_code=500
    )
    try:
        print("[DEBUG] /restore called")
        print(
            f"[DEBUG] file: {getattr(file, 'filename', None)}; password: {password!r}"
        )
        filename = getattr(file, "filename", "") or ""
        contents = await file.read()
        # --- ZIP of CSVs restore ---
        import csv
        import io
        import zipfile

        if filename.endswith(".zip"):
            try:
                if not isinstance(contents, bytes):
                    raise Exception("ZIP file must be bytes")
                zf = zipfile.ZipFile(io.BytesIO(contents))
                data = {}
                for name in zf.namelist():
                    if name.endswith(".csv"):
                        table_name = name[:-4]
                        with zf.open(name) as f:
                            csv_bytes = f.read()
                            csv_str = csv_bytes.decode("utf-8")
                            reader = csv.DictReader(io.StringIO(csv_str))
                            data[table_name] = [row for row in reader]
                        print(
                            f"[INFO] Restoring from CSV in ZIP: {name}, {len(data[table_name])} rows"
                        )
                if not data:
                    raise Exception("No CSV files found in ZIP")
            except Exception as e:
                print(f"[ERROR] ZIP of CSVs restore failed: {e}")
                raise HTTPException(
                    status_code=400, detail=f"ZIP of CSVs restore failed: {str(e)}"
                )
        # --- CSV restore ---
        elif filename.endswith(".csv"):
            # Assume filename is <table>.csv
            table_name = filename[:-4]
            try:
                if isinstance(contents, bytes):
                    contents_str = contents.decode("utf-8")
                else:
                    contents_str = contents
                reader = csv.DictReader(io.StringIO(contents_str))
                data = {table_name: [row for row in reader]}
                print(
                    f"[INFO] Restoring from CSV for table: {table_name}, {len(data[table_name])} rows"
                )
            except Exception as e:
                print(f"[ERROR] CSV restore failed: {e}")
                raise HTTPException(
                    status_code=400, detail=f"CSV restore failed: {str(e)}"
                )
        # --- Encrypted JSON restore ---
        elif filename.endswith(".enc"):
            # Always require password for decryption
            key = derive_fernet_key(password)
            fernet = Fernet(key)
            # Always treat contents as bytes
            raw = contents if isinstance(contents, bytes) else bytes(contents)
            # Try direct Fernet decrypt first
            try:
                decrypted = fernet.decrypt(raw)
                data = json.loads(decrypted)
            except Exception as e1:
                print(f"[ERROR] Direct Fernet decrypt failed: {e1}")
                # If Fernet fails, try decompress then decrypt (gzipped+encrypted)
                try:
                    decompressed = gzip.decompress(raw)
                    decrypted = fernet.decrypt(decompressed)
                    data = json.loads(decrypted)
                except Exception as e2:
                    print(f"[ERROR] Gzip+Fernet decrypt failed: {e2}")
                    # Fallback: try plain gzip (not encrypted, just compressed)
                    try:
                        decompressed = gzip.decompress(raw)
                        data = json.loads(decompressed)
                        print(
                            "[WARN] Fallback: Restored as plain gzipped JSON, not encrypted!"
                        )
                    except Exception as e3:
                        print(f"[ERROR] Fallback plain gzip failed: {e3}")
                        # Final fallback: try plain JSON
                        try:
                            if isinstance(raw, bytes):
                                data = json.loads(raw.decode("utf-8"))
                            else:
                                data = json.loads(raw)
                            print(
                                "[WARN] Final fallback: Restored as plain JSON, not encrypted or compressed!"
                            )
                        except Exception as e4:
                            print(f"[ERROR] Final fallback plain JSON failed: {e4}")
                            raise HTTPException(
                                status_code=400,
                                detail=f"Decryption failed: {str(e1)} | Gzip+decrypt failed: {str(e2)} | Fallback plain gzip failed: {str(e3)} | Final fallback plain JSON failed: {str(e4)}",
                            )
        else:
            # Assume plain JSON (should be bytes)
            try:
                if isinstance(contents, bytes):
                    data = json.loads(contents.decode("utf-8"))
                else:
                    data = json.loads(contents)
            except Exception as e:
                print(f"[ERROR] Invalid JSON: {e}")
                raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")

        # --- Type map for casting CSV/ZIP values ---
        import importlib
        from sqlalchemy import Integer, Float, String, Date, DateTime, Text

        # Map table name to model class
        MODEL_MAP = {}
        model_modules = [
            "inventory",
            "inventory_surplus",
            "custom_holiday",
            "notification_settings",
            "userModal",
        ]
        for mod in model_modules:
            try:
                m = importlib.import_module(f"app.models.{mod}")
                for attr in dir(m):
                    obj = getattr(m, attr)
                    if hasattr(obj, "__tablename__"):
                        MODEL_MAP[obj.__tablename__] = obj
            except Exception as e:
                print(f"[WARN] Could not import model {mod}: {e}")

        def normalize_value(col, value):
            # Handle empty/null
            if value is None or (
                isinstance(value, str) and value.strip().upper() in ("", "NULL")
            ):
                return None
            col_lower = col.lower()
            # *_at → datetime
            if col_lower.endswith("_at") and isinstance(value, str):
                try:
                    return datetime.fromisoformat(value.replace("Z", "+00:00"))
                except Exception:
                    return None
            # *_date → date
            if col_lower.endswith("_date") and isinstance(value, str):
                try:
                    return datetime.fromisoformat(value.replace("Z", "+00:00")).date()
                except Exception:
                    return None
            # *_id, quantity, price, amount, stock → numeric
            if (
                col_lower == "id"
                or col_lower.endswith("_id")
                or any(
                    word in col_lower
                    for word in ["quantity", "price", "amount", "stock"]
                )
            ):
                # Try int first, then float
                try:
                    return int(value)
                except Exception:
                    try:
                        return float(value)
                    except Exception:
                        return value
            # Columns containing phone, reference, email, name, notes, address, supplies → always string
            if any(
                word in col_lower
                for word in [
                    "phone",
                    "reference",
                    "email",
                    "name",
                    "notes",
                    "address",
                    "supplies",
                ]
            ):
                return str(value)
            # Try to cast to int if it looks like an int
            if isinstance(value, str) and value.isdigit():
                try:
                    return int(value)
                except Exception:
                    pass
            # Try to cast to float if it looks like a float
            if isinstance(value, str):
                try:
                    if "." in value or "e" in value.lower():
                        return float(value)
                except Exception:
                    pass
            # Fallback: keep as is
            return value

        def cast_row(table, row):
            return {k: normalize_value(k, v) for k, v in row.items()}

        # Table deletion order (children first)
        delete_order = [
            "menu_ingredients",
            "order_items",
            "inventory_log",
            "user_activity_log",
            "backup_history",
            "notification_settings",
            "menu",
            "ingredients",
            "inventory",
            "orders",
            "suppliers",
            "inventory_settings",
            "inventory_surplus",
            "inventory_today",
            "notification",
            # "users",  # SKIP users table to preserve sessions and logins
        ]
        parent_tables = [
            "menu",
            "ingredients",
            "inventory",
            "orders",
            "suppliers",
            "inventory_settings",
            "inventory_surplus",
            "inventory_today",
            "notification",
            # "users",  # SKIP users table to preserve sessions and logins
        ]
        child_tables = [
            "menu_ingredients",
            "order_items",
            "inventory_log",
            "user_activity_log",
            "backup_history",
            "notification_settings",
        ]
        # Date columns for special parsing
        date_columns = {
            "orders": ["order_date"],
            "inventory_log": ["action_date", "batch_date"],
            "inventory_today": [
                "batch_date",
                "expiration_date",
                "created_at",
                "updated_at",
            ],
            "user_activity_log": ["activity_date", "report_date"],
        }

        async with SessionLocal() as session:
            from app.supabase import supabase

            # Delete all data in restore order
            for table in delete_order:
                try:
                    await session.execute(text(f"DELETE FROM {table}"))
                except Exception as e:
                    print(f"Restore error in table {table} (DELETE):", e)
                    response = JSONResponse(
                        {
                            "status": "error",
                            "message": f"Restore failed for table {table} (DELETE): {str(e)}",
                        },
                        status_code=500,
                    )
                    return response
            await session.commit()

            created_auth_users = []

            # Insert parent tables
            for table in parent_tables:
                if table in data and isinstance(data[table], list):
                    for row in data[table]:
                        try:
                            # Cast all values using model schema
                            row_casted = cast_row(table, row)
                            # Insert row
                            columns = ", ".join(row_casted.keys())
                            values = ", ".join([f":{k}" for k in row_casted.keys()])
                            await session.execute(
                                text(
                                    f"INSERT INTO {table} ({columns}) VALUES ({values})"
                                ),
                                row_casted,
                            )
                        except Exception as e:
                            print(f"Restore error in table {table} (INSERT):", e)
                            response = JSONResponse(
                                {
                                    "status": "error",
                                    "message": f"Restore failed for table {table} (INSERT): {str(e)}",
                                },
                                status_code=500,
                            )
                            return response

        # If we reach here, restore succeeded
        response = JSONResponse(
            {"status": "success", "message": "Restore completed successfully"},
            status_code=200,
        )

        # Decompress if gzipped
        try:
            with gzip.GzipFile(fileobj=io.BytesIO(contents)) as gz:
                contents = gz.read()
        except OSError:
            pass

        # Simulate UploadFile for restore, always use bytes
        class DummyUploadFile:
            def __init__(self, content, filename="restore_from_drive.enc"):
                self.content = content if isinstance(content, bytes) else bytes(content)
                self.filename = filename

            async def read(self):
                return self.content

        dummy_file = DummyUploadFile(contents)
        # Only call restore recursively if needed (for Drive/S3 endpoints), not here

        try:
            user_row = getattr(user, "user_row", user)
            new_activity = UserActivityLog(
                user_id=user_row.get("user_id"),
                action_type="restore Google Drive",
                description=f"Performed restore from Google Drive.",
                activity_date=datetime.utcnow(),
                report_date=datetime.utcnow(),
                user_name=user_row.get("name"),
                role=user_row.get("user_role"),
            )
            db.add(new_activity)
            await db.flush()
            await db.commit()
            print("restore Google Drive activity logged successfully.")
        except Exception as e:
            print("Failed to record restore Google Drive activity:", e)

        return response
    except HTTPException as he:
        return JSONResponse(
            {"status": "error", "message": str(he.detail)},
            status_code=he.status_code if hasattr(he, "status_code") else 500,
        )
    except Exception as e:
        print("Restore Drive error: Unexpected exception.", e)
        return JSONResponse(
            {"status": "error", "message": f"Restore Drive failed: {str(e)}"},
            status_code=500,
        )


# ...existing code...


@router.post("/restore_s3")
async def restore_s3(
    request: Request,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
    db=Depends(get_db),
):

    # Get S3 config from environment
    bucket_name = os.getenv("AWS_S3_BUCKET_NAME")
    region = os.getenv("AWS_DEFAULT_REGION")
    aws_access_key_id = os.getenv("AWS_ACCESS_KEY_ID")
    aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY")
    if not bucket_name:
        raise HTTPException(
            status_code=500, detail="AWS_S3_BUCKET_NAME not set in environment."
        )

    # Parse request body for filename and password
    body = await request.json()
    print(f"[DEBUG] /restore_s3 called with body: {body}")
    filename = body.get("filename") if isinstance(body, dict) else None
    password = body.get("password") if isinstance(body, dict) else None
    if not password:
        print("[DEBUG] /restore_s3 missing password!")
        raise HTTPException(
            status_code=400, detail="Password is required for restore from S3."
        )

    # Connect to S3
    s3 = boto3.client(
        "s3",
        aws_access_key_id=aws_access_key_id,
        aws_secret_access_key=aws_secret_access_key,
        region_name=region,
    )

    # If no filename provided, find the latest backup file
    if not filename:
        resp = s3.list_objects_v2(Bucket=bucket_name)
        files = [
            obj["Key"]
            for obj in resp.get("Contents", [])
            if obj["Key"].endswith(".gz") or obj["Key"].endswith(".json")
        ]
        if not files:
            raise HTTPException(
                status_code=404, detail="No backup files found in S3 bucket."
            )
        # Sort by name (or use LastModified for more accuracy)
        files = sorted(files, reverse=True)
        filename = files[0]

    # Download the file from S3
    buf = io.BytesIO()
    try:
        s3.download_fileobj(bucket_name, filename, buf)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to download {filename} from S3: {e}"
        )
    buf.seek(0)

    # Decompress if gzipped
    contents = buf.read()
    try:
        with gzip.GzipFile(fileobj=io.BytesIO(contents)) as gz:
            contents = gz.read()
    except OSError:
        # Not gzipped, use as-is
        pass

    class DummyUploadFile:
        def __init__(self, content, filename="restore_from_s3.enc"):
            self.content = content if isinstance(content, bytes) else bytes(content)
            self.filename = filename

        async def read(self):
            return self.content

    dummy_file = DummyUploadFile(contents, filename=filename or "restore_from_s3.enc")
    response = await restore(dummy_file, password=password, user=user, db=db)

    try:
        user_row = getattr(user, "user_row", user)
        new_activity = UserActivityLog(
            user_id=user_row.get("user_id"),
            action_type="restore S3",
            description=f"Performed restore from AWS S3 ({filename}).",
            activity_date=datetime.utcnow(),
            report_date=datetime.utcnow(),
            user_name=user_row.get("name"),
            role=user_row.get("user_role"),
        )
        db.add(new_activity)
        await db.flush()
        await db.commit()
        print("restore S3 activity logged successfully.")
    except Exception as e:
        print("Failed to record restore S3 activity:", e)

    return response


@router.get("/list-s3-backups")
async def list_s3_backups():
    """
    List all backup files in the S3 bucket for the frontend picker.
    """
    import os
    import boto3

    bucket_name = os.getenv("AWS_S3_BUCKET_NAME")
    region = os.getenv("AWS_DEFAULT_REGION")
    aws_access_key_id = os.getenv("AWS_ACCESS_KEY_ID")
    aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY")
    if not bucket_name:
        raise HTTPException(
            status_code=500, detail="AWS_S3_BUCKET_NAME not set in environment."
        )

    s3 = boto3.client(
        "s3",
        aws_access_key_id=aws_access_key_id,
        aws_secret_access_key=aws_secret_access_key,
        region_name=region,
    )

    try:
        resp = s3.list_objects_v2(Bucket=bucket_name)
        files = [
            obj["Key"]
            for obj in resp.get("Contents", [])
            if obj["Key"].endswith((".enc", ".zip", ".gz", ".json"))
        ]
        files = sorted(files, reverse=True)
        return files
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list S3 files: {e}")
