from fastapi import APIRouter
from pydantic import BaseModel
from fastapi_utils.tasks import repeat_every
from datetime import datetime, timedelta
from app.supabase import postgrest_client
import logging
import asyncio
from postgrest.exceptions import APIError
router = APIRouter()

from app.supabase import SyncSessionLocal

from app.routes.Inventory.master_inventory import (
    run_blocking,
    get_threshold_for_item,
    calculate_stock_status,
    postgrest_client,
    UserActivityLog,
    logger,
)

class TransferRequest(BaseModel):
    quantity: float

def log_user_activity(db, user, action_type, description):
    if db is None:
        logger.warning("No DB session provided for user activity log; skipping log.")
        return
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

async def wait_until_6am():
    now = datetime.now()
    today_6am = datetime.combine(now.date(), datetime.min.time()) + timedelta(hours=2, minutes=48)
    if now >= today_6am:
        today_6am += timedelta(days=1)
    seconds_until_6am = (today_6am - now).total_seconds()
    await asyncio.sleep(seconds_until_6am)

async def wait_until_10pm():
    now = datetime.now()
    today_10pm = datetime.combine(now.date(), datetime.min.time()) + timedelta(hours=2, minutes=38)
    if now >= today_10pm:
        today_10pm += timedelta(days=1)
    seconds_until_10pm = (today_10pm - now).total_seconds()
    await asyncio.sleep(seconds_until_10pm)

# @router.on_event("startup")
# @repeat_every(seconds=86400)  # Run every 24 hours
# async def auto_transfer_master_to_today_top_selling() -> None:
#     try:
#         # Wait until 6am before first run (same as surplus-to-today)
#         await wait_until_6am()
#         now = datetime.utcnow().isoformat()
#         today = datetime.utcnow().date()

#         # 1. Get top selling menu items from sales in the last 7 days
#         @run_blocking
#         def _fetch_top_selling():
#             sales_res = postgrest_client.table("sales") \
#                 .select("menu_id,quantity_sold") \
#                 .gte("sale_date", (today - timedelta(days=7)).isoformat()) \
#                 .execute()
#             sales_data = sales_res.data or []
#             from collections import Counter
#             counter = Counter()
#             for sale in sales_data:
#                 counter[sale["menu_id"]] += sale.get("quantity_sold", 0)
#             top_menu_ids = [menu_id for menu_id, _ in counter.most_common(5)]
#             return top_menu_ids

#         top_menu_ids = await _fetch_top_selling()

#         # 2. For each top menu, get required ingredients and quantities
#         for menu_id in top_menu_ids:
#             @run_blocking
#             def _fetch_ingredients():
#                 res = postgrest_client.table("menu_ingredients") \
#                     .select("*") \
#                     .eq("menu_id", menu_id) \
#                     .execute()
#                 return res.data or []
#             ingredients = await _fetch_ingredients()

#             for ing in ingredients:
#                 item_id = ing.get("ingredient_id")
#                 qty_needed = ing.get("qty_per_portion", 1) * 10  # Example: enough for 10 portions

#                 # Fetch all batches FIFO
#                 @run_blocking
#                 def _fetch_master_batches():
#                     res = postgrest_client.table("inventory") \
#                         .select("*") \
#                         .eq("item_id", item_id) \
#                         .order("batch_date", asc=True) \
#                         .execute()
#                     return res.data or []
#                 master_batches = await _fetch_master_batches()

#                 qty_to_transfer = qty_needed
#                 for master_item in master_batches:
#                     if qty_to_transfer <= 0:
#                         break
#                     available_qty = master_item.get("stock_quantity", 0)
#                     transfer_quantity = min(qty_to_transfer, available_qty)
#                     if transfer_quantity <= 0:
#                         continue

#                     threshold = await get_threshold_for_item(master_item["item_name"])
#                     transfer_status = calculate_stock_status(transfer_quantity, threshold)
#                     payload = {
#                         "item_id": master_item["item_id"],
#                         "item_name": master_item["item_name"],
#                         "batch_date": master_item.get("batch_date"),
#                         "category": master_item.get("category"),
#                         "stock_status": transfer_status,
#                         "stock_quantity": transfer_quantity,
#                         "expiration_date": master_item.get("expiration_date"),
#                         "updated_at": now,
#                         "unit_price": master_item.get("unit_price"),
#                         "created_at": now,
#                     }

#                     # Upsert to today inventory
#                     @run_blocking
#                     def _upsert_today():
#                         return (
#                             postgrest_client.table("inventory_today")
#                             .upsert([payload], on_conflict=["item_id", "batch_date"])
#                             .execute()
#                         )
#                     await _upsert_today()

#                     # Deduct from master inventory
#                     new_master_qty = available_qty - transfer_quantity
#                     @run_blocking
#                     def _update_master():
#                         return postgrest_client.table("inventory") \
#                             .update({"stock_quantity": new_master_qty}) \
#                             .eq("item_id", master_item["item_id"]) \
#                             .eq("batch_date", master_item.get("batch_date")) \
#                             .execute()
#                     await _update_master()

#                     # Log activity
#                     db = SyncSessionLocal()
#                     try:
#                         description = (
#                             f"Auto-transferred {transfer_quantity} of Id {master_item['item_id']} | item {master_item['item_name']} "
#                             f"from master inventory to today inventory for top selling menu {menu_id} at 6am."
#                         )
#                         log_user_activity(
#                             db=db,
#                             user={"user_id": 0, "name": "System", "user_role": "System"},
#                             action_type="auto transfer master to today for top selling",
#                             description=description,
#                         )
#                     finally:
#                         db.close()

#                     qty_to_transfer -= transfer_quantity
#         logger.info(f"Auto transfer from master inventory to today for top selling menus completed at {now}")
#     except Exception as e:
#         logger.exception("Error in scheduled auto transfer from master to today for top selling menus")

@router.on_event("startup")
@repeat_every(seconds=86400)  # Run every 24 hours
async def auto_transfer_surplus_to_today() -> None:
    try:
        # Wait until 6am before first run
        await wait_until_6am()
        now = datetime.utcnow().isoformat()

        @run_blocking
        def _fetch_all():
            return (
                postgrest_client.table("inventory_surplus")
                .select("*")
                .execute()
            )

        items_response = await _fetch_all()
        items = items_response.data or []
        for item in items:
            transfer_quantity = item.get("stock_quantity", 0)
            if transfer_quantity <= 0:
                continue
            threshold = await get_threshold_for_item(item["item_name"])
            transfer_status = calculate_stock_status(transfer_quantity, threshold)
            batch_date_str = str(item.get("batch_date")) if item.get("batch_date") else None
            payload = {
                "item_id": item["item_id"],
                "item_name": item["item_name"],
                "batch_date": batch_date_str,
                "category": item.get("category"),
                "stock_status": transfer_status,
                "stock_quantity": transfer_quantity,
                "expiration_date": item.get("expiration_date"),
                "updated_at": now,
                "unit_price": item.get("unit_price"),
                "created_at": now,
            }

            # Try to insert first, if it fails due to duplicate, then update
            @run_blocking
            def _insert_today():
                return (
                    postgrest_client.table("inventory_today")
                    .insert(payload)
                    .execute()
                )

            try:
                await _insert_today()
            except APIError as e:
                # If duplicate key error, fetch and update instead
                if e.code == "23505":
                    @run_blocking
                    def _fetch_today():
                        return (
                            postgrest_client.table("inventory_today")
                            .select("*")
                            .eq("item_id", item["item_id"])
                            .eq("batch_date", batch_date_str)
                            .single()
                            .execute()
                        )

                    today_response = await _fetch_today()
                    today_item = today_response.data

                    # Update the found today item (add to stock_quantity)
                    new_quantity = today_item.get("stock_quantity", 0) + transfer_quantity
                    update_payload = payload.copy()
                    update_payload["stock_quantity"] = new_quantity
                    update_payload["created_at"] = today_item.get("created_at", now)

                    @run_blocking
                    def _update_today():
                        return (
                            postgrest_client.table("inventory_today")
                            .update(update_payload)
                            .eq("item_id", item["item_id"])
                            .eq("batch_date", batch_date_str)
                            .execute()
                        )

                    await _update_today()
                else:
                    raise

            # Delete from surplus inventory
            @run_blocking
            def _delete_surplus():
                return (
                    postgrest_client.table("inventory_surplus")
                    .delete()
                    .eq("item_id", item["item_id"])
                    .eq("batch_date", batch_date_str)
                    .execute()
                )

            await _delete_surplus()
        
            db = SyncSessionLocal()
            try:
                description = f"Auto-transferred {transfer_quantity} of Id {item['item_id']} | item {item['item_name']} from surplus to today at 6am."
                log_user_activity(
                    db=db,
                    user={"user_id": 0, "name": "System", "user_role": "System"},
                    action_type="auto transfer surplus to today",
                    description=description,
                )
            except Exception as e:
                logger.warning(f"Failed to record auto transfer activity: {e}")
            finally:
                db.close()
        logger.info(f"Auto transfer from inventory_surplus to today completed at {now}")
    except Exception as e:
        logger.exception("Error in scheduled auto transfer from surplus to today")

@router.on_event("startup")
@repeat_every(seconds=86400)  # Run every 24 hours
async def auto_transfer_today_to_surplus() -> None:
    try:
        # Wait until 10pm before first run
        await wait_until_10pm()
        now = datetime.utcnow().isoformat()

        @run_blocking
        def _fetch_all():
            return (
                postgrest_client.table("inventory_today")
                .select("*")
                .execute()
            )

        items_response = await _fetch_all()
        items = items_response.data or []
        for item in items:
            transfer_quantity = item.get("stock_quantity", 0)
            if transfer_quantity <= 0:
                continue
            threshold = await get_threshold_for_item(item["item_name"])
            transfer_status = calculate_stock_status(transfer_quantity, threshold)
            batch_date_str = str(item.get("batch_date")) if item.get("batch_date") else None
            payload = {
                "item_id": item["item_id"],
                "batch_date": batch_date_str,  # Ensure it's a string "YYYY-MM-DD"
                "stock_quantity": transfer_quantity,
                "item_name": item.get("item_name"),
                "category": item.get("category"),
                "stock_status": transfer_status,
                "expiration_date": item.get("expiration_date"),
                "updated_at": now,
                "unit_price": item.get("unit_price"),
                "created_at": now,
            }

            # Try to insert first, if it fails due to duplicate, then update
            @run_blocking
            def _insert_surplus():
                return (
                    postgrest_client.table("inventory_surplus")
                    .insert(payload)
                    .execute()
                )

            try:
                await _insert_surplus()
            except APIError as e:
                # If duplicate key error, fetch and update instead
                if e.code == "23505":
                    @run_blocking
                    def _fetch_surplus():
                        return (
                            postgrest_client.table("inventory_surplus")
                            .select("*")
                            .eq("item_id", item["item_id"])
                            .eq("batch_date", batch_date_str)
                            .single()
                            .execute()
                        )

                    surplus_response = await _fetch_surplus()
                    surplus_item = surplus_response.data

                    # Update the found surplus item (add to stock_quantity)
                    new_quantity = surplus_item.get("stock_quantity", 0) + transfer_quantity
                    update_payload = payload.copy()
                    update_payload["stock_quantity"] = new_quantity
                    update_payload["created_at"] = surplus_item.get("created_at", now)

                    @run_blocking
                    def _update_surplus():
                        return (
                            postgrest_client.table("inventory_surplus")
                            .update(update_payload)
                            .eq("item_id", item["item_id"])
                            .eq("batch_date", batch_date_str)
                            .execute()
                        )

                    await _update_surplus()
                else:
                    raise

            # Delete from today inventory
            @run_blocking
            def _delete_today():
                return (
                    postgrest_client.table("inventory_today")
                    .delete()
                    .eq("item_id", item["item_id"])
                    .eq("batch_date", batch_date_str)
                    .execute()
                )

            await _delete_today()
        
            db = SyncSessionLocal()
            try:
                description = f"Auto-transferred {transfer_quantity} of Id {item['item_id']} | item {item['item_name']} from today to surplus at 10pm."
                log_user_activity(
                    db=db,
                    user={"user_id": 0, "name": "System", "user_role": "System"},
                    action_type="auto transfer today to surplus",
                    description=description,
                )
            except Exception as e:
                logger.warning(f"Failed to record auto transfer activity: {e}")
            finally:
                db.close()
            logger.info(f"Auto transfer from inventory_today to surplus completed at {now}")
    except Exception as e:
        logger.exception("Error in scheduled auto transfer from today to surplus")

# NOTE: on_event is deprecated, consider using FastAPI lifespan events for production.
@router.on_event("startup")
@repeat_every(seconds=300)
async def auto_transfer_expired_to_spoilage() -> None:
    try:
        from datetime import timezone
        now = datetime.now(timezone.utc).isoformat()
        today = datetime.now(timezone.utc).date()
        sources = [
            ("inventory", "stock_quantity"),
            ("inventory_today", "stock_quantity"),
            ("inventory_surplus", "stock_quantity"),
        ]
        expired_items_all = []
        for table, qty_field in sources:
            @run_blocking
            def _fetch_expired():
                return (
                    postgrest_client.table(table)
                    .select("*")
                    .lte("expiration_date", today.isoformat())
                    .execute()
                )
            expired_resp = await _fetch_expired()
            expired_items = expired_resp.data or []
            for item in expired_items:
                item["_source_table"] = table
                item["_qty_field"] = qty_field
            expired_items_all.extend(expired_items)

        group_map = {}
        for item in expired_items_all:
            key = (item.get("item_id"), str(item.get("batch_date")))
            if key not in group_map:
                group_map[key] = {
                    "item_id": item.get("item_id"),
                    "item_name": item.get("item_name") or item.get("name"),
                    "batch_date": item.get("batch_date"),
                    "expiration_date": item.get("expiration_date"),
                    "category": item.get("category"),
                    "spoilage_date": now[:10],
                    "reason": "Expired",
                    "user_id": None,
                    "created_at": now,
                    "updated_at": now,
                    "quantity_spoiled": 0,
                    "unit_price": item.get("unit_price"),
                    "_source_items": [],
                }
            qty = (
                item.get(item["_qty_field"])
                or item.get("remaining_stock")
                or item.get("quantity")
                or 0
            )
            group_map[key]["quantity_spoiled"] += qty
            group_map[key]["_source_items"].append(item)

        for group in group_map.values():
            if group["quantity_spoiled"] <= 0:
                continue
            spoilage_payload = {k: v for k, v in group.items() if not k.startswith("_")}
            if "spoilage_id" in spoilage_payload:
                del spoilage_payload["spoilage_id"]
            @run_blocking
            def _insert_spoilage():
                return (
                    postgrest_client.table("inventory_spoilage")
                    .insert(spoilage_payload)
                    .execute()
                )
            await _insert_spoilage()
            # Delete the expired items from their original tables
            for item in group["_source_items"]:
                table = item["_source_table"]
                item_id = item.get("item_id")
                @run_blocking
                def _delete():
                    return (
                        postgrest_client.table(table)
                        .delete()
                        .eq("item_id", item_id)
                        .eq("batch_date", item.get("batch_date"))
                        .execute()
                    )
                await _delete()
                logger.info(
                    f"Auto-moved expired item {item_id} ({item.get('item_name') or item.get('name')}) from {table} to spoilage."
                )
            db = SyncSessionLocal()
            try:
                description = (
                    f"Auto-moved expired item {group['item_id']} ({group['item_name']}) "
                    f"from {','.join(set(i['_source_table'] for i in group['_source_items']))} to spoilage. "
                    f"Quantity spoiled: {group['quantity_spoiled']}."
                )
                log_user_activity(
                    db=db,
                    user={"user_id": 0, "name": "System", "user_role": "System"},
                    action_type="auto transfer expired to spoilage",
                    description=description,
                )
            finally:
                db.close()
    except Exception as e:
        logger.exception("Error during auto_transfer_expired_to_spoilage")



