from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
import os
from dotenv import load_dotenv
from app.supabase import SessionLocal
import jwt


load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../../.env'))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

SECRET_KEY = os.getenv("SECRET_KEY")
print("Loaded SECRET_KEY:", repr(SECRET_KEY), type(SECRET_KEY))
async def get_current_user(token: str = Depends(oauth2_scheme)):
    print("[RBAC] Token type:", type(token), "value:", token)
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
                text("SELECT user_id, user_role, name, email FROM users WHERE auth_id = :auth_id"),
                {"auth_id": auth_id}
            )
            user = result.fetchone()
            print("[RBAC] DB lookup result:", user)
            if not user:
                print("[RBAC] User not found in DB for auth_id:", auth_id)
                raise HTTPException(status_code=404, detail="User not found")
            if isinstance(user, tuple):
                return {"user_id": user[0], "user_role": user[1], "name": user[2], "email": user[3]}
            else:
                return {
                    "user_id": user.user_id,
                    "user_role": user.user_role,
                    "name": user.name,
                    "email": user.email
                }

    except jwt.ExpiredSignatureError:
        print("[RBAC] Token has expired")
        raise HTTPException(
            status_code=401,
            detail="Session expired. Please log in again.",
            headers={"X-Session-Expired": "true"}
        )
    except jwt.InvalidTokenError as e:
        print(f"[RBAC] Invalid token: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        import traceback
        print("[RBAC] Exception during authentication:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=401, detail="Authentication failed")

def require_role(*roles):
    def role_checker(user=Depends(get_current_user)):
        if user["user_role"] not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user
    return role_checker

def get_owner_user(session):
    """
    Fetches an Owner user using a synchronous SQLAlchemy session.
    This function must NOT be called with an async session.
    """
    from sqlalchemy import text
    result = session.execute(
        text("SELECT user_id, user_role, name, email FROM users WHERE user_role = :role LIMIT 1"),
        {"role": "Owner"}
    )
    user = result.fetchone()
    if not user:
        return {"user_id": None, "user_role": "Owner", "name": "ScheduledJob", "email": None}
    if isinstance(user, tuple):
        return {"user_id": user[0], "user_role": user[1], "name": user[2], "email": user[3]}
    else:
        return {
            "user_id": user.user_id,
            "user_role": user.user_role,
            "name": user.name,
            "email": user.email
        }