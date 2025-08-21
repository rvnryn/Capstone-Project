from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.routes.userActivity import UserActivityLog
from app.utils.rbac import require_role
from app.supabase import supabase, get_db


router = APIRouter()

class InventorySettingBase(BaseModel):
    name: str
    default_unit: Optional[str] = None
    low_stock_threshold: Optional[int] = None
    category: Optional[str] = None

class InventorySettingCreate(InventorySettingBase):
    pass

class InventorySettingUpdate(InventorySettingBase):
    pass

class InventorySettingOut(InventorySettingBase):
    id: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True

@router.get("/inventory-settings", response_model=List[InventorySettingOut])
def get_inventory_settings():
    try:
        response = supabase.table("inventory_settings").select("*").order("id", desc=False).execute()
        if not response.data:
            return []
        return [InventorySettingOut(**item) for item in response.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/inventory-settings", response_model=InventorySettingOut, status_code=status.HTTP_201_CREATED)
async def create_inventory_setting(setting: InventorySettingCreate, user=Depends(require_role("Owner", "General Manager", "Store Manager")), db=Depends(get_db)):
    try:
        now = datetime.utcnow().isoformat()
        payload = setting.dict()
        payload["created_at"] = now
        payload["updated_at"] = now
        response = supabase.table("inventory_settings").insert(payload).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="Inventory setting creation failed")
        
        try:
            user_row = getattr(user, "user_row", user)
            new_activity = UserActivityLog(
                user_id=user_row.get("user_id"),
                action_type="create inventory setting",
                description=f"Created inventory setting: ({response.data[0].get('name')} | {response.data[0].get('category')} | {response.data[0].get('default_unit')} | {response.data[0].get('low_stock_threshold')})",
                activity_date=datetime.utcnow(),
                report_date=datetime.utcnow(),
                user_name=user_row.get("name"),
                role=user_row.get("user_role")
            )
            db.add(new_activity)
            await db.flush()
            await db.commit()
            print("create inventory setting activity logged successfully.")
        except Exception as e:
            print("Failed to record create inventory setting activity:", e)

        return InventorySettingOut(**response.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/inventory-settings/{setting_id}", response_model=InventorySettingOut)
async def update_inventory_setting(setting_id: int, setting: InventorySettingUpdate, user=Depends(require_role("Owner", "General Manager", "Store Manager")), db=Depends(get_db)):
    try:
        update_data = setting.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow().isoformat()
        response = supabase.table("inventory_settings").update(update_data).eq("id", setting_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Setting not found")
        
        try:
            user_row = getattr(user, "user_row", user)
            new_activity = UserActivityLog(
                user_id=user_row.get("user_id"),
                action_type="update inventory setting",
                description=f"Updated inventory setting: ({response.data[0].get('name')} | {response.data[0].get('category')} | {response.data[0].get('default_unit')} | {response.data[0].get('low_stock_threshold')})",
                activity_date=datetime.utcnow(),
                report_date=datetime.utcnow(),
                user_name=user_row.get("name"),
                role=user_row.get("user_role")
            )
            db.add(new_activity)
            await db.flush()
            await db.commit()
            print("update inventory setting activity logged successfully.")
        except Exception as e:
            print("Failed to record update inventory setting activity:", e)

        return InventorySettingOut(**response.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/inventory-settings/{setting_id}")
async def delete_inventory_setting(setting_id: int, user=Depends(require_role("Owner", "General Manager", "Store Manager")), db=Depends(get_db)):
    try:
        response = supabase.table("inventory_settings").delete().eq("id", setting_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Setting not found")
        
        try:
            user_row = getattr(user, "user_row", user)
            new_activity = UserActivityLog(
                user_id=user_row.get("user_id"),
                action_type="delete inventory setting",
                description=f"Deleted inventory setting: (Name: {response.data[0].get('name')} | Category: {response.data[0].get('category')} | Default Unit: {response.data[0].get('default_unit')} | Low Stock Threshold: {response.data[0].get('low_stock_threshold')})",
                activity_date=datetime.utcnow(),
                report_date=datetime.utcnow(),
                user_name=user_row.get("name"),
                role=user_row.get("user_role")
            )
            db.add(new_activity)
            await db.flush()
            await db.commit()
            print("delete inventory setting activity logged successfully.")
        except Exception as e:
            print("Failed to record delete inventory setting activity:", e)

        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
