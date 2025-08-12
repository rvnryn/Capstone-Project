import httpx
from fastapi import HTTPException
from dotenv import load_dotenv
import os

# Supabase URL and API Key
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_API_KEY = os.getenv("SUPABASE_KEY")

async def login_user(email: str, password: str):
    """
    This function sends login request to Supabase for authentication.
    """
    url = f"{SUPABASE_URL}/auth/v1/token"
    headers = {
        "apikey": SUPABASE_API_KEY,
        "Content-Type": "application/json",
    }
    data = {
        "email": email,
        "password": password,
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=data)

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Return response data (user details, JWT token, etc.)
    return response.json()
