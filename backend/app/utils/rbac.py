from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
import os
from dotenv import load_dotenv
from app.supabase import SessionLocal
import jwt


load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../../.env'))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

SECRET_KEY = os.getenv("SECRET_KEY")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        print("[RBAC] Incoming token:", token)
        # Decode JWT (adjust for your auth system)
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"], audience="authenticated")
        print("[RBAC] Decoded payload:", payload)
        auth_id = payload.get("sub")  # Supabase UID
        if not auth_id:
            print("[RBAC] No auth_id in token payload")
            raise HTTPException(status_code=401, detail="Invalid token")
        # Fetch user from DB by auth_id (using SQLAlchemy text query)
        async with SessionLocal() as session:
            from sqlalchemy import text
            result = await session.execute(
                text("SELECT user_id, user_role FROM users WHERE auth_id = :auth_id"),
                {"auth_id": auth_id}
            )
            user = result.fetchone()
            print("[RBAC] DB lookup result:", user)
            if not user:
                print("[RBAC] User not found in DB for auth_id:", auth_id)
                raise HTTPException(status_code=404, detail="User not found")
            return {"user_id": user.user_id, "user_role": user.user_role}
    except Exception as e:
        print("[RBAC] Exception during authentication:", str(e))
        raise HTTPException(status_code=401, detail="Invalid authentication")

def require_role(*roles):
    def role_checker(user=Depends(get_current_user)):
        if user["user_role"] not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user
    return role_checker
