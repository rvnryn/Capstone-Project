from fastapi import APIRouter, HTTPException, Depends, Query, Request, Body
from datetime import datetime
from typing import Optional
# Import shared helpers from master_inventory
from app.routes.Inventory.master_inventory import (
	run_blocking,
	get_threshold_for_item,
	calculate_stock_status,
	postgrest_client,
	get_db,
	UserActivityLog,
	require_role,
	limiter,
	logger,
)
from pydantic import BaseModel
from app.routes.Inventory.master_inventory import repeat_every

router = APIRouter()

class SpoilageRequest(BaseModel):
	quantity: float
	reason: Optional[str] = None
	unit_price: Optional[float] = None

def log_user_activity(db, user, action_type, description):
    try:
        user_row = getattr(user, "user_row", user)
        new_activity = UserActivityLog(
            user_id=user_row.get("user_id"),
            action_type=action_type,
            description=description,
            activity_date=datetime.utcnow(),
            report_date=datetime.utcnow(),
            user_name=user_row.get("name"),
            role=user_row.get("user_role"),
        )
        db.add(new_activity)
        db.flush()
        db.commit()
    except Exception as e:
        logger.warning(f"Failed to record user activity ({action_type}): {e}")
		
@limiter.limit("10/minute")
@router.get("/inventory-spoilage")
async def list_spoilage(
	request: Request,
	skip: int = Query(0, ge=0),
	limit: int = Query(20, le=100),
):
	try:
		@run_blocking
		def _fetch():
			return (
				postgrest_client.table("inventory_spoilage")
				.select("*")
				.range(skip, skip + limit - 1)
				.execute()
			)
		items = await _fetch()
		return items.data
	except Exception as e:
		logger.exception("Error listing inventory_spoilage")
		raise HTTPException(status_code=500, detail="Internal server error")


@limiter.limit("10/minute")
@router.post("/inventory/{item_id}/{batch_date}/transfer-to-spoilage")
async def transfer_to_spoilage(
	request: Request,
	item_id: int,
	batch_date: str,
	req: SpoilageRequest = Body(...),
	user=Depends(require_role("Owner", "General Manager", "Store Manager")),
	db=Depends(get_db),
):
	try:
		@run_blocking
		def _fetch():
			return (
				postgrest_client.table("inventory")
				.select("*")
				.eq("item_id", item_id)
				.eq("batch_date", batch_date)
				.single()
				.execute()
			)
		response = await _fetch()
		item = response.data
		if not item:
			raise HTTPException(status_code=404, detail="Item not found in inventory")
		spoil_quantity = req.quantity
		if spoil_quantity <= 0 or spoil_quantity > item["stock_quantity"]:
			raise HTTPException(status_code=400, detail="Invalid spoilage quantity")
		now = datetime.utcnow().isoformat()
		# Insert into inventory_spoilage
		spoilage_payload = {
			"item_id": item["item_id"],
			"item_name": item["item_name"],
			"quantity_spoiled": spoil_quantity,
			"spoilage_date": now[:10],
			"reason": req.reason,
			"user_id": getattr(user, "user_row", user).get("user_id"),
			"batch_date": batch_date,
			"expiration_date": item.get("expiration_date"),
			"category": item.get("category"),
			"created_at": now,
			"updated_at": now,
			"unit_price": item.get("unit_price"),
		}
		# Ensure spoilage_id is never set in the insert payload
		if "spoilage_id" in spoilage_payload:
			del spoilage_payload["spoilage_id"]
		@run_blocking
		def _insert_spoilage():
			return (
				postgrest_client.table("inventory_spoilage").insert(spoilage_payload).execute()
			)
		spoilage_response = await _insert_spoilage()
		# Update or delete inventory
		new_stock = item["stock_quantity"] - spoil_quantity
		if spoil_quantity >= item["stock_quantity"] or new_stock <= 0:
			# Delete the item from master inventory
			@run_blocking
			def _delete_item():
				return (
					postgrest_client.table("inventory")
					.delete()
					.eq("item_id", item_id)
					.eq("batch_date", batch_date)
					.execute()
				)
			await _delete_item()
		else:
			threshold = await get_threshold_for_item(item["item_name"])
			new_status = calculate_stock_status(new_stock, threshold)
			@run_blocking
			def _update():
				return (
					postgrest_client.table("inventory")
					.update(
						{
							"stock_quantity": new_stock,
							"stock_status": new_status,
							"updated_at": now,
						}
					)
					.eq("item_id", item_id)
					.eq("batch_date", batch_date)
					.execute()
				)
			await _update()
		await log_user_activity(
			db,
			user,
			"transfer inventory to spoilage",
			f"Transferred {spoil_quantity} of Id {item['item_id']} | item {item['item_name']} (Batch {batch_date}) to Spoilage. Reason: {req.reason or 'N/A'}",
		)
		return {
			"message": "Item transferred to Spoilage",
			"data": spoilage_response.data,
		}
	except Exception as e:
		logger.exception("Error during transfer_to_spoilage")
		raise HTTPException(status_code=500, detail="Internal server error")

@limiter.limit("10/minute")
@router.delete("/inventory-spoilage/{spoilage_id}")
async def delete_spoilage_item(
	request: Request,
	spoilage_id: int,
	user=Depends(require_role("Owner", "General Manager", "Store Manager")),
	db=Depends(get_db),
):
	try:
		@run_blocking
		def _delete():
			return (
				postgrest_client.table("inventory_spoilage")
				.delete()
				.eq("spoilage_id", spoilage_id)
				.execute()
			)
		response = await _delete()
		if not response.data:
			raise HTTPException(status_code=404, detail="Spoilage record not found")
		await log_user_activity(
			db,
			user,
			"delete spoilage inventory",
			f"Deleted spoilage inventory record: {spoilage_id}",
		)
		return {"message": "Spoilage record deleted successfully", "data": response.data}
	except HTTPException:
		raise
	except Exception as e:
		logger.exception("Error deleting spoilage record")
		raise HTTPException(status_code=500, detail="Internal server error")