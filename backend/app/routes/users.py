from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.supabase import supabase, get_db
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
    last_login: Optional[datetime] = None
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


@router.get("/users", response_model=List[User])
def get_users():
    try:
        response = supabase.table("users").select("*").execute()
        print("Raw Supabase data:", response.data)  # Debug line
        users = [User(**user) for user in response.data]
        print("Parsed users:", users)  # Debug line
        return users
    except Exception as e:
        print("Error in get_users:", e)  # Debug line
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users/{user_id}", response_model=User)
def get_user(user_id: int):
    try:
        response = (
            supabase.table("users")
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
    user_access=Depends(require_role("Owner", "General Manager", "Store Manager")),
    db=Depends(get_db),
):
    try:
        now = datetime.utcnow().isoformat()
        payload = user.dict()
        payload["created_at"] = now
        payload["updated_at"] = now
        response = supabase.table("users").insert(payload).execute()
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
    user_access=Depends(require_role("Owner", "General Manager", "Store Manager")),
    db=Depends(get_db),
):
    try:

        current_user_resp = (
            supabase.table("users")
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
            supabase.table("users").update(update_data).eq("user_id", user_id).execute()
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
    user_access=Depends(require_role("Owner", "General Manager", "Store Manager")),
    db=Depends(get_db),
):
    try:
        # Fetch the user's info before deleting
        user_response = (
            supabase.table("users")
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
        response = supabase.table("users").delete().eq("user_id", user_id).execute()
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
class PasswordChangeRequest(BaseModel):
    auth_id: str
    new_password: str


@router.post("/admin/change-password")
async def change_user_password(
    request: PasswordChangeRequest,
    user_access=Depends(require_role("Owner", "General Manager", "Store Manager")),
    db=Depends(get_db),
):
    response = supabase.auth.admin.update_user_by_id(
        request.auth_id, {"password": request.new_password}
    )
    if hasattr(response, "error") and response.error:
        raise HTTPException(status_code=400, detail=str(response.error))

    try:
        # Fetch the target user's info
        target_user_resp = (
            supabase.table("users")
            .select("name, user_role")
            .eq("auth_id", request.auth_id)
            .single()
            .execute()
        )
        target_user = target_user_resp.data if target_user_resp.data else {}
        target_name = target_user.get("name", "Unknown")
        target_role = target_user.get("user_role", "Unknown")

        user_row = getattr(user_access, "user_row", user_access)
        new_activity = UserActivityLog(
            user_id=user_row.get("user_id"),
            action_type="change password",
            description=f"Changed password for user: (Name: {target_name} | Role: {target_role})",
            activity_date=datetime.utcnow(),
            report_date=datetime.utcnow(),
            user_name=user_row.get("name"),
            role=user_row.get("user_role"),
        )
        db.add(new_activity)
        await db.flush()
        await db.commit()
        print("user change password activity logged successfully.")
    except Exception as e:
        print("Failed to record user change password activity:", e)

    return {"status": "success"}
