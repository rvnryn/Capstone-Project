from fastapi import APIRouter, HTTPException
from datetime import datetime
from pydantic import BaseModel
from app.supabase import supabase
from typing import Optional

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
def add_supplier(supplier: SupplierCreate):
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
        return {"message": "Supplier added successfully", "data": response.data}
    except Exception as e:
        print("🔥 Error during add_supplier:", e)
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/suppliers/{supplier_id}")
def update_supplier(supplier_id: int, supplier: SupplierUpdate):
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
        return {"message": "Supplier updated successfully"}
    except Exception as e:
        print("🔥 Error during update_supplier:", e)
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/suppliers/{supplier_id}")
def delete_supplier(supplier_id: int):
    try:
        check = supabase.table("suppliers").select("supplier_id").eq("supplier_id", supplier_id).execute()
        if not check.data:
            raise HTTPException(status_code=404, detail="Supplier not found")
        response = supabase.table("suppliers").delete().eq("supplier_id", supplier_id).execute()
        return {"message": "Supplier deleted successfully", "data": response.data}
    except Exception as e:
        print("🔥 Error deleting supplier:", e)
        raise HTTPException(status_code=500, detail=str(e))