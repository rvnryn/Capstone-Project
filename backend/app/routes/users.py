from fastapi import APIRouter, HTTPException, Depends, Request
import os
from slowapi.util import get_remote_address
from slowapi import Limiter

limiter = Limiter(key_func=get_remote_address, default_limits=["10/minute"])
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.supabase import supabase, postgrest_client, get_db
from app.routes.userActivity import UserActivityLog
from app.utils.rbac import require_role

router = APIRouter()


class User(BaseModel):
    user_id: int
    auth_id: Optional[str]
    name: str
    username: str
    email: str
    user_role: str
    status: Optional[str] = "active"
    last_login: Optional[str] = None  # Changed to string to handle 'NaT' values
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class UserCreate(BaseModel):
    name: str
    username: str
    email: str
    user_role: str
    status: Optional[str] = "active"


class UserUpdate(BaseModel):
    name: str
    username: str
    email: str
    user_role: str
    status: str
    password: str | None = None


@limiter.limit("10/minute")
@router.get("/users", response_model=List[User])
def get_users(request: Request):
    try:
        print("🔍 Starting get_users request...")
        # Test Supabase connection
        response = postgrest_client.table("users").select("*").execute()
        print("✅ Raw Supabase response:", response)
        print("📊 Supabase data:", response.data)
        print("📊 Data type:", type(response.data))
        print("📊 Data length:", len(response.data) if response.data else 0)

        if not response.data:
            print("⚠️ No users found in database")
            return []

        users = []
        for user in response.data:
            try:
                # Clean up the user data before validation
                user_data = user.copy()
                # Handle 'NaT' values in last_login
                if user_data.get("last_login") == "NaT":
                    user_data["last_login"] = None
                user_obj = User(**user_data)
                users.append(user_obj)
                print(f"✅ Parsed user: {user_obj.name}")
            except Exception as parse_error:
                print(f"❌ Error parsing user {user}: {parse_error}")
                continue
        print(f"🏁 Returning {len(users)} users")
        return users
    except Exception as e:
        print(f"❌ Error in get_users: {e}")
        print(f"❌ Error type: {type(e)}")
        import traceback
        print(f"❌ Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@limiter.limit("10/minute")
@router.get("/users/{user_id}", response_model=User)
def get_user(request: Request, user_id: int):
    try:
        response = (
            postgrest_client.table("users")
            .select("*")
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found")
        return User(**response.data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/users", response_model=User)
async def create_user(
    user: UserCreate,
    user_access=Depends(require_role("Owner")),
    db=Depends(get_db),
):
    try:
        now = datetime.utcnow().isoformat()
        payload = user.dict()
        payload["created_at"] = now
        payload["updated_at"] = now
        response = postgrest_client.table("users").insert(payload).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="User creation failed")
        try:
            user_row = getattr(user_access, "user_row", user_access)
            new_activity = UserActivityLog(
                user_id=user_row.get("user_id"),
                action_type="add user",
                description=f"Added user: (Name: {user.name} | Role: {user.user_role})",
                activity_date=datetime.utcnow(),
                report_date=datetime.utcnow(),
                user_name=user_row.get("name"),
                role=user_row.get("user_role"),
            )
            db.add(new_activity)
            await db.flush()
            await db.commit()
            print("user add activity logged successfully.")
        except Exception as e:
            print("Failed to record user add activity:", e)
        return User(**response.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/users/{user_id}", response_model=User)
async def update_user(
    user_id: int,
    user: UserUpdate,
    user_access=Depends(require_role("Owner")),
    db=Depends(get_db),
):
    try:

        current_user_resp = (
            postgrest_client.table("users")
            .select("auth_id, email")
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        current_user = current_user_resp.data if current_user_resp.data else None
        auth_id = current_user.get("auth_id") if current_user else None
        old_email = current_user.get("email") if current_user else None

        update_data = user.dict(exclude_unset=True)
        print("Update payload:", update_data)  # Add this line
        update_data["updated_at"] = datetime.utcnow().isoformat()
        response = (
            postgrest_client.table("users").update(update_data).eq("user_id", user_id).execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found")

        new_email = user.email
        if auth_id and old_email and new_email and old_email != new_email:
            try:
                supabase.auth.admin.update_user_by_id(auth_id, {"email": new_email})
                print(f"Updated auth email for user {auth_id} to {new_email}")
            except Exception as e:
                print(f"Failed to update auth email: {e}")

        try:
            user_row = getattr(user_access, "user_row", user_access)
            new_activity = UserActivityLog(
                user_id=user_row.get("user_id"),
                action_type="update user",
                description=f"Updated user: (Name: {user.name} | Role: {user.user_role})",
                activity_date=datetime.utcnow(),
                report_date=datetime.utcnow(),
                user_name=user_row.get("name"),
                role=user_row.get("user_role"),
            )
            db.add(new_activity)
            await db.flush()
            await db.commit()
            print("user update activity logged successfully.")
        except Exception as e:
            print("Failed to record user update activity:", e)

        return User(**response.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    user_access=Depends(require_role("Owner")),
    db=Depends(get_db),
):
    try:
        # Fetch the user's info before deleting
        user_response = (
            postgrest_client.table("users")
            .select("auth_id, name, user_role")
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        print("Delete user lookup result:", user_response.data)  # Debug log
        auth_id = user_response.data.get("auth_id") if user_response.data else None
        target_name = (
            user_response.data.get("name") if user_response.data else "Unknown"
        )
        target_role = (
            user_response.data.get("user_role") if user_response.data else "Unknown"
        )

        # Delete from users table
        response = postgrest_client.table("users").delete().eq("user_id", user_id).execute()
        print("Delete users table result:", response.data)  # Debug log
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found")

        # Delete from Supabase Auth if auth_id exists
        if auth_id:
            try:
                supabase.auth.admin.delete_user(auth_id)
                print(f"Deleted user from Supabase Auth: {auth_id}")
            except Exception as auth_err:
                print(f"Error deleting from Supabase Auth: {auth_err}")

        try:
            user_row = getattr(user_access, "user_row", user_access)
            new_activity = UserActivityLog(
                user_id=user_row.get("user_id"),
                action_type="delete user",
                description=f"Deleted user: (Name: {target_name} | Role: {target_role})",
                activity_date=datetime.utcnow(),
                report_date=datetime.utcnow(),
                user_name=user_row.get("name"),
                role=user_row.get("user_role"),
            )
            db.add(new_activity)
            await db.flush()
            await db.commit()
            print("user delete activity logged successfully.")
        except Exception as e:
            print("Failed to record user delete activity:", e)

        return {"status": "success"}
    except Exception as e:
        print("Error in delete_user:", e)  # Debug log
        raise HTTPException(status_code=500, detail=str(e))


# Admin route to reset user password

# Password change request with admin password confirmation
class PasswordChangeRequest(BaseModel):
    auth_id: str
    new_password: str
    admin_password: str



from fastapi import Request as FastAPIRequest
from fastapi import status
import asyncio
from app.services.auth_service import login_user
from collections import defaultdict

# In-memory rate limit tracker (for demo; use Redis in prod)
_admin_pw_attempts = defaultdict(list)  # {admin_email: [timestamps]}
_MAX_ATTEMPTS = 3
_WINDOW_SECONDS = 600  # 10 minutes


@router.post("/admin/change-password")
async def change_user_password(
    request: PasswordChangeRequest,
    user_access=Depends(require_role("Owner")),
    db=Depends(get_db),
    fastapi_request: FastAPIRequest = None,
):

    # Get admin email and id from session/user_access
    user_row = getattr(user_access, "user_row", user_access)

    print(f"[DEBUG] user_row for admin password check: {user_row}")
    admin_email = user_row.get("email")
    admin_id = user_row.get("user_id")
    if not admin_email:
        print(f"[ERROR] Admin email is missing in user_row: {user_row}")
        raise HTTPException(status_code=400, detail="Admin email is missing from session. Please re-login or contact support.")

    # If the owner is changing their own password, skip admin password confirmation
    is_self = False
    # Find the user's own auth_id (from user_access or user_row)
    self_auth_id = user_row.get("auth_id")
    if self_auth_id and self_auth_id == request.auth_id:
        is_self = True

    # Prevent setting the new password to the same as the current password (only for self)
    if is_self:
        try:
            # Try to log in with the new password; if it works, it's the same as the current
            await login_user(admin_email, request.new_password)
            # If no exception, the new password is the same as the current
            raise HTTPException(status_code=400, detail="New password cannot be the same as the current password.")
        except HTTPException as e:
            if e.status_code == 401:
                pass  # New password is not the same as current, continue
            else:
                raise

    if not is_self:
        # Rate limit: 3 attempts per 10 minutes per admin
        now = datetime.utcnow().timestamp()
        attempts = _admin_pw_attempts[admin_email]
        # Remove old attempts
        _admin_pw_attempts[admin_email] = [t for t in attempts if now - t < _WINDOW_SECONDS]
        if len(_admin_pw_attempts[admin_email]) >= _MAX_ATTEMPTS:
            return {"error": "Too many confirmation attempts. Please try again later."}

        # Verify admin password (do not log/store password)
        print(f"[DEBUG] Checking admin password for email: {admin_email}")
        print(f"[DEBUG] Admin password being checked: {request.admin_password}")
        try:
            login_result = await login_user(admin_email, request.admin_password)
            print(f"[DEBUG] Supabase login_user result: {login_result}")
        except Exception as e:
            print(f"[DEBUG] Admin password check failed: {e}")
            _admin_pw_attempts[admin_email].append(now)
            # Audit log failed attempt
            try:
                new_activity = UserActivityLog(
                    user_id=admin_id,
                    action_type="admin password confirm failed",
                    description=f"Failed admin password confirmation for password change (target auth_id: {request.auth_id})",
                    activity_date=datetime.utcnow(),
                    report_date=datetime.utcnow(),
                    user_name=user_row.get("name"),
                    role=user_row.get("user_role"),
                )
                db.add(new_activity)
                await db.flush()
                await db.commit()
            except Exception:
                pass
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin password")

        # If here, password is correct; clear attempts
        _admin_pw_attempts[admin_email] = []

    # Proceed to change the user's password
    print(f"[DEBUG] Attempting password change for auth_id: {request.auth_id}")
    print(f"[DEBUG] New password: {request.new_password}")
    try:
        # Fetch the user's current email (required by Supabase API)
        user_lookup = postgrest_client.table("users").select("email").eq("auth_id", request.auth_id).single().execute()
        user_email = None
        if user_lookup.data and "email" in user_lookup.data:
            user_email = user_lookup.data["email"]
        if not user_email:
            print(f"[DEBUG] Could not find email for auth_id {request.auth_id}")
            raise HTTPException(status_code=400, detail="User email not found for password update")
        payload = {"password": request.new_password, "email": user_email}
        print(f"[DEBUG] update_user_by_id payload: {payload}")
        response = supabase.auth.admin.update_user_by_id(request.auth_id, payload)
        print(f"[DEBUG] Supabase update_user_by_id response: {response}")
        if hasattr(response, "error") and response.error:
            print(f"[DEBUG] Supabase error: {response.error}")
            raise HTTPException(status_code=400, detail=str(response.error))
    except Exception as e:
        print(f"[DEBUG] Exception during password update: {e}")
        raise HTTPException(status_code=500, detail=f"Exception during password update: {e}")

    try:
        # Fetch the target user's info (including email) using postgrest_client
        target_user_resp = (
            postgrest_client.table("users")
            .select("name, user_role, email")
            .eq("auth_id", request.auth_id)
            .single()
            .execute()
        )
        target_user = target_user_resp.data if target_user_resp.data else {}
        target_name = target_user.get("name", "Unknown")
        target_role = target_user.get("user_role", "Unknown")
        target_email = target_user.get("email")

        # Log activity (success)
        new_activity = UserActivityLog(
            user_id=admin_id,
            action_type="admin password confirm success",
            description=f"Confirmed admin password for password change (target auth_id: {request.auth_id})",
            activity_date=datetime.utcnow(),
            report_date=datetime.utcnow(),
            user_name=user_row.get("name"),
            role=user_row.get("user_role"),
        )
        db.add(new_activity)
        # Log the actual password change event as before
        pw_activity = UserActivityLog(
            user_id=admin_id,
            action_type="change password",
            description=f"Changed password for user: (Name: {target_name} | Role: {target_role})",
            activity_date=datetime.utcnow(),
            report_date=datetime.utcnow(),
            user_name=user_row.get("name"),
            role=user_row.get("user_role"),
        )
        db.add(pw_activity)
        await db.flush()
        await db.commit()
        print("user change password activity logged successfully.")
            # Email notification removed; will use EmailJS from frontend or other service.
    except Exception as e:
        print("Failed to record user change password activity or send email:", e)

    return {"status": "success"}
