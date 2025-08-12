# FastAPI Backend Example

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.supabase import supabase  # Use your supabase import

router = APIRouter()

class AuthUser(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    access_token: Optional[str]
    token_type: Optional[str]
    expires_in: Optional[int]
    refresh_token: Optional[str]
    user: Optional[dict]

@router.post("/api/auth/login", response_model=AuthResponse)
async def login(user: AuthUser):
    supa = supabase()
    response = supa.auth.sign_in_with_password({
        "email": user.email,
        "password": user.password,
    })

    if not response or not getattr(response, "session", None):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    session = response.session
    return AuthResponse(
        access_token=getattr(session, "access_token", None),
        token_type="bearer",
        expires_in=getattr(session, "expires_in", None),
        refresh_token=getattr(session, "refresh_token", None),
        user=getattr(session, "user", None),
    )
