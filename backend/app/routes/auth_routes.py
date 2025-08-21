from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from app.services.auth_service import login_user
import httpx
import os
from app.supabase import get_db, supabase
from datetime import datetime
from app.routes.userActivity import UserActivityLog
from sqlalchemy.orm import Session

router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/auth/login")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    try:
        identifier = request.email  # Could be email or username

        if "@" not in identifier:
            db_response = (
                supabase.table("users")
                .select("email", "user_id", "username", "name", "user_role")
                .eq("username", identifier)
                .execute()
            )
            if not db_response.data or len(db_response.data) != 1:
                raise HTTPException(status_code=404, detail="Username not found")
            identifier = db_response.data[0]["email"]
            user_row = db_response.data[0]
        else:
            db_response = (
                supabase.table("users")
                .select("user_id", "username", "name", "user_role", "email")
                .eq("email", identifier)
                .execute()
            )
            if not db_response.data or len(db_response.data) != 1:
                user_row = {}
            else:
                user_row = db_response.data[0]

        result = await login_user(identifier, request.password)

        # New code block to update auth_id in users table
        supabase_user_id = result.get("user", {}).get("id") or result.get("user_id")
        email = identifier
        if supabase_user_id and email:
            # Update users table with new auth_id
            supabase.table("users").update({"auth_id": supabase_user_id}).eq(
                "email", email
            ).execute()

        try:
            new_activity = UserActivityLog(
                user_id=user_row.get("user_id"),
                action_type="login",
                description="User logged in",
                activity_date=datetime.utcnow(),
                report_date=datetime.utcnow(),
                user_name=user_row.get("name"),
                role=user_row.get("user_role"),
            )
            db.add(new_activity)
            await db.flush()
            await db.commit()
            print("Login activity logged successfully.")
        except Exception as e:
            print("Failed to record login activity:", e)

        # Always include the resolved email in the response
        response_data = {
            **result,  # JWT and other info from login_user
            "email": identifier,  # resolved email
            "user_id": user_row.get("user_id"),
            "name": user_row.get("name"),
            "user_role": user_row.get("user_role"),
            "username": user_row.get("username"),
        }
        return response_data
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/auth/session")
async def get_session(request: Request, db=Depends(get_db)):
    # Get token from Authorization header
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = auth_header.split(" ")[1]

    # Validate token with Supabase
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_API_KEY = os.getenv("SUPABASE_KEY")
    url = f"{SUPABASE_URL}/auth/v1/user"
    headers = {
        "apikey": SUPABASE_API_KEY,
        "Authorization": f"Bearer {token}",
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        user_data = response.json()
        supabase_user_id = user_data.get("id")
        email = user_data.get("email")
        name = user_data.get("user_metadata", {}).get("name", "")

    # Get user info from your users table using auth_id
    db_response = (
        supabase.table("users").select("*").eq("auth_id", supabase_user_id).execute()
    )
    if not db_response.data or len(db_response.data) != 1:
        raise HTTPException(
            status_code=404, detail="User not found or duplicate users found"
        )
    db_user = db_response.data[0]

    # Build response: merge Supabase and DB info
    return {
        "user": {
            "id": db_user["auth_id"],
            "user_id": db_user["user_id"],
            "name": db_user.get("name") or name,
            "email": db_user.get("email") or email,
        },
        "role": db_user["user_role"],
    }


@router.post("/auth/logout")
async def logout(request: Request, db: Session = Depends(get_db)):
    # Get token from Authorization header
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = auth_header.split(" ")[1]

    # Validate token with Supabase
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_API_KEY = os.getenv("SUPABASE_KEY")
    url = f"{SUPABASE_URL}/auth/v1/user"
    headers = {
        "apikey": SUPABASE_API_KEY,
        "Authorization": f"Bearer {token}",
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        user_data = response.json()
        supabase_user_id = user_data.get("id")

    # Get user info from your users table
    db_response = (
        supabase.table("users")
        .select("user_id", "username", "name", "user_role")
        .eq("auth_id", supabase_user_id)
        .execute()
    )
    if not db_response.data or len(db_response.data) != 1:
        raise HTTPException(status_code=404, detail="User not found")
    db_user = db_response.data[0]

    # Log the logout activity
    try:
        print("Attempting to log logout activity...")
        print("user_id:", db_user.get("user_id"))
        print("name:", db_user.get("name"))
        print("role:", db_user.get("user_role"))
        new_activity = UserActivityLog(
            user_id=db_user.get("user_id"),
            action_type="logout",
            description="User logged out",
            activity_date=datetime.utcnow(),
            report_date=datetime.utcnow(),
            user_name=db_user.get("name"),
            role=db_user.get("user_role"),
        )
        db.add(new_activity)
        await db.flush()
        await db.commit()
        print("Logout activity logged successfully.")
    except Exception as e:
        print("Failed to record logout activity:", e)

    return {"message": "Logged out and activity recorded"}
