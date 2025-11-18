from fastapi.responses import StreamingResponse
import io
import gzip
import json
import base64
import traceback
import os
import pathlib
from datetime import datetime, timezone
import pandas as pd
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from sqlalchemy import text, create_engine
from app.supabase import get_db, POSTGRES_URL, SUPABASE_URL, SUPABASE_API_KEY
from app.utils.rbac import require_role
from app.models.user_activity_log import UserActivityLog
from supabase import create_client, Client
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
from cryptography.fernet import Fernet

SUPABASE_BUCKET = "cardiacdelights-backup"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_API_KEY)
router = APIRouter()

def derive_fernet_key(password: str, salt: bytes = b"cardiacdelights-backup-salt") -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=390000,
        backend=default_backend(),
    )
    return base64.urlsafe_b64encode(kdf.derive(password.encode()))

async def restore(encrypted_data, password, session, user, activity_type="restore backup", filename="uploaded file", selected_tables=None):
    try:
        key = derive_fernet_key(password)
        fernet = Fernet(key)
        try:
            decrypted = fernet.decrypt(encrypted_data)
        except Exception:
            raise HTTPException(status_code=400, detail="Decryption failed. Check your password and backup file.")
        buf = io.BytesIO(decrypted)
        with gzip.GzipFile(fileobj=buf, mode="r") as gz_file:
            backup_json = gz_file.read().decode("utf-8")
        backup_data = json.loads(backup_json)

        # Check if backup has new format with metadata
        backup_version = None
        schema_info = None
        actual_data = backup_data

        if isinstance(backup_data, dict):
            # New format with metadata
            if "version" in backup_data and "data" in backup_data:
                backup_version = backup_data.get("version")
                schema_info = backup_data.get("schema_info", {})
                actual_data = backup_data.get("data", {})
                print(f"[Restore] Detected backup version {backup_version}")
                print(f"[Restore] Backup created at: {backup_data.get('backup_date', 'unknown')}")
            # Old format - raw table data
            else:
                actual_data = backup_data
                print("[Restore] Using legacy backup format (no version metadata)")

        # Validate backup data before proceeding
        if not isinstance(actual_data, dict) or len(actual_data) == 0:
            raise HTTPException(status_code=400, detail="Invalid backup file: No table data found")

        # Schema validation if metadata exists
        if schema_info:
            engine_check = create_engine(POSTGRES_URL.replace("asyncpg", "psycopg2"))
            warnings = []
            for table_name, info in schema_info.items():
                try:
                    current_df = pd.read_sql_table(table_name, engine_check, limit=1)
                    backup_columns = set(info.get("columns", []))
                    current_columns = set(current_df.columns)

                    # Check for missing columns
                    missing_in_current = backup_columns - current_columns
                    extra_in_current = current_columns - backup_columns

                    if missing_in_current:
                        warnings.append(f"⚠️ Table '{table_name}': Backup has columns not in current DB: {missing_in_current}")
                    if extra_in_current:
                        warnings.append(f"⚠️ Table '{table_name}': Current DB has new columns: {extra_in_current}")
                except Exception as e:
                    warnings.append(f"⚠️ Could not validate schema for table '{table_name}': {str(e)}")

            if warnings:
                print("[Restore] Schema validation warnings:")
                for warning in warnings:
                    print(f"  {warning}")
                # Store warnings for response (don't fail, just warn)
            engine_check.dispose()

        # Use actual_data for restore
        backup_data = actual_data

        # Filter to selected tables only if specified
        if selected_tables:
            backup_data = {k: v for k, v in backup_data.items() if k in selected_tables}
            if not backup_data:
                raise HTTPException(status_code=400, detail="None of the selected tables found in backup file")

        # SAFETY FEATURE: Create automatic pre-restore backup
        print("[Restore] Creating automatic safety backup before restore...")
        try:
            from sqlalchemy import inspect

            BACKUP_DIR = str(pathlib.Path.home() / "Documents" / "cardiacdelights_backups")
            safety_engine = create_engine(POSTGRES_URL.replace("asyncpg", "psycopg2"))
            insp = inspect(safety_engine)
            tables = insp.get_table_names()

            safety_backup_data = {}
            safety_schema_info = {}

            for table in tables:
                try:
                    df = pd.read_sql_table(table, safety_engine)
                    safety_backup_data[table] = df.to_dict(orient="records")
                    safety_schema_info[table] = {
                        "columns": list(df.columns),
                        "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
                        "row_count": len(df)
                    }
                except Exception as e:
                    print(f"[Safety Backup] Warning: Could not backup table {table}: {e}")

            safety_payload = {
                "version": "1.0",
                "timestamp": datetime.now().strftime("%Y%m%d_%H%M%S"),
                "backup_date": datetime.now(timezone.utc).isoformat(),
                "backup_type": "pre_restore_safety",
                "schema_info": safety_schema_info,
                "data": safety_backup_data
            }

            # Encrypt and save safety backup
            safety_password = os.getenv("BACKUP_ENCRYPTION_PASSWORD", "default_password")
            safety_key = derive_fernet_key(safety_password)
            safety_fernet = Fernet(safety_key)
            safety_buf = io.BytesIO()
            with gzip.GzipFile(fileobj=safety_buf, mode="w") as gz_file:
                gz_file.write(json.dumps(safety_payload, default=str, indent=2).encode("utf-8"))
            safety_buf.seek(0)
            safety_encrypted = safety_fernet.encrypt(safety_buf.getvalue())

            # Save to local directory
            safety_filename = f"pre_restore_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json.enc"
            os.makedirs(BACKUP_DIR, exist_ok=True)
            safety_path = os.path.join(BACKUP_DIR, safety_filename)
            with open(safety_path, "wb") as f:
                f.write(safety_encrypted)

            print(f"[Restore] Safety backup created: {safety_filename}")
            print(f"[Restore] Safety backup location: {safety_path}")
            safety_engine.dispose()

        except Exception as safety_error:
            print(f"[Restore] Warning: Could not create safety backup: {safety_error}")
            print("[Restore] Continuing with restore (safety backup failed)")
            # Don't fail the restore if safety backup fails, just warn

        engine = create_engine(POSTGRES_URL.replace("asyncpg", "psycopg2"))

        # Primary key mapping - KEEP THIS ACCURATE!
        pk_map = {
            "suppliers": "supplier_id",
            "users": "user_id",
            "user_activity_log": "activity_id",
            "orders": "order_id",
            "order_items": "item_id",
            "top_sales": "id",
            "roles": "role_id",
            "custom_holidays": "id",
            "ph_holidays": "id",
            "notification": "notification_id",
            "notification_settings": "user_id",
            "menu": "menu_id",
            "menu_ingredients": "id",
            "ingredients": "id",
            "inventory": "item_id",
            "inventory_today": "item_id",
            "inventory_surplus": "item_id",
            "inventory_spoilage": "spoilage_id",
            "inventory_settings": "id",
            "inventory_log": "id",
            "backup_history": "id",
            "backup_schedule": "id",
            "sales": "sale_id",
        }

        # Use transaction for safer restore - if anything fails, rollback everything
        with engine.begin() as conn:
            # Disable foreign key checks temporarily
            try:
                conn.execute(text("SET session_replication_role = 'replica';"))
                print("[Restore] Disabled foreign key checks")
            except Exception as e:
                print(f"[Restore] Warning: Could not disable foreign key checks: {e}")

            for table_name, records in backup_data.items():
                print(f"\n[Restore] Processing table: {table_name}")
                df = pd.DataFrame(records)

                if df.empty:
                    print(f"[Restore] Skipping empty table: {table_name}")
                    continue

                try:
                    # DELETE existing data instead of TRUNCATE to preserve sequences
                    # This maintains auto-increment counters
                    conn.execute(text(f"DELETE FROM {table_name};"))
                    print(f"[Restore] Cleared existing data from: {table_name}")
                except Exception as e:
                    print(f"[Restore] Warning: Could not clear table {table_name}: {e}")

                pk_col = pk_map.get(table_name)

                # CRITICAL FIX: INSERT DATA WITH PRIMARY KEYS INTACT
                if not df.empty:
                    try:
                        # Clean up NaT/NaN values in date/datetime columns
                        # Replace pandas NaT and string 'NaT' with None (SQL NULL)
                        for col in df.columns:
                            if df[col].dtype == 'object':  # String columns might have 'NaT' as string
                                df[col] = df[col].replace(['NaT', 'nan', 'NaN'], None)
                            # Replace pandas NaT/NaN with None for datetime columns
                            if pd.api.types.is_datetime64_any_dtype(df[col]):
                                df[col] = df[col].where(pd.notna(df[col]), None)

                        # Temporarily disable triggers to allow primary key insertion
                        if pk_col and pk_col in df.columns:
                            # Get the max PK value from backup data
                            max_pk = df[pk_col].max()

                            # Insert ALL columns including primary key
                            df.to_sql(table_name, conn, if_exists="append", index=False, method='multi')
                            print(f"[Restore] Restored {len(df)} records to {table_name} (with primary keys)")

                            # Update sequence to max+1 to prevent future conflicts
                            sequence_name = f"{table_name}_{pk_col}_seq"
                            try:
                                # First check if sequence exists to avoid transaction errors
                                result = conn.execute(text(
                                    f"SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = '{sequence_name}'"
                                ))
                                sequence_exists = result.fetchone() is not None

                                if sequence_exists:
                                    conn.execute(text(f"SELECT setval('{sequence_name}', {max_pk}, true);"))
                                    print(f"[Restore] Updated sequence {sequence_name} to {max_pk}")
                                else:
                                    print(f"[Restore] Info: Sequence {sequence_name} does not exist (table may not use auto-increment)")
                            except Exception as seq_err:
                                print(f"[Restore] Warning: Could not update sequence {sequence_name}: {seq_err}")
                        else:
                            # No primary key defined, insert all data as-is
                            df.to_sql(table_name, conn, if_exists="append", index=False, method='multi')
                            print(f"[Restore] Restored {len(df)} records to {table_name}")

                    except Exception as e:
                        print(f"[Restore] ERROR restoring table {table_name}: {e}")
                        print(f"[Restore] Traceback: {traceback.format_exc()}")
                        raise HTTPException(
                            status_code=500,
                            detail=f"Failed to restore table {table_name}: {str(e)}"
                        )

            # Re-enable foreign key checks
            try:
                conn.execute(text("SET session_replication_role = 'origin';"))
                print("[Restore] Re-enabled foreign key checks")
            except Exception as e:
                print(f"[Restore] Warning: Could not re-enable foreign key checks: {e}")

        # Log activity
        user_row = getattr(user, "user_row", user) if user else None
        new_activity = UserActivityLog(
            user_id=user_row.get("user_id") if user_row else None,
            action_type=activity_type,
            description=f"Restored backup file: {filename}",
            activity_date=datetime.utcnow(),
            report_date=datetime.utcnow(),
            user_name=user_row.get("name") if user_row else None,
            role=user_row.get("user_role") if user_row else None,
        )
        session.add(new_activity)
        await session.flush()
        await session.commit()

        return {"message": "Restore completed successfully."}

    except Exception as e:
        print(f"[Restore Debug] Exception during restore: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Restore failed: {str(e)}")

@router.post("/preview-backup")
async def preview_backup_contents(
    file: UploadFile = File(...),
    password: str = Form(...),
    user=Depends(require_role("Owner"))
):
    """Preview what tables and data are in a backup file without restoring"""
    try:
        file_bytes = await file.read()
        key = derive_fernet_key(password)
        fernet = Fernet(key)
        try:
            decrypted = fernet.decrypt(file_bytes)
        except Exception:
            raise HTTPException(status_code=400, detail="Decryption failed. Check your password and backup file.")

        buf = io.BytesIO(decrypted)
        with gzip.GzipFile(fileobj=buf, mode="r") as gz_file:
            backup_json = gz_file.read().decode("utf-8")
        backup_data = json.loads(backup_json)

        # Check backup format
        backup_version = None
        backup_date = None
        actual_data = backup_data

        if isinstance(backup_data, dict) and "version" in backup_data and "data" in backup_data:
            backup_version = backup_data.get("version")
            backup_date = backup_data.get("backup_date")
            actual_data = backup_data.get("data", {})

        # Return table names and record counts
        table_info = {}
        for table_name, records in actual_data.items():
            table_info[table_name] = {
                "record_count": len(records),
                "has_data": len(records) > 0
            }

        response = {
            "tables": table_info,
            "total_tables": len(actual_data),
            "filename": getattr(file, "filename", "uploaded file")
        }

        # Add version info if available
        if backup_version:
            response["version"] = backup_version
            response["backup_date"] = backup_date
            response["has_schema_info"] = True
        else:
            response["version"] = "legacy"
            response["has_schema_info"] = False

        return response
    except Exception as e:
        print("Preview backup error:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to preview backup: {str(e)}")

@router.post("/restore-selective")
async def restore_selective_tables(
    file: UploadFile = File(...),
    password: str = Form(...),
    tables: str = Form(...),  # Comma-separated table names
    session=Depends(get_db),
    user=Depends(require_role("Owner"))
):
    """Restore only selected tables from a backup file"""
    try:
        file_bytes = await file.read()
        selected_tables = [t.strip() for t in tables.split(",") if t.strip()]

        if not selected_tables:
            raise HTTPException(status_code=400, detail="No tables selected for restore")

        return await restore(
            file_bytes,
            password,
            session,
            user,
            activity_type="selective restore",
            filename=getattr(file, "filename", "uploaded file"),
            selected_tables=selected_tables
        )
    except Exception as e:
        print("Selective restore error:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Selective restore failed: {str(e)}")

@router.post("/restore-local")
async def restore_local_backup(
    file: UploadFile = File(...),
    password: str = Form(...),
    session=Depends(get_db),
    user=Depends(require_role("Owner"))
):
    try:
        file_bytes = await file.read()
        return await restore(
            file_bytes,
            password,
            session,
            user,
            activity_type="restore local backup",
            filename=getattr(file, "filename", "uploaded file")
        )
    except Exception as e:
        print("Restore local backup error:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Restore from local backup failed: {str(e)}")

@router.post("/restore")
async def restore_backup(
    file: UploadFile = File(...),
    password: str = Form(...),
    session=Depends(get_db),
    user=Depends(require_role("Owner"))
):
    try:
        file_bytes = await file.read()
        return await restore(
            file_bytes,
            password,
            session,
            user,
            activity_type="restore backup",
            filename=getattr(file, "filename", "uploaded file")
        )
    except Exception as e:
        print("Restore error:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Restore failed: {str(e)}")

@router.get("/download-backup")
async def download_backup(
    filename: str,
    session=Depends(get_db),
    user=Depends(require_role("Owner"))
):
    try:
        response = supabase.storage.from_(SUPABASE_BUCKET).download(filename)
        if hasattr(response, "data") and response.data:
            file_data = response.data
        else:
            file_data = response
        if not file_data:
            raise HTTPException(status_code=404, detail="Backup file not found in Supabase storage.")

        user_row = getattr(user, "user_row", user) if user else None
        new_activity = UserActivityLog(
            user_id=user_row.get("user_id") if user_row else None,
            action_type="download backup",
            description=f"Downloaded backup file: {filename}",
            activity_date=datetime.utcnow(),
            report_date=datetime.utcnow(),
            user_name=user_row.get("name") if user_row else None,
            role=user_row.get("user_role") if user_row else None,
        )

        session.add(new_activity)
        await session.flush()
        await session.commit()

        return StreamingResponse(
            io.BytesIO(file_data),
            media_type="application/octet-stream",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            },
        )
    except Exception as e:
        print(f"[Download Backup Debug] Exception: {e}")
        raise HTTPException(status_code=404, detail=f"Backup file '{filename}' not found or could not be downloaded.")

@router.delete("/delete-backup")
async def delete_backup(
    filename: str,
    session=Depends(get_db),
    user=Depends(require_role("Owner"))
):
    try:
        response = supabase.storage.from_(SUPABASE_BUCKET).remove([filename])
        if isinstance(response, list) and len(response) == 0:
            user_row = getattr(user, "user_row", user)
            new_activity = UserActivityLog(
                user_id=user_row.get("user_id"),
                action_type="delete backup",
                description=f"Deleted backup file: {filename}",
                activity_date=datetime.utcnow(),
                report_date=datetime.utcnow(),
                user_name=user_row.get("name"),
                role=user_row.get("user_role"),
            )
            session.add(new_activity)
            await session.flush()
            await session.commit()
            return {"message": f"Backup file '{filename}' deleted successfully."}
        if isinstance(response, list) and len(response) > 0:
            raise HTTPException(status_code=404, detail=f"Supabase error: {response}")
        return {"message": f"Backup file '{filename}' deleted (unknown status)."}
    except Exception as e:
        print(f"[Delete Debug] Exception: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")
