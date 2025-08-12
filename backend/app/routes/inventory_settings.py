from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.supabase import supabase


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
def create_inventory_setting(setting: InventorySettingCreate):
    try:
        now = datetime.utcnow().isoformat()
        payload = setting.dict()
        payload["created_at"] = now
        payload["updated_at"] = now
        response = supabase.table("inventory_settings").insert(payload).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="Inventory setting creation failed")
        return InventorySettingOut(**response.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/inventory-settings/{setting_id}", response_model=InventorySettingOut)
def update_inventory_setting(setting_id: int, setting: InventorySettingUpdate):
    try:
        update_data = setting.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow().isoformat()
        response = supabase.table("inventory_settings").update(update_data).eq("id", setting_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Setting not found")
        return InventorySettingOut(**response.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/inventory-settings/{setting_id}")
def delete_inventory_setting(setting_id: int):
    try:
        response = supabase.table("inventory_settings").delete().eq("id", setting_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Setting not found")
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
