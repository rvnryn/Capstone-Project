from fastapi import APIRouter, HTTPException, status, Depends, Request
from typing import List, Optional
from pydantic import BaseModel, Field, validator
from datetime import datetime
from app.routes.Reports.UserActivity.userActivity import UserActivityLog
from app.utils.rbac import require_role
from app.supabase import postgrest_client, get_db
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.routes.Inventory.master_inventory import CategoryEnum

router = APIRouter()
limiter = Limiter(key_func=get_remote_address, default_limits=["10/minute"])

class InventorySettingBase(BaseModel):
    """Inventory settings with comprehensive validation"""
    name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Ingredient name (2-100 characters)"
    )
    default_unit: Optional[str] = Field(
        None,
        max_length=20,
        description="Default unit (e.g., kg, pcs, L)"
    )
    low_stock_threshold: Optional[int] = Field(
        None,
        ge=0,
        le=100000,
        description="Low stock threshold (0-100,000)"
    )
    category: Optional[CategoryEnum] = Field(
        None,
        description="Ingredient category from predefined list"
    )

    @validator('name')
    def validate_name(cls, v):
        """Ensure name doesn't contain only whitespace"""
        if not v or not v.strip():
            raise ValueError('Name cannot be empty or only whitespace')
        return v.strip()

    @validator('default_unit')
    def validate_default_unit(cls, v):
        """Validate and sanitize default unit"""
        if v is not None:
            v = v.strip()
            if len(v) == 0:
                return None
            if len(v) > 20:
                raise ValueError('Default unit cannot exceed 20 characters')
        return v

    @validator('low_stock_threshold')
    def validate_low_stock_threshold(cls, v):
        """Validate threshold range"""
        if v is not None:
            if v < 0:
                raise ValueError('Low stock threshold cannot be negative')
            if v > 100000:
                raise ValueError('Low stock threshold exceeds maximum (100,000)')
        return v


class InventorySettingCreate(InventorySettingBase):
    """Create inventory setting"""
    pass


class InventorySettingUpdate(InventorySettingBase):
    """Update inventory setting"""
    pass


class InventorySettingOut(InventorySettingBase):
    id: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True

@limiter.limit("10/minute")
@router.get("/inventory-settings", response_model=List[InventorySettingOut])
def get_inventory_settings(request: Request):
    try:
        response = (
            postgrest_client.table("inventory_settings")
            .select("*")
            .order("id", desc=False)
            .execute()
        )
        if not response.data:
            return []
        return [InventorySettingOut(**item) for item in response.data]
    except Exception as e:
        print("[ERROR /inventory-settings]", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/inventory-settings",
    response_model=InventorySettingOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_inventory_setting(
    request: Request,
    setting: InventorySettingCreate,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
    db=Depends(get_db),
):
    try:
        now = datetime.utcnow().isoformat()
        payload = setting.dict()
        payload["created_at"] = now
        payload["updated_at"] = now
        response = postgrest_client.table("inventory_settings").insert(payload).execute()
        if not response.data:
            raise HTTPException(
                status_code=400, detail="Inventory setting creation failed"
            )

        try:
            user_row = getattr(user, "user_row", user)
            new_activity = UserActivityLog(
                user_id=user_row.get("user_id"),
                action_type="create inventory setting",
                description=f"Created inventory setting: ({response.data[0].get('name')} | {response.data[0].get('category')} | {response.data[0].get('default_unit')} | {response.data[0].get('low_stock_threshold')})",
                activity_date=datetime.utcnow(),
                report_date=datetime.utcnow(),
                user_name=user_row.get("name"),
                role=user_row.get("user_role"),
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
async def update_inventory_setting(
    request: Request,
    setting_id: int,
    setting: InventorySettingUpdate,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
    db=Depends(get_db),
):
    try:
        update_data = setting.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow().isoformat()
        response = (
            postgrest_client.table("inventory_settings")
            .update(update_data)
            .eq("id", setting_id)
            .execute()
        )
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
                role=user_row.get("user_role"),
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
async def delete_inventory_setting(
    request: Request,
    setting_id: int,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
    db=Depends(get_db),
):
    try:
        response = (
            postgrest_client.table("inventory_settings").delete().eq("id", setting_id).execute()
        )
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
                role=user_row.get("user_role"),
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
