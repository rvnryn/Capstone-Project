from urllib import request
from fastapi import APIRouter, HTTPException
from app.supabase import supabase

router = APIRouter()
@router.get("/report_inventory")
async def get_inventory():
    try:
        response = supabase.table("inventory").select("*").execute()
        return response.data
    except Exception as e:
        print("Error:", e)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/report_sales")
async def get_sales():
    return []

@router.get("/report_user_activity")
async def get_user_activity():
    try:
        response = supabase.table("user_activity_log").select("*").execute()
        return response.data
    except Exception as e:
        print("Error:", e)
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/report_past_inventory_log")
async def get_past_inventory_log():
    try:
        response = supabase.table("past_inventory_log").select("*").execute()
        return response.data
    except Exception as e:
        print("Error:", e)
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/report_past_sales_log")
async def get_past_sales_log():
    try:
        response = supabase.table("past_order_item").select("*").execute()
        return response.data
    except Exception as e:
        print("Error:", e)
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/report_past_user_activity_log")
async def get_past_user_activity_log():
    try:
        response = supabase.table("past_user_activity_log").select("*").execute()
        return response.data
    except Exception as e:
        print("Error:", e)
        raise HTTPException(status_code=500, detail=str(e))