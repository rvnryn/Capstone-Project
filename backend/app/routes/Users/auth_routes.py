from fastapi import APIRouter, HTTPException, Depends, Request
from slowapi.util import get_remote_address
from slowapi import Limiter
from pydantic import BaseModel
from app.services.auth_service import login_user
import httpx
import asyncio
import os
from app.supabase import get_db
from datetime import datetime
from app.routes.Reports.UserActivity.userActivity import UserActivityLog
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()

limiter = Limiter(key_func=get_remote_address, default_limits=["10/minute"])

class LoginRequest(BaseModel):
    email: str
    password: str


@limiter.limit("10/minute")
@router.post("/auth/login")
async def login(
    request: Request, login_req: LoginRequest, db: AsyncSession = Depends(get_db)
):
    try:
        identifier = login_req.email
        from sqlalchemy import select
        from app.models.userModal import User

        user_row = {}
        if "@" not in identifier:
            stmt = select(User).where(User.username == identifier)
            result = await db.execute(stmt)
            user = result.scalar_one_or_none()
            if not user:
                raise HTTPException(status_code=404, detail="Username not found")
            identifier = user.email
            user_row = {
                "user_id": user.user_id,
                "username": user.username,
                "name": user.name,
                "user_role": user.user_role,
                "email": user.email,
            }
        else:
            stmt = select(User).where(User.email == identifier)
            result = await db.execute(stmt)
            user = result.scalar_one_or_none()
            if not user:
                raise HTTPException(status_code=404, detail="Email not found")
            user_row = {
                "user_id": user.user_id,
                "username": user.username,
                "name": user.name,
                "user_role": user.user_role,
                "email": user.email,
            }

        # Debug print
        print(f"Logging in user: {user_row}")

        # Guard: identifier must be a valid email
        if not identifier or "@" not in identifier:
            print(f"[ERROR] Login failed: missing or invalid email for identifier: {identifier}")
            raise HTTPException(status_code=400, detail="Login failed: missing or invalid email. Please check your username/email.")

        result = await login_user(identifier, login_req.password)
        if not result or "user" not in result:
            raise HTTPException(status_code=401, detail="Invalid login credentials")

        supabase_user_id = result.get("user", {}).get("id") or result.get("user_id")
        email = identifier
        # Always update auth_id for the user who logged in (by username or email)
        if supabase_user_id:
            # Find user by email (should always exist at this point)
            stmt = select(User).where(User.email == email)
            result_user = await db.execute(stmt)
            user_obj = result_user.scalar_one_or_none()
            if user_obj:
                if not user_obj.auth_id or user_obj.auth_id != supabase_user_id:
                    user_obj.auth_id = supabase_user_id
                    db.add(user_obj)
                    await db.commit()

        try:
            new_activity = UserActivityLog(
                user_id=user_row.get("user_id"),
                action_type="login",
                description="User  logged in",
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

        # Build user object for frontend (your app's user info)
        app_user_obj = {
            "user_id": user_row.get("user_id"),
            "username": user_row.get("username"),
            "name": user_row.get("name"),
            "email": user_row.get("email"),
            "user_role": user_row.get("user_role"),
        }
        response_data = {
            "access_token": result.get("access_token"),
            "user": app_user_obj,
            "role": user_row.get("user_role"),
        }
        return response_data
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Unexpected error during login: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


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

    # Use a small retry loop with timeout to avoid unhandled httpx.ReadTimeout
    async def _fetch_user():
        timeout = httpx.Timeout(5.0, read=5.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            return await client.get(url, headers=headers)

    max_retries = 3
    backoff = 0.5
    for attempt in range(1, max_retries + 1):
        try:
            response = await _fetch_user()
            break
        except (httpx.ReadTimeout, httpx.RequestError) as e:
            if attempt == max_retries:
                print(f"Supabase auth fetch failed after {attempt} attempts: {e}")
                raise HTTPException(status_code=503, detail="Auth provider timed out")
            await asyncio.sleep(backoff)
            backoff *= 2

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user_data = response.json()
    supabase_user_id = user_data.get("id")
    email = user_data.get("email")
    name = user_data.get("user_metadata", {}).get("name", "")

    # Get user info from your users table using auth_id
    from sqlalchemy import select
    from app.models.userModal import User

    stmt = select(User).where(User.auth_id == supabase_user_id)
    result_user = await db.execute(stmt)
    user = result_user.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=404, detail="User not found or duplicate users found"
        )
    db_user = {
        "auth_id": user.auth_id,
        "user_id": user.user_id,
        "username": user.username,
        "name": user.name,
        "email": user.email,
        "user_role": user.user_role,
    }
    print("[DEBUG /auth/session] db_user:", db_user)

    # Build response: merge Supabase and DB info
    return {
        'user': {
            'id': user.id,
            'user_id': db_user["user_id"],
            'username': db_user["username"],
            'name': db_user["name"],
            'email': db_user["email"],
        },
        'role': db_user["user_role"]
    }


@router.post("/auth/logout")
async def logout(request: Request, db: AsyncSession = Depends(get_db)):
    # Get token from Authorization header
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        # No token, but still return 200 OK for frontend logout
        print("[LOGOUT] No token provided, returning 200 OK")
        return {"message": "Logged out (no token provided)"}
    token = auth_header.split(" ")[1]

    # Validate token with Supabase
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_API_KEY = os.getenv("SUPABASE_KEY")
    url = f"{SUPABASE_URL}/auth/v1/user"
    headers = {
        "apikey": SUPABASE_API_KEY,
        "Authorization": f"Bearer {token}",
    }

    # Use same retry/timeout approach for logout session fetch
    async def _fetch_user_logout():
        timeout = httpx.Timeout(5.0, read=5.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            return await client.get(url, headers=headers)

    max_retries = 3
    backoff = 0.5
    response = None
    for attempt in range(1, max_retries + 1):
        try:
            response = await _fetch_user_logout()
            break
        except (httpx.ReadTimeout, httpx.RequestError) as e:
            print(f"Supabase auth fetch failed after {attempt} attempts: {e}")
            if attempt == max_retries:
                # Log error, but return 200 OK for frontend logout
                return {"message": "Logged out (provider unavailable)"}
            await asyncio.sleep(backoff)
            backoff *= 2

    if not response or response.status_code != 200:
        print(f"[LOGOUT] Invalid or expired token, returning 200 OK")
        return {"message": "Logged out (invalid or expired token)"}

    user_data = response.json()
    supabase_user_id = user_data.get("id")

    # Get user info from your users table
    from sqlalchemy import select
    from app.models.userModal import User

    stmt = select(User).where(User.auth_id == supabase_user_id)
    result_user = await db.execute(stmt)
    user = result_user.scalar_one_or_none()
    if not user:
        print("[LOGOUT] User not found, returning 200 OK")
        return {"message": "Logged out (user not found)"}
    db_user = {
        "user_id": user.user_id,
        "username": user.username,
        "name": user.name,
        "user_role": user.user_role,
    }

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
