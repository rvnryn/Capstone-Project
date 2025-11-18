from fastapi import APIRouter, HTTPException, Depends, Query, Request, Body
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, validator

from postgrest import APIError
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
	log_user_activity,
)
from app.routes.Inventory.master_inventory import repeat_every
from app.routes.General.notification import create_notification  # Import notification function

router = APIRouter()

class SpoilageRequest(BaseModel):
	"""Spoilage transfer request with comprehensive validation"""
	quantity: float = Field(
		...,
		gt=0,
		description="Spoilage quantity (must be > 0)"
	)
	reason: Optional[str] = Field(
		None,
		max_length=500,
		description="Reason for spoilage (max 500 characters)"
	)
	unit_cost: Optional[float] = Field(
		None,
		ge=0,
		description="Unit cost in pesos (must be >= 0)"
	)

	@validator('quantity')
	def validate_quantity(cls, v):
		if v <= 0:
			raise ValueError('Spoilage quantity must be greater than 0')
		if v > 1000000:
			raise ValueError('Spoilage quantity exceeds maximum allowed (1,000,000)')
		return v

	@validator('reason')
	def validate_reason(cls, v):
		"""Trim whitespace and validate reason"""
		if v is not None:
			v = v.strip()
			if len(v) == 0:
				return None  # Empty reason becomes None
			if len(v) > 500:
				raise ValueError('Reason cannot exceed 500 characters')
		return v

	@validator('unit_cost')
	def validate_unit_cost(cls, v):
		"""Validate unit cost range"""
		if v is not None:
			if v < 0:
				raise ValueError('Unit cost cannot be negative')
			if v > 1000000:
				raise ValueError('Unit cost exceeds maximum allowed (₱1,000,000)')
		return v


@limiter.limit("10/minute")
@router.get("/inventory-spoilage")
async def list_spoilage(
	request: Request,
	skip: int = Query(0, ge=0),
	limit: int = Query(20, le=100),
):
	try:
		@run_blocking
		def _fetch_spoilage():
			return (
				postgrest_client.table("inventory_spoilage")
				.select("*")
				.order("batch_date", desc=False)
				.range(skip, skip + limit - 1)
				.execute()
			)
		
		@run_blocking
		def _fetch_settings():
			return (
				postgrest_client.table("inventory_settings")
				.select("name, default_unit")
				.execute()
			)
		
		spoilage_items = await _fetch_spoilage()
		
		# Create a lookup dictionary for settings by item_name (case-insensitive, trimmed)
		settings_map = {}
		try:
			settings_response = await _fetch_settings()
			if settings_response and hasattr(settings_response, 'data') and settings_response.data:
				logger.info(f"[SPOILAGE DEBUG] Fetched {len(settings_response.data)} inventory settings")
				for setting in settings_response.data:
					if setting and "name" in setting:
						item_name = setting["name"]
						default_unit = setting.get("default_unit", "")
						# Store with both original and normalized keys for flexible matching
						settings_map[item_name] = default_unit
						# Also store lowercase trimmed version for case-insensitive lookup
						normalized_key = item_name.strip().lower()
						settings_map[normalized_key] = default_unit
						logger.info(f"[SPOILAGE DEBUG] Mapped '{item_name}' (normalized: '{normalized_key}') -> '{default_unit}'")
		except Exception as settings_error:
			logger.warning(f"Could not fetch inventory_settings: {settings_error}")
			# Continue without settings, items will have empty units
		
		# Enrich spoilage items with unit from settings
		enriched_items = []
		if spoilage_items and hasattr(spoilage_items, 'data') and spoilage_items.data:
			for item in spoilage_items.data:
				enriched = {**item}
				item_name = item.get("item_name", "")
				
				# Try exact match first
				matched_unit = settings_map.get(item_name, "")
				
				# If no match, try normalized (case-insensitive, trimmed) match
				if not matched_unit and item_name:
					normalized_name = item_name.strip().lower()
					matched_unit = settings_map.get(normalized_name, "")
				
				enriched["unit"] = matched_unit
				enriched["default_unit"] = matched_unit
				logger.info(f"[SPOILAGE DEBUG] Item '{item_name}' matched unit: '{matched_unit}' (empty={not bool(matched_unit)})")
				enriched_items.append(enriched)
		
		return enriched_items
	except Exception as e:
		logger.exception("Error listing inventory_spoilage")
		raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@limiter.limit("10/minute")
@router.get("/inventory-spoilage/{spoilage_id}")
async def get_spoilage_item(
	request: Request,
	spoilage_id: int,
):
	try:
		@run_blocking
		def _fetch():
			return (
				postgrest_client.table("inventory_spoilage")
				.select("*")
				.eq("spoilage_id", spoilage_id)
				.single()
				.execute()
			)
		
		@run_blocking
		def _fetch_settings():
			return (
				postgrest_client.table("inventory_settings")
				.select("name, default_unit")
				.execute()
			)
		
		try:
			spoilage_item = await _fetch()
			if not spoilage_item.data:
				raise HTTPException(status_code=404, detail="Spoilage item not found")
		except APIError as e:
			if getattr(e, "code", None) == "PGRST116":
				raise HTTPException(status_code=404, detail="Spoilage item not found")
			raise
		
		# Get unit from settings
		item = spoilage_item.data
		matched_unit = ""
		
		try:
			settings_response = await _fetch_settings()
			if settings_response and hasattr(settings_response, 'data') and settings_response.data:
				item_name = item.get("item_name", "")
				for setting in settings_response.data:
					if setting and "name" in setting:
						setting_name = setting["name"]
						# Try exact match or case-insensitive match
						if setting_name == item_name or setting_name.strip().lower() == item_name.strip().lower():
							matched_unit = setting.get("default_unit", "")
							break
		except Exception as settings_error:
			logger.warning(f"Could not fetch inventory_settings: {settings_error}")
		
		# Enrich item with unit
		enriched = {**item}
		enriched["unit"] = matched_unit
		enriched["default_unit"] = matched_unit
		
		return enriched
	except HTTPException:
		raise
	except Exception as e:
		logger.exception("Error fetching spoilage item")
		raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


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
		try:
			response = await _fetch()
			if not response.data:
				raise HTTPException(status_code=404, detail="Inventory item not found for spoilage transfer")
		except APIError as e:
			if getattr(e, "code", None) == "PGRST116":
				raise HTTPException(status_code=404, detail="Inventory item not found for spoilage transfer")
			raise
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
			"unit_cost": item.get("unit_cost", 0.00),
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

		# Create notification for spoilage transfer
		try:
			user_row = getattr(user, "user_row", user)
			user_id = user_row.get("user_id") if isinstance(user_row, dict) else getattr(user_row, "user_id", None)
			if user_id:
				create_notification(
					user_id=user_id,
					type="transfer",
					message=f"Spoilage: {spoil_quantity} units of {item['item_name']} transferred to spoilage. Reason: {req.reason or 'N/A'}"
				)
		except Exception as e:
			logger.warning(f"Failed to create spoilage notification: {e}")

		return {
			"message": "Item transferred to Spoilage",
			"data": spoilage_response.data,
		}
	except HTTPException as he:
		# Re-raise HTTPException so FastAPI returns correct status
		raise he
	except Exception as e:
		logger.exception("Error during transfer_to_spoilage")
		raise HTTPException(status_code=500, detail="Internal server error")

# Transfer from Today Inventory
@limiter.limit("10/minute")
@router.post("/inventory-today/{item_id}/{batch_date}/transfer-to-spoilage")
async def transfer_today_to_spoilage(
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
				postgrest_client.table("inventory_today")
				.select("*")
				.eq("item_id", item_id)
				.eq("batch_date", batch_date)
				.single()
				.execute()
			)
		try:
			response = await _fetch()
			if not response.data:
				raise HTTPException(status_code=404, detail="Today Inventory item not found for spoilage transfer")
		except APIError as e:
			if getattr(e, "code", None) == "PGRST116":
				raise HTTPException(status_code=404, detail="Today Inventory item not found for spoilage transfer")
			raise
		item = response.data
		if not item:
			raise HTTPException(status_code=404, detail="Item not found in today inventory")
		spoil_quantity = req.quantity
		if spoil_quantity <= 0 or spoil_quantity > item["stock_quantity"]:
			raise HTTPException(status_code=400, detail="Invalid spoilage quantity")
		now = datetime.utcnow().isoformat()
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
			"unit_cost": item.get("unit_cost", 0.00),
		}
		if "spoilage_id" in spoilage_payload:
			del spoilage_payload["spoilage_id"]
		@run_blocking
		def _insert_spoilage():
			return (
				postgrest_client.table("inventory_spoilage").insert(spoilage_payload).execute()
			)
		spoilage_response = await _insert_spoilage()
		new_stock = item["stock_quantity"] - spoil_quantity
		if spoil_quantity >= item["stock_quantity"] or new_stock <= 0:
			@run_blocking
			def _delete_item():
				return (
					postgrest_client.table("inventory_today")
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
					postgrest_client.table("inventory_today")
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
			"transfer today inventory to spoilage",
			f"Transferred {spoil_quantity} of Id {item['item_id']} | item {item['item_name']} (Batch {batch_date}) to Spoilage. Reason: {req.reason or 'N/A'}",
		)
		try:
			user_row = getattr(user, "user_row", user)
			user_id = user_row.get("user_id") if isinstance(user_row, dict) else getattr(user_row, "user_id", None)
			if user_id:
				create_notification(
					user_id=user_id,
					type="transfer",
					message=f"Spoilage: {spoil_quantity} units of {item['item_name']} transferred to spoilage. Reason: {req.reason or 'N/A'}"
				)
		except Exception as e:
			logger.warning(f"Failed to create spoilage notification: {e}")
		return {
			"message": "Today Inventory item transferred to Spoilage",
			"data": spoilage_response.data,
		}
	except HTTPException as he:
		raise he
	except Exception as e:
		logger.exception("Error during transfer_today_to_spoilage")
		raise HTTPException(status_code=500, detail="Internal server error")

# Transfer from Surplus Inventory
@limiter.limit("10/minute")
@router.post("/inventory-surplus/{item_id}/{batch_date}/transfer-to-spoilage")
async def transfer_surplus_to_spoilage(
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
				postgrest_client.table("inventory_surplus")
				.select("*")
				.eq("item_id", item_id)
				.eq("batch_date", batch_date)
				.single()
				.execute()
			)
		try:
			response = await _fetch()
			if not response.data:
				raise HTTPException(status_code=404, detail="Surplus Inventory item not found for spoilage transfer")
		except APIError as e:
			if getattr(e, "code", None) == "PGRST116":
				raise HTTPException(status_code=404, detail="Surplus Inventory item not found for spoilage transfer")
			raise
		item = response.data
		if not item:
			raise HTTPException(status_code=404, detail="Item not found in surplus inventory")
		spoil_quantity = req.quantity
		if spoil_quantity <= 0 or spoil_quantity > item["stock_quantity"]:
			raise HTTPException(status_code=400, detail="Invalid spoilage quantity")
		now = datetime.utcnow().isoformat()
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
			"unit_cost": item.get("unit_cost", 0.00),
		}
		if "spoilage_id" in spoilage_payload:
			del spoilage_payload["spoilage_id"]
		@run_blocking
		def _insert_spoilage():
			return (
				postgrest_client.table("inventory_spoilage").insert(spoilage_payload).execute()
			)
		spoilage_response = await _insert_spoilage()
		new_stock = item["stock_quantity"] - spoil_quantity
		if spoil_quantity >= item["stock_quantity"] or new_stock <= 0:
			@run_blocking
			def _delete_item():
				return (
					postgrest_client.table("inventory_surplus")
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
					postgrest_client.table("inventory_surplus")
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
			"transfer surplus inventory to spoilage",
			f"Transferred {spoil_quantity} of Id {item['item_id']} | item {item['item_name']} (Batch {batch_date}) to Spoilage. Reason: {req.reason or 'N/A'}",
		)
		try:
			user_row = getattr(user, "user_row", user)
			user_id = user_row.get("user_id") if isinstance(user_row, dict) else getattr(user_row, "user_id", None)
			if user_id:
				create_notification(
					user_id=user_id,
					type="transfer",
					message=f"Spoilage: {spoil_quantity} units of {item['item_name']} transferred to spoilage. Reason: {req.reason or 'N/A'}"
				)
		except Exception as e:
			logger.warning(f"Failed to create spoilage notification: {e}")
		return {
			"message": "Surplus Inventory item transferred to Spoilage",
			"data": spoilage_response.data,
		}
	except HTTPException as he:
		raise he
	except Exception as e:
		logger.exception("Error during transfer_surplus_to_spoilage")
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