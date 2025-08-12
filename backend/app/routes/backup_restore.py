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
from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse
import io
import time
import asyncio
from sqlalchemy import text
from app.supabase import SessionLocal
from datetime import datetime, date


router = APIRouter()

TABLES = [
    "backup_history", "food_trend_ingredients", "food_trend_menu", "food_trends",
    "ingredients", "inventory", "inventory_log", "inventory_settings",
    "inventory_surplus", "inventory_today", "menu", "menu_ingredients",
    "notification", "notification_settings", "order_items", "orders",
    "past_inventory_log", "past_order_items", "past_user_activity_log",
    "suppliers", "user_activity_log", "users"
]

# --- Google Drive Integration ---
SCOPES = ['https://www.googleapis.com/auth/drive.file']

def authenticate_google_drive():
    creds = None
    if os.path.exists('token.pickle'):
        with open('token.pickle', 'rb') as token:
            creds = pickle.load(token)
    if not creds or not creds.valid:
        from google.auth.transport.requests import Request
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            # Use the new client secret file name if present
            client_secret_file = 'client_secret_72672884523-pmoocudj7qgtq516o96i01sfki4o5mor.apps.googleusercontent.com.json'
            if not os.path.exists(client_secret_file):
                client_secret_file = 'credentials.json'
            flow = InstalledAppFlow.from_client_secrets_file(
                client_secret_file, SCOPES)
            creds = flow.run_local_server(port=0)
        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)
    service = build('drive', 'v3', credentials=creds)
    return service

def authenticate_google_drive_with_token(access_token):
    creds = Credentials(token=access_token)
    service = build('drive', 'v3', credentials=creds)
    return service

def upload_to_drive(filename):
    service = authenticate_google_drive()
    file_metadata = {'name': filename}
    media = MediaFileUpload(filename, mimetype='application/json')
    file = service.files().create(body=file_metadata, media_body=media, fields='id').execute()
    return file.get('id')

# Paginated fetch for large tables
async def fetch_table_paginated(table, batch_size=1000):
    all_rows = []
    offset = 0
    while True:
        async with SessionLocal() as session:
            result = await session.execute(
                text(f"SELECT * FROM {table} LIMIT :limit OFFSET :offset"),
                {"limit": batch_size, "offset": offset}
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
async def backup():
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

    elapsed = time.time() - start_time
    print(f"[PROFILE] Backup completed in {elapsed:.2f} seconds. Size: {buf.getbuffer().nbytes/1024:.1f} KB (gzip)")

    return StreamingResponse(
        buf,
        media_type="application/gzip",
        headers={
            "Content-Disposition": "attachment; filename=backup.json.gz"
        },
    )

@router.post("/backup_drive")
async def backup_drive(request: Request):
    body = await request.json()
    access_token = body.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="Missing access token")

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

    # Save to local compressed file (.json.gz)
    backup_file = 'backup_data.json.gz'
    with open(backup_file, 'wb') as f:
        f.write(buf.read())
    buf.seek(0)

    # Upload to Google Drive (set mimetype to gzip)
    service = authenticate_google_drive_with_token(access_token)
    file_metadata = {'name': backup_file}
    media = MediaFileUpload(backup_file, mimetype='application/gzip')
    file = service.files().create(body=file_metadata, media_body=media, fields='id').execute()
    file_id = file.get('id')

    # Explicitly delete the media object to release the file handle
    del media

    # Now remove the file
    os.remove(backup_file)

    return JSONResponse({'message': 'Backup successful!', 'file_id': file_id})

@router.post("/restore")
async def restore(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        try:
            data = json.loads(contents)
        except Exception as e:
            print("Restore error: Invalid JSON file.", e)
            raise HTTPException(status_code=400, detail="Invalid JSON file.")

        # Validate backup structure
        if not isinstance(data, dict):
            print("Restore error: Backup data is not a dict.")
            raise HTTPException(status_code=400, detail="Backup file format invalid.")

        # Map of table to columns that are dates or datetimes (add more as needed)
        date_columns = {
            "inventory": ["batch_date", "expiration_date", "created_at", "updated_at"],
            "inventory_surplus": ["batch_date", "expiration_date", "created_at", "updated_at"],
            "inventory_log": ["created_at", "updated_at"],
            "inventory_today": ["created_at", "updated_at"],
            "past_inventory_log": ["created_at", "updated_at"],
            "orders": ["created_at", "updated_at"],
            "order_items": ["created_at", "updated_at"],
            "past_order_items": ["created_at", "updated_at"],
            "user_activity_log": ["created_at", "updated_at"],
            "past_user_activity_log": ["created_at", "updated_at"],
            "notification": ["created_at", "updated_at"],
            "notification_settings": ["created_at", "updated_at"],
            "menu": ["created_at", "updated_at"],
            "menu_ingredients": ["created_at"],
            "ingredients": ["created_at", "updated_at"],
            "suppliers": ["created_at", "updated_at"],
            "backup_history": ["created_at"],
            "inventory_settings": ["created_at", "updated_at"],
            "users": ["created_at", "updated_at"],
            # Add more as needed
        }

        def parse_date(val):
            # If already a datetime/date or None, return as is
            if val is None or isinstance(val, (datetime, date)):
                return val
            if isinstance(val, str):
                # Try datetime formats first
                dt_formats = [
                    "%Y-%m-%dT%H:%M:%S.%fZ",
                    "%Y-%m-%dT%H:%M:%S.%f",
                    "%Y-%m-%dT%H:%M:%S",
                    "%Y-%m-%d %H:%M:%S.%f%z",
                    "%Y-%m-%d %H:%M:%S.%f",
                    "%Y-%m-%d %H:%M:%S",
                ]
                for fmt in dt_formats:
                    try:
                        return datetime.strptime(val, fmt)
                    except Exception:
                        continue
                # Try date-only format
                try:
                    return datetime.strptime(val, "%Y-%m-%d").date()
                except Exception:
                    pass
            return val

        # Define child tables first, then parent tables
        delete_order = [
            # Child tables first (no other table references these)
            "food_trend_ingredients",  # references food_trends, ingredients
            "food_trend_menu",         # references food_trends, menu
            "menu_ingredients",        # references menu, ingredients
            "order_items",             # references orders, menu
            "inventory_log",           # references inventory, users
            "user_activity_log",       # references users
            "backup_history",          # references users
            "notification_settings",   # references users
            "past_inventory_log",      # references inventory, users
            "past_order_items",        # references orders, menu
            "past_user_activity_log",  # references users
            # Parent tables (delete after all referencing child tables)
            "food_trends",
            "menu",
            "ingredients",
            "inventory",
            "orders",
            "suppliers",
            "inventory_settings",
            "inventory_surplus",
            "inventory_today",
            "notification",
            "users"
        ]
        async with SessionLocal() as session:
            # First, delete all tables in order
            from app.supabase import supabase
            for table in delete_order:
                try:
                    if table == "users":
                        # Delete users from Supabase Auth before deleting from users table
                        result = await session.execute(text("SELECT auth_id FROM users WHERE auth_id IS NOT NULL"))
                        auth_ids = [row[0] for row in result.fetchall() if row[0]]
                        for auth_id in auth_ids:
                            try:
                                supabase.auth.admin.delete_user(auth_id)
                                print(f"Deleted user from Supabase Auth: {auth_id}")
                            except Exception as auth_err:
                                print(f"Error deleting from Supabase Auth: {auth_err}")
                        await session.execute(text(f"DELETE FROM {table}"))
                    elif table == "menu_ingredients":
                        result = await session.execute(text("SELECT COUNT(*) FROM menu_ingredients"))
                        before_count = result.scalar()
                        print(f"[DEBUG] menu_ingredients rows before delete: {before_count}")
                        await session.execute(text(f"DELETE FROM {table}"))
                        result = await session.execute(text("SELECT COUNT(*) FROM menu_ingredients"))
                        after_count = result.scalar()
                        print(f"[DEBUG] menu_ingredients rows after delete: {after_count}")
                    else:
                        await session.execute(text(f"DELETE FROM {table}"))
                except Exception as e:
                    print(f"Restore error in table {table} (DELETE):", e)
                    raise HTTPException(status_code=500, detail=f"Restore failed for table {table} (DELETE): {str(e)}")
            # Commit deletes before inserts
            await session.commit()
            # Insert parent tables first, then child tables
            parent_tables = [
                "food_trends",
                "menu",
                "ingredients",
                "inventory",
                "orders",
                "suppliers",
                "inventory_settings",
                "inventory_surplus",
                "inventory_today",
                "notification",
                "users"
            ]
            child_tables = [
                "food_trend_ingredients",
                "food_trend_menu",
                "menu_ingredients",
                "order_items",
                "inventory_log",
                "user_activity_log",
                "backup_history",
                "notification_settings",
                "past_inventory_log",
                "past_order_items",
                "past_user_activity_log"
            ]
            # Insert parent tables
            created_auth_users = []
            for table in parent_tables:
                if table in data and isinstance(data[table], list):
                    try:
                        for row in data[table]:
                            # ...existing code for date/datetime conversion and insert...
                            if table == "inventory_log":
                                from datetime import datetime
                                for col in ["action_date", "batch_date"]:
                                    if col in row and isinstance(row[col], str):
                                        value = row[col]
                                        try:
                                            if value.endswith('Z'):
                                                value = value.replace('Z', '+00:00')
                                            row[col] = datetime.fromisoformat(value)
                                        except Exception:
                                            try:
                                                row[col] = datetime.strptime(value, "%Y-%m-%d %H:%M:%S")
                                            except Exception:
                                                row[col] = None
                            elif table == "inventory_today":
                                from datetime import date
                                for col in ["batch_date", "expiration_date"]:
                                    if col in row and isinstance(row[col], str):
                                        try:
                                            row[col] = date.fromisoformat(row[col])
                                        except Exception:
                                            row[col] = None
                                for col in ["created_at", "updated_at"]:
                                    if col in row and isinstance(row[col], str):
                                        from datetime import datetime
                                        value = row[col]
                                        try:
                                            if value.endswith('Z'):
                                                value = value.replace('Z', '+00:00')
                                            row[col] = datetime.fromisoformat(value)
                                        except Exception:
                                            row[col] = None
                            elif table in date_columns:
                                for col in date_columns[table]:
                                    if col in row and isinstance(row[col], str):
                                        try:
                                            from datetime import datetime, date
                                            value = row[col]
                                            if value.endswith('+00:00') or value.endswith('Z'):
                                                value = value.replace('Z', '+00:00')
                                            try:
                                                row[col] = datetime.fromisoformat(value)
                                            except Exception:
                                                row[col] = date.fromisoformat(value.split(' ')[0])
                                        except Exception:
                                            row[col] = parse_date(row[col])
                            columns = ','.join(row.keys())
                            values = ','.join([f":{k}" for k in row.keys()])
                            if table == "users" and "user_id" in row:
                                # Always set a default password for Supabase Auth
                                default_password = "changeme123"
                                # Use OVERRIDING SYSTEM VALUE for identity column
                                await session.execute(
                                    text(f"INSERT INTO {table} ({columns}) OVERRIDING SYSTEM VALUE VALUES ({values})"),
                                    row
                                )
                                from app.supabase import supabase
                                email = row.get("email")
                                if email:
                                    try:
                                        # Create user in Supabase Auth with default password
                                        result = supabase.auth.admin.create_user({"email": email, "password": default_password, "email_confirm": True})
                                        new_auth_id = result.user.id if hasattr(result, "user") and hasattr(result.user, "id") else None
                                        if new_auth_id:
                                            # Update the database user record with the new auth_id
                                            await session.execute(
                                                text("UPDATE users SET auth_id = :auth_id WHERE email = :email"),
                                                {"auth_id": new_auth_id, "email": email}
                                            )
                                        created_auth_users.append(email)
                                    except Exception as auth_err:
                                        print(f"Restore: Error creating Supabase Auth user for {email}: {auth_err}")
                            else:
                                await session.execute(
                                    text(f"INSERT INTO {table} ({columns}) VALUES ({values})"),
                                    row
                                )
                    except Exception as e:
                        print(f"Restore error in table {table} (INSERT):", e)
                        raise HTTPException(status_code=500, detail=f"Restore failed for table {table} (INSERT): {str(e)}")
            # Insert child tables
            for table in child_tables:
                if table in data and isinstance(data[table], list):
                    try:
                        for row in data[table]:
                            # ...existing code for date/datetime conversion and insert...
                            if table == "inventory_log":
                                from datetime import datetime
                                for col in ["action_date", "batch_date"]:
                                    if col in row and isinstance(row[col], str):
                                        value = row[col]
                                        try:
                                            if value.endswith('Z'):
                                                value = value.replace('Z', '+00:00')
                                            row[col] = datetime.fromisoformat(value)
                                        except Exception:
                                            try:
                                                row[col] = datetime.strptime(value, "%Y-%m-%d %H:%M:%S")
                                            except Exception:
                                                row[col] = None
                            elif table == "inventory_today":
                                from datetime import date
                                for col in ["batch_date", "expiration_date"]:
                                    if col in row and isinstance(row[col], str):
                                        try:
                                            row[col] = date.fromisoformat(row[col])
                                        except Exception:
                                            row[col] = None
                                for col in ["created_at", "updated_at"]:
                                    if col in row and isinstance(row[col], str):
                                        from datetime import datetime
                                        value = row[col]
                                        try:
                                            if value.endswith('Z'):
                                                value = value.replace('Z', '+00:00')
                                            row[col] = datetime.fromisoformat(value)
                                        except Exception:
                                            row[col] = None
                            elif table in date_columns:
                                for col in date_columns[table]:
                                    if col in row and isinstance(row[col], str):
                                        try:
                                            from datetime import datetime, date
                                            value = row[col]
                                            if value.endswith('+00:00') or value.endswith('Z'):
                                                value = value.replace('Z', '+00:00')
                                            try:
                                                row[col] = datetime.fromisoformat(value)
                                            except Exception:
                                                row[col] = date.fromisoformat(value.split(' ')[0])
                                        except Exception:
                                            row[col] = parse_date(row[col])
                            columns = ','.join(row.keys())
                            values = ','.join([f":{k}" for k in row.keys()])
                            await session.execute(
                                text(f"INSERT INTO {table} ({columns}) VALUES ({values})"),
                                row
                            )
                    except Exception as e:
                        print(f"Restore error in table {table} (INSERT):", e)
                        raise HTTPException(status_code=500, detail=f"Restore failed for table {table} (INSERT): {str(e)}")
            await session.commit()
        return JSONResponse({"status": "success", "message": "Restore completed."})
    except HTTPException as he:
        raise he
    except Exception as e:
        print("Restore error: Unexpected exception.", e)
        raise HTTPException(status_code=500, detail=f"Restore failed: {str(e)}")

@router.post("/restore_drive")
async def restore_drive(request: Request):
    try:
        body = await request.json()
        access_token = body.get("access_token")
        file_id = body.get("file_id")
        if not access_token or not file_id:
            raise HTTPException(status_code=400, detail="Missing access token or file_id")

        # Debug: log access token and request details
        print(f"[restore_drive] Using access token: {access_token}")
        url = f"https://www.googleapis.com/drive/v3/files/{file_id}?alt=media"
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(url, headers=headers)
        print(f"[restore_drive] Google Drive response status: {response.status_code}")
        print(f"[restore_drive] Google Drive response body: {response.text}")
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Failed to download file from Google Drive: {response.text}")

        contents = response.content

        # Decompress if gzipped
        try:
            # Try to decompress as gzip
            with gzip.GzipFile(fileobj=io.BytesIO(contents)) as gz:
                contents = gz.read()
        except OSError:
            # Not gzipped, use as-is
            pass

        # Simulate UploadFile for restore
        class DummyUploadFile:
            def __init__(self, content):
                self.content = content
            async def read(self):
                return self.content
        dummy_file = DummyUploadFile(contents)
        # Call the restore logic
        return await restore(dummy_file)
    except HTTPException as he:
        raise he
    except Exception as e:
        print("Restore Drive error: Unexpected exception.", e)
        raise HTTPException(status_code=500, detail=f"Restore Drive failed: {str(e)}")
