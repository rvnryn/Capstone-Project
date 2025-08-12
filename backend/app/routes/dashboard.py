
from fastapi import APIRouter, HTTPException
from app.supabase import supabase  # Make sure this file exists and supabase is initialized there

router = APIRouter()

# Low stock inventory endpoint
@router.get("/dashboard/low-stock")
def get_low_stock_inventory():
    try:
        # Fetch all inventory items with stock_status == 'Low'
        response = supabase.table("inventory").select("*").eq("stock_status", "Low").execute()
        return response.data
    except Exception as e:
        print("Error fetching low stock inventory:", e)
        raise HTTPException(status_code=500, detail=str(e))

# Expiring ingredients endpoint (within 7 days)
from datetime import datetime, timedelta, timezone

def get_expiration_alert_days():
    try:
        result = supabase.table("notification_settings").select("expiration_days").single().execute()
        days = result.data.get("expiration_days")
        return int(days) if days is not None else 7
    except Exception:
        return 7

@router.get("/dashboard/expiring-ingredients")
def get_expiring_ingredients():
    try:
        today = datetime.now(timezone.utc).date()
        alert_days = get_expiration_alert_days()
        threshold_date = today + timedelta(days=alert_days)
        expiring_inventory = supabase.table("inventory").select("*") \
            .gte("expiration_date", today.isoformat()) \
            .lte("expiration_date", threshold_date.isoformat()) \
            .order("expiration_date") \
            .execute().data or []
        """ expiring_today = supabase.table("inventory_today").select("*") \
            .gte("expiration_date", today.isoformat()) \
            .lte("expiration_date", next_week.isoformat()) \
            .order("expiration_date") \
            .execute().data or []
        expiring_surplus = supabase.table("inventory_surplus").select("*") \
            .gte("expiration_date", today.isoformat()) \
            .lte("expiration_date", next_week.isoformat()) \
            .order("expiration_date") \
            .execute().data or [] """
        # Combine all results
        all_expiring = expiring_inventory
     #    all_expiring = expiring_inventory + expiring_today + expiring_surplus
        # Optionally, sort again by expiration_date
        all_expiring.sort(key=lambda x: x.get("expiration_date", ""))
        return all_expiring
    except Exception as e:
        print("Error fetching expiring ingredients:", e)
        raise HTTPException(status_code=500, detail=str(e))

# Surplus ingredients endpoint (stock_status == 'High')

@router.get("/dashboard/surplus-ingredients")
def get_surplus_ingredients():
    try:
        response = supabase.table("inventory_surplus").select("*").execute()
        return response.data
    except Exception as e:
        print("Error fetching surplus ingredients:", e)
        raise HTTPException(status_code=500, detail=str(e))



