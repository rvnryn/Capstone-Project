from unittest import result
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.supabase import supabase
import json

router = APIRouter()

class NotificationSettings(BaseModel):
    user_id: int
    low_stock_enabled: bool = True
    low_stock_method: Optional[List[str]] = ["inapp"]
    expiration_enabled: bool = True
    expiration_days: int = 3
    expiration_method: Optional[List[str]] = ["inapp"]

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

def create_notification(user_id, type, message, details=None):
    print(f"create_notification called for user_id={user_id}, type={type}, message={message}")
    try:
        now = datetime.utcnow().isoformat()
        today = now[:10]
        existing = supabase.table("notification") \
            .select("id") \
            .eq("user_id", user_id) \
            .eq("type", type) \
            .eq("message", message) \
            .gte("created_at", f"{today}T00:00:00") \
            .lte("created_at", f"{today}T23:59:59.999999") \
            .execute()
        print("Existing notifications:", existing.data)
        if existing.data and len(existing.data) > 0:
            print("Duplicate notification detected, not inserting.")
            return
        payload = {
            "user_id": user_id,
            "type": type,
            "message": message,
            "status": "unread",
            "created_at": now,
        }
        if details is not None:
            payload["details"] = details  # Make sure your Supabase table has a 'details' column (text)
        result = supabase.table("notification").insert(payload).execute()
        print("Insert result:", result)
    except Exception as e:
        print("Error creating notification:", e)

def format_items_message(type_str, items):
    parts = []
    for item in items:
        part = f"{item['name']}"
        if 'item_id' in item:
            part += f" (ID: {item['item_id']})"
        if 'quantity' in item:
            part += f" Qty: {item['quantity']}"
        if 'expiration_date' in item and item['expiration_date']:
            part += f" Exp: {item['expiration_date']}"
        parts.append(part)
    return f"{type_str}: {', '.join(parts)}"

def check_inventory_alerts():
    print("check_inventory_alerts called")
    from datetime import datetime, timedelta
    users_response = supabase.table("users").select("user_id").execute()
    users = [u["user_id"] for u in users_response.data] if users_response.data else []
    for user_id in users:
        inventory_response = supabase.table("inventory").select("item_id,item_name,batch_date,stock_quantity,expiration_date,category").execute()
        now = datetime.utcnow()
        soon = now + timedelta(days=3)
        low_items = []
        expiring_items = []
        if inventory_response.data:
            for item in inventory_response.data:
                item_id = item.get("item_id")
                item_name = item.get("item_name")
                item_batch_date = item.get("batch_date")
                stock = item.get("stock_quantity")
                exp_date = item.get("expiration_date")
                category = item.get("category")
                # Get threshold from inventory_settings (match by item_name or category)
                threshold = None
                threshold_resp = supabase.table("inventory_settings").select("low_stock_threshold").eq("name", item_name).execute()
                if threshold_resp.data and len(threshold_resp.data) > 0 and threshold_resp.data[0].get("low_stock_threshold") is not None:
                    threshold = threshold_resp.data[0]["low_stock_threshold"]
                # If not found by name, try by category
                if threshold is None and category:
                    threshold_resp = supabase.table("inventory_settings").select("low_stock_threshold").eq("category", category).execute()
                    if threshold_resp.data and len(threshold_resp.data) > 0 and threshold_resp.data[0].get("low_stock_threshold") is not None:
                        threshold = threshold_resp.data[0]["low_stock_threshold"]
                print(f"Item: {item_name}, Stock: {stock}, Threshold: {threshold}")
                if threshold is not None and stock is not None and stock <= threshold:
                    low_items.append({
                        "item_id": item_id,
                        "name": item_name,
                        "batch_date": item_batch_date,
                        "quantity": stock,
                        "expiration_date": exp_date,
                        "category": category
                    })
                # Expiring soon check
                if exp_date:
                    try:
                        exp_dt = datetime.fromisoformat(exp_date)
                    except Exception:
                        exp_dt = datetime.strptime(exp_date, "%Y-%m-%d")
                    if now <= exp_dt <= soon:
                        expiring_items.append({
                            "item_id": item_id,
                            "name": item_name,
                            "batch_date": item_batch_date,
                            "quantity": stock,
                            "expiration_date": exp_date,
                            "category": category
                        })
        if low_items:
            message = f"Low stock: {len(low_items)} items affected"
            details = json.dumps(low_items)
            create_notification(
                user_id=user_id,
                type="inapp",
                message=message,
                details=details
            )
        if expiring_items:
            message = f"Expiring soon: {len(expiring_items)} items affected"
            details = json.dumps(expiring_items)
            create_notification(
                user_id=user_id,
                type="inapp",
                message=message,
                details=details
            )

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
        # Query inventory for this user
        inventory_response = supabase.table("inventory").select("id,item_name,stock_quantity,threshold,expiration_date").eq("user_id", user_id).execute()
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
# Add to notification.py
@router.post("/notifications/test")
def test_notification(user_id: int):
    print("test_notification endpoint called with user_id:", user_id)
    create_notification(user_id, "inapp", "Test notification 2")
    return {"status": "test notification sent"}

@router.post("/notifications/run-inventory-check")
def run_inventory_check():
    print("Manual inventory check triggered")
    check_inventory_alerts()
    return {"status": "inventory check run"}