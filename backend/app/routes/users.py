from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.supabase import supabase

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
        response = supabase.table("users").select("*").eq("user_id", user_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found")
        return User(**response.data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users", response_model=User)
def create_user(user: UserCreate):
    try:
        now = datetime.utcnow().isoformat()
        payload = user.dict()
        payload["created_at"] = now
        payload["updated_at"] = now
        response = supabase.table("users").insert(payload).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="User creation failed")
        return User(**response.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/users/{user_id}", response_model=User)
async def update_user(user_id: int, user: UserUpdate):
    try:
        update_data = user.dict(exclude_unset=True)
        print("Update payload:", update_data)  # Add this line
        update_data["updated_at"] = datetime.utcnow().isoformat()
        response = supabase.table("users").update(update_data).eq("user_id", user_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found")
        return User(**response.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/users/{user_id}")
def delete_user(user_id: int):
    try:
        # Get the user's auth_id first
        user_response = supabase.table("users").select("auth_id").eq("user_id", user_id).single().execute()
        print("Delete user lookup result:", user_response.data)  # Debug log
        auth_id = user_response.data.get("auth_id") if user_response.data else None

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

        return {"status": "success"}
    except Exception as e:
        print("Error in delete_user:", e)  # Debug log
        raise HTTPException(status_code=500, detail=str(e))

#Admin route to reset user password
class PasswordChangeRequest(BaseModel):
    auth_id: str
    new_password: str

@router.post("/admin/change-password")
def change_user_password(request: PasswordChangeRequest):
    response = supabase.auth.admin.update_user_by_id(
        request.auth_id,
        {"password": request.new_password}
    )
    if hasattr(response, "error") and response.error:
        raise HTTPException(status_code=400, detail=str(response.error))
    return {"status": "success"}