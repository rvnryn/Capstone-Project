from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, date
from pydantic import BaseModel
from app.supabase import supabase
from app.utils.rbac import require_role
from typing import Optional
def get_threshold_for_item(item_name: str) -> float:
    # Fetch threshold from inventory_settings table, fallback to 100 if not found
    try:
        response = supabase.table("inventory_settings").select("low_stock_threshold").eq("name", item_name).single().execute()
        threshold = response.data["low_stock_threshold"] if response.data and "low_stock_threshold" in response.data else None
        if threshold is not None:
            return float(threshold)
    except Exception as e:
        print("Error fetching threshold for", item_name, e)
    return 100.0

def calculate_stock_status(stock_quantity: float, threshold: float) -> str:
    """
    Calculate stock status based on quantity and threshold
    Returns: "Out Of Stock", "Critical", "Low", or "Normal"
    """
    if stock_quantity == 0:
        return "Out Of Stock"
    elif stock_quantity <= threshold * 0.5:
        # Critical: when stock is 50% or less of the threshold
        return "Critical"
    elif stock_quantity <= threshold:
        # Low: when stock is at or below threshold but above critical
        return "Low"
    else:
        # Normal: when stock is above threshold
        return "Normal"

router = APIRouter()

# Base model used for adding
class InventoryItemCreate(BaseModel):
    item_name: str
    batch_date: date | None = None
    category: str
    stock_status: str = "Normal"
    stock_quantity: float
    expiration_date: date | None = None

# Full model used for update/view
class InventoryItem(InventoryItemCreate):
    item_id: int
    created_at: str
    updated_at: str

class InventoryItemUpdate(BaseModel):
    item_name: Optional[str] = None
    batch_date: Optional[date] = None
    category: Optional[str] = None
    stock_status: Optional[str] = None
    stock_quantity: Optional[float] = None
    expiration_date: Optional[date] = None

class InventoryTodayItemCreate(BaseModel):
    item_id: int
    item_name: str
    batch_date: date | None = None
    category: str
    stock_status: str = "Normal"
    stock_quantity: float
    expiration_date: date | None = None
    created_at: str
    updated_at: str

class TransferRequest(BaseModel):
    quantity: float

class SurplusItemCreate(BaseModel):
    item_name: str
    batch_date: Optional[date] = None
    category: str
    stock_status: str = "Normal"
    stock_quantity: float
    expiration_date: Optional[date] = None

class SurplusItem(SurplusItemCreate):
    item_id: int
    created_at: str
    updated_at: str

class SurplusItemUpdate(BaseModel):
    item_name: Optional[str] = None
    batch_date: Optional[date] = None
    category: Optional[str] = None
    stock_status: Optional[str] = None
    stock_quantity: Optional[float] = None
    expiration_date: Optional[date] = None


@router.get("/inventory")
def list_inventory():
    try:
        items = supabase.table("inventory").select("*").execute()
        return items.data
    except Exception as e:
        print("Error:", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/inventory/{item_id}")
def get_inventory_item(item_id: int):
    try:
        response = supabase.table("inventory").select("*").eq("item_id", item_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Item not found")
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/inventory")
def add_inventory_item(
    item: InventoryItemCreate,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
):
    try:
        now = datetime.utcnow().isoformat()

        item_dict = item.dict()
        for key in ["batch_date", "expiration_date"]:
            if item_dict[key]:
                item_dict[key] = item_dict[key].isoformat()

        payload = {
            **item_dict,
            "created_at": now,
            "updated_at": now,
        }

        print("📦 Inserting cleaned payload:", payload)

        response = supabase.table("inventory").insert(payload).execute()
        print("✅ Insert response:", response)

        return {"message": "Item added successfully", "data": response.data}

    except Exception as e:
        print("🔥 Error during add_inventory_item:", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/inventory/{item_id}")
def update_inventory_item(
    item_id: int,
    item: InventoryItemUpdate,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
):
    try:
        update_data = item.dict(exclude_unset=True)

        for key in ["batch_date", "expiration_date"]:
            if key in update_data and update_data[key] is not None:
                update_data[key] = update_data[key].isoformat()

        # If stock_quantity is being updated, recalculate stock_status
        if "stock_quantity" in update_data:
            # Fetch the item to get the name for threshold lookup
            item_resp = supabase.table("inventory").select("item_name").eq("item_id", item_id).single().execute()
            item_name = item_resp.data["item_name"] if item_resp.data and "item_name" in item_resp.data else None
            if item_name:
                threshold = get_threshold_for_item(item_name)
                update_data["stock_status"] = calculate_stock_status(update_data["stock_quantity"], threshold)

        update_data["updated_at"] = datetime.utcnow().isoformat()

        response = supabase.table("inventory").update(update_data).eq("item_id", item_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Item not found")

        return {"message": "Item updated successfully"}
    except Exception as e:
        print("🔥 Error during update:", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/inventory/{item_id}")
def delete_inventory_item(
    item_id: int,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
):
    try:
        # Debug: Check if item exists
        check = supabase.table("inventory").select("item_id").eq("item_id", item_id).execute()
        print("Delete check:", check.data)
        if not check.data:
            raise HTTPException(status_code=404, detail="Item not found")

        response = supabase.table("inventory").delete().eq("item_id", item_id).execute()
        return {"message": "Item deleted successfully", "data": response.data}
    except Exception as e:
        print("🔥 Error deleting item:", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/inventory/{item_id}/transfer-to-today")
def transfer_to_today_inventory(item_id: int, req: TransferRequest):
    try:
        response = supabase.table("inventory").select("*").eq("item_id", item_id).single().execute()
        item = response.data
        if not item:
            raise HTTPException(status_code=404, detail="Item not found in inventory")

        transfer_quantity = req.quantity
        if transfer_quantity <= 0 or transfer_quantity > item["stock_quantity"]:
            raise HTTPException(status_code=400, detail="Invalid transfer quantity")

        # Fetch threshold and calculate new status for transfer
        threshold = get_threshold_for_item(item["item_name"])
        transfer_status = calculate_stock_status(transfer_quantity, threshold)

        now = datetime.utcnow().isoformat()
        payload = {
            "item_id": item["item_id"],
            "item_name": item["item_name"],
            "batch_date": item["batch_date"],
            "category": item["category"],
            "stock_status": transfer_status,
            "stock_quantity": transfer_quantity,
            "expiration_date": item.get("expiration_date"),
            "created_at": now,
            "updated_at": now,
        }

        # Insert into inventory_today
        insert_response = supabase.table("inventory_today").insert(payload).execute()

        # Update inventory stock and status for remaining item
        new_stock = item["stock_quantity"] - transfer_quantity
        if new_stock <= 0:
            # Delete item if stock is 0
            supabase.table("inventory").delete().eq("item_id", item_id).execute()
        else:
            new_status = calculate_stock_status(new_stock, threshold)
            supabase.table("inventory").update({"stock_quantity": new_stock, "stock_status": new_status, "updated_at": now}).eq("item_id", item_id).execute()

        return {"message": "Item transferred to Today's Inventory", "data": insert_response.data}
    except Exception as e:
        print("🔥 Error during transfer_to_today_inventory:", e)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/inventory-today")
def list_inventory_today():
    try:
        items = supabase.table("inventory_today").select("*").execute()
        return items.data
    except Exception as e:
        print("Error:", e)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/inventory-today/{item_id}")
def get_inventory_today_item(item_id: int):
    try:
        response = supabase.table("inventory_today").select("*").eq("item_id", item_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Item not found")
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

## removed duplicate broken header
@router.delete("/inventory-today/{item_id}")
def delete_inventory_today_item(
    item_id: int,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
):
    try:
        response = supabase.table("inventory_today").delete().eq("item_id", item_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Item not found")
        return {"message": "Item deleted successfully", "data": response.data}
    except Exception as e:
        print("🔥 Error deleting item from inventory_today:", e)
        raise HTTPException(status_code=500, detail=str(e))


## removed duplicate broken header
@router.put("/inventory-today/{item_id}")
def update_inventory_today_item(
    item_id: int,
    item: InventoryItemUpdate,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
):
    try:
        update_data = item.dict(exclude_unset=True)
        for key in ["batch_date", "expiration_date"]:
            if key in update_data and update_data[key] is not None:
                update_data[key] = update_data[key].isoformat()

        # If stock_quantity is being updated, recalculate stock_status
        if "stock_quantity" in update_data:
            # Fetch the item to get the name for threshold lookup
            item_resp = supabase.table("inventory_today").select("item_name").eq("item_id", item_id).single().execute()
            item_name = item_resp.data["item_name"] if item_resp.data and "item_name" in item_resp.data else None
            if item_name:
                threshold = get_threshold_for_item(item_name)
                update_data["stock_status"] = calculate_stock_status(update_data["stock_quantity"], threshold)

        update_data["updated_at"] = datetime.utcnow().isoformat()
        response = supabase.table("inventory_today").update(update_data).eq("item_id", item_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Item not found")
        return {"message": "Item updated successfully"}
    except Exception as e:
        print("🔥 Error during update:", e)
        raise HTTPException(status_code=500, detail=str(e))


## removed duplicate broken header
@router.post("/inventory-today/{item_id}/transfer-to-surplus")
def transfer_to_today(item_id: int):

    try:
        # Get the item from inventory_today
        response = supabase.table("inventory_today").select("*").eq("item_id", item_id).single().execute()
        item = response.data
        if not item:
            raise HTTPException(status_code=404, detail="Item not found in inventory_today")

        now = datetime.utcnow().isoformat()
        payload = {
            "item_name": item["item_name"],
            "batch_date": item["batch_date"],
            "category": item["category"],
            "stock_status": item["stock_status"],
            "stock_quantity": item["stock_quantity"],
            "expiration_date": item.get("expiration_date"),
            "created_at": now,
            "updated_at": now,
        }

        # Insert into inventory_surplus
        insert_response = supabase.table("inventory_surplus").insert(payload).execute()

        # Delete from inventory_today
        supabase.table("inventory_today").delete().eq("item_id", item_id).execute()

        return {"message": "Item transferred to Surplus", "data": insert_response.data}
    except Exception as e:
        print("🔥 Error during transfer_to_surplus:", e)
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/inventory-surplus")
def list_surplus():
    try:
        items = supabase.table("inventory_surplus").select("*").execute()
        return items.data
    except Exception as e:
        print("Error:", e)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/inventory-surplus/{item_id}")
def get_surplus_item(item_id: int):
    try:
        response = supabase.table("inventory_surplus").select("*").eq("item_id", item_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Item not found")
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

## removed duplicate broken header
@router.post("/inventory-surplus")
def add_surplus_item(
    item: SurplusItemCreate,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
):
    try:
        now = datetime.utcnow().isoformat()
        item_dict = item.dict()
        for key in ["batch_date", "expiration_date"]:
            if item_dict[key]:
                item_dict[key] = item_dict[key].isoformat()
        payload = {
            **item_dict,
            "created_at": now,
            "updated_at": now,
        }
        response = supabase.table("inventory_surplus").insert(payload).execute()
        return {"message": "Surplus item added successfully", "data": response.data}
    except Exception as e:
        print("🔥 Error during add_surplus_item:", e)
        raise HTTPException(status_code=500, detail=str(e))


## removed duplicate broken header
@router.put("/inventory-surplus/{item_id}")
def update_surplus_item(
    item_id: int,
    item: SurplusItemUpdate,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
):
    try:
        update_data = item.dict(exclude_unset=True)
        for key in ["batch_date", "expiration_date"]:
            if key in update_data and update_data[key] is not None:
                update_data[key] = update_data[key].isoformat()

        # If stock_quantity is being updated, recalculate stock_status
        if "stock_quantity" in update_data:
            # Fetch the item to get the name for threshold lookup
            item_resp = supabase.table("inventory_surplus").select("item_name").eq("item_id", item_id).single().execute()
            item_name = item_resp.data["item_name"] if item_resp.data and "item_name" in item_resp.data else None
            if item_name:
                threshold = get_threshold_for_item(item_name)
                update_data["stock_status"] = calculate_stock_status(update_data["stock_quantity"], threshold)

        update_data["updated_at"] = datetime.utcnow().isoformat()
        response = supabase.table("inventory_surplus").update(update_data).eq("item_id", item_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Item not found")
        return {"message": "Surplus item updated successfully"}
    except Exception as e:
        print("🔥 Error during update_surplus_item:", e)
        raise HTTPException(status_code=500, detail=str(e))

## removed duplicate broken header
@router.delete("/inventory-surplus/{item_id}")
def delete_surplus_item(
    item_id: int,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
):
    try:
        response = supabase.table("inventory_surplus").delete().eq("item_id", item_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Item not found")
        return {"message": "Surplus item deleted successfully", "data": response.data}
    except Exception as e:
        print("🔥 Error deleting surplus item:", e)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/transfer-to-surplus/{item_id}/inventory-today")
def transfer_to_surplus(item_id: int):
    
    try:
        # Get the item from inventory_today
        response = supabase.table("inventory_surplus").select("*").eq("item_id", item_id).single().execute()
        item = response.data
        if not item:
            raise HTTPException(status_code=404, detail="Item not found in inventory_today")

        now = datetime.utcnow().isoformat()
        payload = {
            "item_name": item["item_name"],
            "batch_date": item["batch_date"],
            "category": item["category"],
            "stock_status": item["stock_status"],
            "stock_quantity": item["stock_quantity"],
            "expiration_date": item.get("expiration_date"),
            "created_at": now,
            "updated_at": now,
        }

        # Insert into inventory_surplus
        insert_response = supabase.table("inventory_today").insert(payload).execute()

        # Delete from inventory_today
        supabase.table("inventory_surplus").delete().eq("item_id", item_id).execute()

        return {"message": "Item transferred to today's", "data": insert_response.data}
    except Exception as e:
        print("🔥 Error during transfer_to_surplus:", e)
        raise HTTPException(status_code=500, detail=str(e))




