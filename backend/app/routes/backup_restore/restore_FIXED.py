from fastapi.responses import StreamingResponse
import io
import gzip
import json
import base64
import traceback
from datetime import datetime
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

async def restore(encrypted_data, password, session, user, activity_type="restore backup", filename="uploaded file"):
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

        # Validate backup data before proceeding
        if not isinstance(backup_data, dict) or len(backup_data) == 0:
            raise HTTPException(status_code=400, detail="Invalid backup file: No table data found")

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
                                conn.execute(text(f"SELECT setval('{sequence_name}', {max_pk}, true);"))
                                print(f"[Restore] Updated sequence {sequence_name} to {max_pk}")
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
