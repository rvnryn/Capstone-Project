from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime
from app.supabase import supabase


router = APIRouter()

class NotificationSettings(BaseModel):
    user_id: int
    low_stock_enabled: bool = True
    low_stock_method: Optional[List[str]] = ["inapp"]
    expiration_enabled: bool = True
    expiration_days: int = 3
    expiration_method: Optional[List[str]] = ["inapp"]
    restock_enabled: bool = True
    restock_method: Optional[List[str]] = ["inapp"]

class Notification(BaseModel):
    user_id: int
    type: str
    message: str
    status: str = "unread"
    created_at: Optional[datetime] = None
    
# --- Notification Settings Endpoints ---
@router.get("/notification-settings")
def get_notification_settings(user_id: int):
    try:
        resp = supabase.table("notification_settings").select("*").eq("user_id", user_id).single().execute()
        if resp.data:
            return resp.data
        # Return defaults if not set
        return NotificationSettings(user_id=user_id).dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/notification-settings")
def update_notification_settings(settings: NotificationSettings):
    try:
        # Upsert (insert or update)
        result = supabase.table("notification_settings").upsert(settings.dict(), on_conflict=["user_id"]).execute()
        if hasattr(result, 'error') and result.error:
            print("Notification settings upsert error:", result.error)
            raise HTTPException(status_code=500, detail=str(result.error))
        return {"status": "success"}
    except Exception as e:
        print("Notification settings upsert exception:", e)
        raise HTTPException(status_code=500, detail=str(e))

def create_notification(user_id, type, message):
    try:
        now = datetime.utcnow().isoformat()
        # Prevent duplicate notifications for the same user, type, and message on the same day
        today = now[:10]
        existing = supabase.table("notification") \
            .select("id") \
            .eq("user_id", user_id) \
            .eq("type", type) \
            .eq("message", message) \
            .gte("created_at", f"{today}T00:00:00") \
            .lte("created_at", f"{today}T23:59:59.999999") \
            .execute()
        if existing.data and len(existing.data) > 0:
            return  # Don't create duplicate notification for today
        payload = {
            "user_id": user_id,
            "type": type,
            "message": message,
            "status": "unread",
            "created_at": now,
        }
        supabase.table("notification").insert(payload).execute()
    except Exception as e:
        print("Error creating notification:", e)

def check_inventory_alerts():
    from datetime import datetime, timedelta
    users_response = supabase.table("users").select("user_id").execute()
    users = [u["user_id"] for u in users_response.data] if users_response.data else []
    for user_id in users:
        # Query master_inventory for this user
        inventory_response = supabase.table("master_inventory").select("id,item_name,stock_quantity,threshold,expiration_date").eq("user_id", user_id).execute()
        low_items = []
        expiring_items = []
        restocked_items = []
        now = datetime.utcnow()
        soon = now + timedelta(days=3)
        if inventory_response.data:
            for item in inventory_response.data:
                try:
                    threshold = item.get("threshold")
                    stock = item.get("stock_quantity")
                    exp_date = item.get("expiration_date")
                    # Low stock
                    if threshold is not None and stock is not None and stock <= threshold:
                        low_items.append(item["item_name"])
                    # Expiring soon
                    if exp_date:
                        try:
                            exp_dt = datetime.fromisoformat(exp_date)
                        except Exception:
                            exp_dt = datetime.strptime(exp_date, "%Y-%m-%d")
                        if now <= exp_dt <= soon:
                            expiring_items.append(item["item_name"])
                    # Restocking alert: if stock just went above threshold (requires previous state)
                    # For demo, if stock > threshold, send restock alert (in real app, track previous state)
                    if threshold is not None and stock is not None and stock > threshold:
                        # Check if a previous low stock notification exists and is unread
                        notif_resp = supabase.table("notification").select("id").eq("user_id", user_id).eq("type", "inapp").like("message", f"%{item['item_name']}%").eq("status", "unread").execute()
                        if notif_resp.data:
                            restocked_items.append(item["item_name"])
                except Exception:
                    continue
        if low_items:
            create_notification(
                user_id=user_id,
                type="inapp",
                message=f"Low stock: {', '.join(low_items)}"
            )
        if expiring_items:
            create_notification(
                user_id=user_id,
                type="inapp",
                message=f"Expiring soon: {', '.join(expiring_items)}"
            )
        if restocked_items:
            create_notification(
                user_id=user_id,
                type="inapp",
                message=f"Restocked: {', '.join(restocked_items)}"
            )

scheduler = BackgroundScheduler()
scheduler.add_job(check_inventory_alerts, "interval", minutes=60)
scheduler.start()

@router.get("/notifications")
def get_notifications(user_id: int):
    try:
        response = supabase.table("notification").select("*").eq("user_id", user_id).execute()
        return {"notifications": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# FastAPI route to mark notifications as read
@router.post("/notifications/mark-read")
async def mark_notifications_read(
    user_id: int = Query(...),
    notification_id: int = Query(...)
):
    try:
        response = supabase.table("notification").update({"status": "read"}).eq("user_id", user_id).eq("id", notification_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Notification not found")
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/notifications/empty")
def get_empty_notifications():
    from datetime import datetime, timedelta
    users_response = supabase.table("users").select("user_id").execute()
    users = [u["user_id"] for u in users_response.data] if users_response.data else []
    for user_id in users:
        # Get notification settings for user
        settings_resp = supabase.table("notification_settings").select("*").eq("user_id", user_id).single().execute()
        settings = settings_resp.data if settings_resp.data else NotificationSettings(user_id=user_id).dict()
        # Query master_inventory for this user
        inventory_response = supabase.table("master_inventory").select("id,item_name,stock_quantity,threshold,expiration_date").eq("user_id", user_id).execute()
        # Build a set of current item names for this user
        current_items = set()
        if inventory_response.data:
            for item in inventory_response.data:
                if item.get("item_name"):
                    current_items.add(item["item_name"])
        low_items = []
        expiring_items = []
        restocked_items = []
        now = datetime.utcnow()
        soon = now + timedelta(days=settings.get("expiration_days", 3))
        if inventory_response.data:
            for item in inventory_response.data:
                try:
                    threshold = item.get("threshold")
                    stock = item.get("stock_quantity")
                    exp_date = item.get("expiration_date")
                    # Low stock
                    if settings.get("low_stock_enabled", True) and threshold is not None and stock is not None and stock <= threshold:
                        low_items.append(item["item_name"])
                    # Expiring soon
                    if settings.get("expiration_enabled", True) and exp_date:
                        try:
                            exp_dt = datetime.fromisoformat(exp_date)
                        except Exception:
                            exp_dt = datetime.strptime(exp_date, "%Y-%m-%d")
                        if now <= exp_dt <= soon:
                            expiring_items.append(item["item_name"])
                    # Restocking alert: if stock just went above threshold (requires previous state)
                    if settings.get("restock_enabled", True) and threshold is not None and stock is not None and stock > threshold:
                        notif_resp = supabase.table("notification").select("id").eq("user_id", user_id).eq("type", "inapp").like("message", f"%{item['item_name']}%").eq("status", "unread").execute()
                        if notif_resp.data:
                            restocked_items.append(item["item_name"])
                except Exception:
                    continue
        # Only send notifications for enabled methods and for items that still exist
        # --- LOW STOCK ---
        if low_items and "inapp" in settings.get("low_stock_method", ["inapp"]):
            filtered_low = [i for i in low_items if i in current_items]
            if filtered_low:
                create_notification(
                    user_id=user_id,
                    type="inapp",
                    message=f"Low stock: {', '.join(filtered_low)}"
                )

        # --- EXPIRING SOON ---
        if expiring_items and "inapp" in settings.get("expiration_method", ["inapp"]):
            filtered_exp = [i for i in expiring_items if i in current_items]
            if filtered_exp:
                create_notification(
                    user_id=user_id,
                    type="inapp",
                    message=f"Expiring soon: {', '.join(filtered_exp)}"
                )

        # --- RESTOCKED ---
        if restocked_items and "inapp" in settings.get("restock_method", ["inapp"]):
            filtered_rest = [i for i in restocked_items if i in current_items]
            if filtered_rest:
                create_notification(
                    user_id=user_id,
                    type="inapp",
                    message=f"Restocked: {', '.join(filtered_rest)}"
                )