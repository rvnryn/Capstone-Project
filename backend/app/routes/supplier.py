from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from pydantic import BaseModel
from app.supabase import supabase, get_db
from typing import Optional
from datetime import datetime
from app.routes.userActivity import UserActivityLog
from app.utils.rbac import require_role
router = APIRouter()

class SupplierCreate(BaseModel):
    supplier_name: str
    contact_person: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    supplies: Optional[str] = None  # Added supplies field

class Supplier(SupplierCreate):
    supplier_id: int
    created_at: str
    updated_at: str

class SupplierUpdate(BaseModel):
    supplier_name: Optional[str] = None
    contact_person: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    supplies: Optional[str] = None  # Added supplies field

@router.get("/suppliers")
def list_suppliers():
    try:
        items = supabase.table("suppliers").select("*").execute()
        return items.data
    except Exception as e:
        print("Error:", e)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/suppliers/{supplier_id}")
def get_supplier(supplier_id: int):
    try:
        response = supabase.table("suppliers").select("*").eq("supplier_id", supplier_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Supplier not found")
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/suppliers")
async def add_supplier(supplier: SupplierCreate, user=Depends(require_role("Owner", "General Manager", "Store Manager")), db=Depends(get_db)):
    try:
        now = datetime.utcnow().isoformat()
        payload = {
            "supplier_name": supplier.supplier_name,
            "contact_person": supplier.contact_person,
            "phone_number": supplier.phone_number,
            "supplies": supplier.supplies,
            "email": supplier.email,
            "address": supplier.address,
            "created_at": now,
            "updated_at": now,
        }
        response = supabase.table("suppliers").insert(payload).execute()
        try:
            user_row = getattr(user, "user_row", user)
            new_activity = UserActivityLog(
                user_id=user_row.get("user_id"),
                action_type="add supplier",
                description=f"Added supplier: {supplier.supplier_name}",
                activity_date=datetime.utcnow(),
                report_date=datetime.utcnow(),
                user_name=user_row.get("name"),
                role=user_row.get("user_role")
        )
            db.add(new_activity)
            await db.flush()
            await db.commit()
            print("Supplier add activity logged successfully.")
        except Exception as e:
            print("Failed to record supplier add activity:", e)
        
        return {"message": "Supplier added successfully", "data": response.data}
    except Exception as e:
        print("🔥 Error during add_supplier:", e)
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/suppliers/{supplier_id}")
async def update_supplier(supplier_id: int, supplier: SupplierUpdate, user=Depends(require_role("Owner", "General Manager", "Store Manager")), db=Depends(get_db)):
    try:
        update_data = supplier.dict(exclude_unset=True)
        # If address is present, move it to "Address"
        if "address" in update_data:
            update_data["address"] = update_data["address"]
            update_data.pop("address")
        update_data["updated_at"] = datetime.utcnow().isoformat()
        response = supabase.table("suppliers").update(update_data).eq("supplier_id", supplier_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Supplier not found")
        
        try:
            user_row = getattr(user, "user_row", user)
            new_activity = UserActivityLog(
                user_id=user_row.get("user_id"),
                action_type="update supplier",
                description=f"Updated supplier: {supplier.supplier_name}",
                activity_date=datetime.utcnow(),
                report_date=datetime.utcnow(),
                user_name=user_row.get("name"),
                role=user_row.get("user_role")
        )
            db.add(new_activity)
            await db.flush()
            await db.commit()
            print("Supplier update activity logged successfully.")
        except Exception as e:
            print("Failed to record supplier update activity:", e)

        return {"message": "Supplier updated successfully"}
    except Exception as e:
        print("🔥 Error during update_supplier:", e)
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/suppliers/{supplier_id}")
async def delete_supplier(supplier_id: int, user=Depends(require_role("Owner", "General Manager", "Store Manager")), db=Depends(get_db)):
    try:
        check = supabase.table("suppliers").select("supplier_id, supplier_name").eq("supplier_id", supplier_id).execute()
        if not check.data:
            raise HTTPException(status_code=404, detail="Supplier not found")
        supplier_name = check.data[0]["supplier_name"]
        supplier_id_val = check.data[0]["supplier_id"]
        response = supabase.table("suppliers").delete().eq("supplier_id", supplier_id).execute()

        try:
            user_row = getattr(user, "user_row", user)
            new_activity = UserActivityLog(
                user_id=user_row.get("user_id"),
                action_type="delete supplier",
                description=f"Deleted supplier: (ID: {supplier_id_val} | Name: {supplier_name})",
                activity_date=datetime.utcnow(),
                report_date=datetime.utcnow(),
                user_name=user_row.get("name"),
                role=user_row.get("user_role")
            )
            db.add(new_activity)
            await db.flush()
            await db.commit()
            print("Supplier delete activity logged successfully.")
        except Exception as e:
            print("Failed to record supplier delete activity:", e)

        return {"message": "Supplier deleted successfully", "data": response.data}
    except Exception as e:
        print("🔥 Error deleting supplier:", e)
        raise HTTPException(status_code=500, detail=str(e))