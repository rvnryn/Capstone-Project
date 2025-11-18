from fastapi import APIRouter
from pydantic import BaseModel
from fastapi_utils.tasks import repeat_every
from datetime import datetime, timedelta
from app.supabase import postgrest_client
import logging
import asyncio
from postgrest.exceptions import APIError
router = APIRouter()

from app.supabase import SessionLocal

# Track last execution dates to prevent multiple runs per day
last_surplus_to_today_run = None
last_today_to_surplus_run = None
last_master_to_today_run = None

from app.routes.Inventory.master_inventory import (
    run_blocking,
    get_threshold_for_item,
    calculate_stock_status,
    postgrest_client,
    UserActivityLog,
    logger,
    log_user_activity,
)

from app.routes.General.notification import create_transfer_notification


async def wait_until_6am():
    now = datetime.now()
    today_6am = datetime.combine(now.date(), datetime.min.time()) + timedelta(hours=15, minutes=55)
    if now >= today_6am:
        today_6am += timedelta(days=1)
    seconds_until_6am = (today_6am - now).total_seconds()
    await asyncio.sleep(seconds_until_6am)

async def wait_until_10pm():
    now = datetime.now()
    today_10pm = datetime.combine(now.date(), datetime.min.time()) + timedelta(hours=15, minutes=49)
    if now >= today_10pm:
        today_10pm += timedelta(days=1)
    seconds_until_10pm = (today_10pm - now).total_seconds()
    await asyncio.sleep(seconds_until_10pm)

async def fifo_transfer_to_today_with_surplus_first(item_name: str, quantity_needed: float):
    now = datetime.utcnow().isoformat()
    remaining_quantity = quantity_needed
    transfers = []
    errors = []

    try:
        # Step 1: Check Surplus Inventory first (FIFO - oldest batch_date first)
        @run_blocking
        def _fetch_surplus():
            return (
                postgrest_client.table("inventory_surplus")
                .select("*")
                .ilike("item_name", item_name)
                .order("batch_date", desc=False)  # FIFO: oldest first
                .execute()
            )
        surplus_response = await _fetch_surplus()
        surplus_items = surplus_response.data if surplus_response else []

        # Deduct from surplus inventory (FIFO)
        for surplus_item in surplus_items:
            if remaining_quantity <= 0:
                break

            available_qty = float(surplus_item.get("stock_quantity", 0))
            if available_qty <= 0:
                continue

            # Determine how much to take from this batch
            transfer_qty = min(remaining_quantity, available_qty)
            new_surplus_qty = available_qty - transfer_qty

            threshold = await get_threshold_for_item(item_name)
            batch_date_str = str(surplus_item.get("batch_date")) if surplus_item.get("batch_date") else None

            # Update or delete from surplus
            if new_surplus_qty <= 0:
                @run_blocking
                def _delete_surplus():
                    return (
                        postgrest_client.table("inventory_surplus")
                        .delete()
                        .eq("item_id", surplus_item["item_id"])
                        .eq("batch_date", batch_date_str)
                        .execute()
                    )
                await _delete_surplus()
            else:
                new_surplus_status = calculate_stock_status(new_surplus_qty, threshold)

                @run_blocking
                def _update_surplus():
                    return (
                        postgrest_client.table("inventory_surplus")
                        .update({
                            "stock_quantity": new_surplus_qty,
                            "stock_status": new_surplus_status,
                            "updated_at": now,
                        })
                        .eq("item_id", surplus_item["item_id"])
                        .eq("batch_date", batch_date_str)
                        .execute()
                    )
                await _update_surplus()

            # Add to today's inventory (upsert)
            transfer_status = calculate_stock_status(transfer_qty, threshold)
            payload = {
                "item_id": surplus_item["item_id"],
                "item_name": surplus_item["item_name"],
                "batch_date": batch_date_str,
                "category": surplus_item.get("category"),
                "stock_status": transfer_status,
                "stock_quantity": transfer_qty,
                "expiration_date": surplus_item.get("expiration_date"),
                "created_at": now,
                "updated_at": now,
                "unit_cost": surplus_item.get("unit_cost", 0.00),
            }

            @run_blocking
            def _upsert_today():
                return (
                    postgrest_client.table("inventory_today")
                    .upsert([payload], on_conflict=["item_id", "batch_date"])
                    .execute()
                )

            try:
                await _upsert_today()
            except APIError as e:
                errors.append(f"Failed to upsert to today inventory: {str(e)}")

            transfers.append({
                "source": "surplus",
                "batch_date": batch_date_str,
                "quantity": transfer_qty,
                "item_id": surplus_item["item_id"]
            })

            remaining_quantity -= transfer_qty

        # Step 2: If still need more, check Master Inventory (FIFO - oldest batch_date first)
        if remaining_quantity > 0:
            @run_blocking
            def _fetch_master():
                return (
                    postgrest_client.table("inventory")
                    .select("*")
                    .ilike("item_name", item_name)
                    .order("batch_date", desc=False)  # FIFO: oldest first
                    .execute()
                )

            master_response = await _fetch_master()
            master_items = master_response.data if master_response else []

            # Deduct from master inventory (FIFO)
            for master_item in master_items:
                if remaining_quantity <= 0:
                    break

                available_qty = float(master_item.get("stock_quantity", 0))
                if available_qty <= 0:
                    continue

                # Determine how much to take from this batch
                transfer_qty = min(remaining_quantity, available_qty)
                new_master_qty = available_qty - transfer_qty

                threshold = await get_threshold_for_item(item_name)
                batch_date_str = str(master_item.get("batch_date")) if master_item.get("batch_date") else None

                # Update or delete from master
                if new_master_qty <= 0:
                    @run_blocking
                    def _delete_master():
                        return (
                            postgrest_client.table("inventory")
                            .delete()
                            .eq("item_id", master_item["item_id"])
                            .execute()
                        )
                    await _delete_master()
                else:
                    new_master_status = calculate_stock_status(new_master_qty, threshold)

                    @run_blocking
                    def _update_master():
                        return (
                            postgrest_client.table("inventory")
                            .update({
                                "stock_quantity": new_master_qty,
                                "stock_status": new_master_status,
                                "updated_at": now,
                            })
                            .eq("item_id", master_item["item_id"])
                            .execute()
                        )
                    await _update_master()

                # Add to today's inventory (upsert)
                transfer_status = calculate_stock_status(transfer_qty, threshold)
                payload = {
                    "item_id": master_item["item_id"],
                    "item_name": master_item["item_name"],
                    "batch_date": batch_date_str,
                    "category": master_item.get("category"),
                    "stock_status": transfer_status,
                    "stock_quantity": transfer_qty,
                    "expiration_date": master_item.get("expiration_date"),
                    "created_at": now,
                    "updated_at": now,
                    "unit_cost": master_item.get("unit_cost", 0.00),
                }

                @run_blocking
                def _upsert_today():
                    return (
                        postgrest_client.table("inventory_today")
                        .upsert([payload], on_conflict=["item_id", "batch_date"])
                        .execute()
                    )

                try:
                    await _upsert_today()
                except APIError as e:
                    errors.append(f"Failed to upsert to today inventory: {str(e)}")

                transfers.append({
                    "source": "master",
                    "batch_date": batch_date_str,
                    "quantity": transfer_qty,
                    "item_id": master_item["item_id"]
                })

                remaining_quantity -= transfer_qty

        # Check if we could fulfill the entire request
        transferred_qty = quantity_needed - remaining_quantity

        return {
            "requested_quantity": quantity_needed,
            "transferred_quantity": transferred_qty,
            "remaining_shortage": remaining_quantity,
            "transfers": transfers,
            "errors": errors if errors else None,
            "summary": {
                "from_surplus": sum(t["quantity"] for t in transfers if t["source"] == "surplus"),
                "from_master": sum(t["quantity"] for t in transfers if t["source"] == "master"),
            }
        }

    except Exception as e:
        logger.exception(f"Error in fifo_transfer_to_today_with_surplus_first for {item_name}")
        return {
            "requested_quantity": quantity_needed,
            "transferred_quantity": 0,
            "remaining_shortage": quantity_needed,
            "transfers": [],
            "errors": [str(e)]
        }

@router.on_event("startup")
@repeat_every(seconds=86400)  # Run every 24 hours
async def auto_transfer_master_to_today_top_selling() -> None:
    """
    FIXED VERSION: Auto-transfer ingredients for top selling menu items at 6 AM daily.
    Uses actual sales data from sales_report table and calculates quantities based on 7-day average.
    """
    global last_master_to_today_run
    try:
        # Wait until 6am before first run
        await wait_until_6am()

        # Check if already ran today
        today = datetime.utcnow().date()
        if last_master_to_today_run == today:
            logger.info(f"Master to today transfer already ran today ({today}), skipping...")
            return

        now = datetime.utcnow().isoformat()
        last_7_days = (today - timedelta(days=7)).isoformat()

        logger.info(f"Starting auto transfer from master/surplus to today for top selling items at {now}")

        # 1. Get top selling menu items from sales_report (FIXED)
        @run_blocking
        def _fetch_top_selling():
            sales_res = postgrest_client.table("sales_report") \
                .select("item_name,quantity") \
                .gte("sale_date", last_7_days) \
                .execute()
            sales_data = sales_res.data or []

            from collections import Counter
            counter = Counter()
            for sale in sales_data:
                item_name = sale.get("item_name")
                qty = sale.get("quantity", 0)
                counter[item_name] += qty

            # Get top 5 selling items
            top_items = [item_name for item_name, _ in counter.most_common(5)]
            return top_items, counter

        top_items, sales_counter = await _fetch_top_selling()

        if not top_items:
            logger.info("No top selling items found in last 7 days")
            last_master_to_today_run = today
            return

        logger.info(f"Top 5 selling items: {top_items}")

        # 2. For each top item, get required ingredients
        total_transfers = 0
        transfer_details = []  # Collect detailed transfer information for notification
        for item_name in top_items:
            # Get menu_id from menu table
            @run_blocking
            def _fetch_menu():
                res = postgrest_client.table("menu") \
                    .select("menu_id,dish_name") \
                    .ilike("dish_name", item_name) \
                    .limit(1) \
                    .execute()
                return res.data[0] if res.data else None

            menu_item = await _fetch_menu()
            if not menu_item:
                logger.warning(f"Menu item '{item_name}' not found in menu table")
                continue

            menu_id = menu_item["menu_id"]

            # Get ingredients for this menu
            @run_blocking
            def _fetch_ingredients():
                res = postgrest_client.table("menu_ingredients") \
                    .select("*") \
                    .eq("menu_id", menu_id) \
                    .execute()
                return res.data or []

            ingredients = await _fetch_ingredients()

            if not ingredients:
                logger.warning(f"No ingredients found for menu item '{item_name}'")
                continue

            # Calculate quantity needed based on actual sales (not hardcoded)
            total_sold = sales_counter[item_name]
            daily_average = total_sold / 7
            buffer_multiplier = 1.5  # 50% buffer for expected sales today

            logger.info(f"Menu '{item_name}': {total_sold} sold in 7 days (avg {daily_average:.1f}/day)")

            for ing in ingredients:
                ingredient_name = ing.get("ingredient_name")
                qty_per_serving = float(ing.get("quantity", 0))
                recipe_unit = ing.get("measurements", "")

                if not ingredient_name or qty_per_serving <= 0:
                    continue

                # Calculate quantity needed (based on 7-day average × buffer)
                qty_needed = daily_average * buffer_multiplier * qty_per_serving

                logger.info(f"  Ingredient '{ingredient_name}': need {qty_needed:.2f} {recipe_unit}")

                # Use the existing FIFO transfer function with surplus-first priority
                transfer_result = await fifo_transfer_to_today_with_surplus_first(
                    ingredient_name, qty_needed
                )

                # Log the transfer
                if transfer_result["transferred_quantity"] > 0:
                    total_transfers += 1

                    # Collect detailed transfer information for notification
                    transfer_details.append({
                        "name": ingredient_name,
                        "quantity": round(transfer_result['transferred_quantity'], 2),
                        "unit": recipe_unit,
                        "menu_item": item_name,
                        "from_surplus": round(transfer_result['summary']['from_surplus'], 2),
                        "from_master": round(transfer_result['summary']['from_master'], 2)
                    })

                    async with SessionLocal() as db:
                        description = (
                            f"Auto-transferred {transfer_result['transferred_quantity']:.2f} {recipe_unit} "
                            f"of '{ingredient_name}' to today inventory for top selling item '{item_name}' "
                            f"(7-day avg: {daily_average:.2f} sold/day, requested: {qty_needed:.2f}). "
                            f"Sources: {transfer_result['summary']['from_surplus']:.2f} from surplus, "
                            f"{transfer_result['summary']['from_master']:.2f} from master."
                        )
                        await log_user_activity(
                            db=db,
                            user={"user_id": 0, "name": "System", "user_role": "System"},
                            action_type="auto transfer master to today for top selling",
                            description=description,
                        )
                    logger.info(f"    Transferred: {transfer_result['transferred_quantity']:.2f} {recipe_unit}")

                # Warn if insufficient stock
                if transfer_result["remaining_shortage"] > 0:
                    logger.warning(
                        f"    Insufficient stock for '{ingredient_name}': "
                        f"needed {qty_needed:.2f} {recipe_unit}, "
                        f"short by {transfer_result['remaining_shortage']:.2f} {recipe_unit}"
                    )

        # Mark as completed for today
        last_master_to_today_run = today
        logger.info(f"Auto transfer for top selling items completed at {now}. Total transfers: {total_transfers}")

        # Create notification for auto transfer with detailed information
        if total_transfers > 0:
            try:
                create_transfer_notification(
                    transfer_type="master",
                    item_count=total_transfers,
                    details_list=transfer_details
                )
            except Exception as e:
                logger.warning(f"Failed to create transfer notification: {e}")
    except Exception as e:
        logger.exception("Error in scheduled auto transfer for top selling items")

@router.on_event("startup")
@repeat_every(seconds=86400)  # Run every 24 hours
async def auto_transfer_surplus_to_today() -> None:
    global last_surplus_to_today_run
    try:
        # Wait until 6am before first run
        await wait_until_6am()

        # Check if already ran today
        today = datetime.utcnow().date()
        if last_surplus_to_today_run == today:
            logger.info(f"Surplus to today transfer already ran today ({today}), skipping...")
            return

        now = datetime.utcnow().isoformat()
        logger.info(f"Starting auto transfer from surplus to today at {now}")

        @run_blocking
        def _fetch_all():
            return (
                postgrest_client.table("inventory_surplus")
                .select("*")
                .execute()
            )

        items_response = await _fetch_all()
        items = items_response.data or []
        transfer_count = 0
        transfer_details = []  # Collect detailed transfer information for notification
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
                "unit_cost": item.get("unit_cost", 0.00),
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

                    # REPLACE the quantity (do not add) to prevent multiplication on reruns
                    # The surplus item is being transferred, so we should replace, not accumulate
                    update_payload = payload.copy()
                    update_payload["stock_quantity"] = transfer_quantity
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

            # Get unit of measurement from inventory settings
            unit = ""
            try:
                @run_blocking
                def _fetch_unit():
                    return (
                        postgrest_client.table("inventory_settings")
                        .select("default_unit")
                        .ilike("name", item["item_name"])
                        .limit(1)
                        .execute()
                    )
                unit_response = await _fetch_unit()
                if unit_response.data and len(unit_response.data) > 0:
                    unit = unit_response.data[0].get("default_unit", "")
            except Exception:
                pass

            # Collect detailed transfer information for notification
            transfer_details.append({
                "name": item["item_name"],
                "quantity": round(float(transfer_quantity), 2),
                "unit": unit,
                "batch_date": batch_date_str
            })

            try:
                async with SessionLocal() as db:
                    description = f"Auto-transferred {transfer_quantity:.2f} {unit} of Id {item['item_id']} | item {item['item_name']} from surplus to today at 6am."
                    await log_user_activity(
                        db=db,
                        user={"user_id": 0, "name": "System", "user_role": "System"},
                        action_type="auto transfer surplus to today",
                        description=description,
                    )
                transfer_count += 1
            except Exception as e:
                logger.warning(f"Failed to record auto transfer activity: {e}")

        # Mark as completed for today
        last_surplus_to_today_run = today
        logger.info(f"Auto transfer from inventory_surplus to today completed at {now}")

        # Create notification for auto transfer with detailed information
        if transfer_count > 0:
            try:
                create_transfer_notification(
                    transfer_type="today",
                    item_count=transfer_count,
                    details_list=transfer_details
                )
            except Exception as e:
                logger.warning(f"Failed to create transfer notification: {e}")
    except Exception as e:
        logger.exception("Error in scheduled auto transfer from surplus to today")

@router.on_event("startup")
@repeat_every(seconds=86400)  # Run every 24 hours
async def auto_transfer_today_to_surplus() -> None:
    global last_today_to_surplus_run
    try:
        # Wait until 10pm before first run
        await wait_until_10pm()

        # Check if already ran today
        today = datetime.utcnow().date()
        if last_today_to_surplus_run == today:
            logger.info(f"Today to surplus transfer already ran today ({today}), skipping...")
            return

        now = datetime.utcnow().isoformat()
        logger.info(f"Starting auto transfer from today to surplus at {now}")

        @run_blocking
        def _fetch_all():
            return (
                postgrest_client.table("inventory_today")
                .select("*")
                .execute()
            )

        items_response = await _fetch_all()
        items = items_response.data or []
        transfer_count = 0
        transfer_details = []  # Collect detailed transfer information for notification
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
                "unit_cost": item.get("unit_cost", 0.00),
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

                    # REPLACE the quantity (do not add) to prevent multiplication on reruns
                    # The today item is being transferred, so we should replace, not accumulate
                    update_payload = payload.copy()
                    update_payload["stock_quantity"] = transfer_quantity
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

            # Get unit of measurement from inventory settings
            unit = ""
            try:
                @run_blocking
                def _fetch_unit():
                    return (
                        postgrest_client.table("inventory_settings")
                        .select("default_unit")
                        .ilike("name", item["item_name"])
                        .limit(1)
                        .execute()
                    )
                unit_response = await _fetch_unit()
                if unit_response.data and len(unit_response.data) > 0:
                    unit = unit_response.data[0].get("default_unit", "")
            except Exception:
                pass

            # Collect detailed transfer information for notification
            transfer_details.append({
                "name": item["item_name"],
                "quantity": round(float(transfer_quantity), 2),
                "unit": unit,
                "batch_date": batch_date_str
            })

            try:
                async with SessionLocal() as db:
                    description = f"Auto-transferred {transfer_quantity:.2f} {unit} of Id {item['item_id']} | item {item['item_name']} from today to surplus at 10pm."
                    await log_user_activity(
                        db=db,
                        user={"user_id": 0, "name": "System", "user_role": "System"},
                        action_type="auto transfer today to surplus",
                        description=description,
                    )
                transfer_count += 1
            except Exception as e:
                logger.warning(f"Failed to record auto transfer activity: {e}")

        # Mark as completed for today
        last_today_to_surplus_run = today
        logger.info(f"Auto transfer from inventory_today to surplus completed at {now}")

        # Create notification for auto transfer with detailed information
        if transfer_count > 0:
            try:
                create_transfer_notification(
                    transfer_type="surplus",
                    item_count=transfer_count,
                    details_list=transfer_details
                )
            except Exception as e:
                logger.warning(f"Failed to create transfer notification: {e}")
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
        total_spoiled_count = 0
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
                    "unit_cost": item.get("unit_cost", 0.00),  # Include unit_cost from source item
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
            try:
                async with SessionLocal() as db:
                    description = (
                        f"Auto-moved expired item {group['item_id']} ({group['item_name']}) "
                        f"from {','.join(set(i['_source_table'] for i in group['_source_items']))} to spoilage. "
                        f"Quantity spoiled: {group['quantity_spoiled']}."
                    )
                    await log_user_activity(
                        db=db,
                        user={"user_id": 0, "name": "System", "user_role": "System"},
                        action_type="auto transfer expired to spoilage",
                        description=description,
                    )
                total_spoiled_count += 1
            except Exception as e:
                logger.warning(f"Failed to record auto transfer activity: {e}")

        # Create notification for auto transfer to spoilage
        if total_spoiled_count > 0:
            try:
                users_response = postgrest_client.table("users").select("user_id").execute()
                users = [u["user_id"] for u in users_response.data] if users_response.data else []

                for user_id in users:
                    from app.routes.General.notification import create_notification
                    create_notification(
                        user_id=user_id,
                        type="auto_transfer_spoilage",
                        message=f"Auto transfer to Spoilage completed: {total_spoiled_count} expired items transferred",
                        details=None
                    )
                    logger.info(f"Spoilage notification created for user {user_id}")
            except Exception as e:
                logger.warning(f"Failed to create spoilage notification: {e}")

    except Exception as e:
        logger.exception("Error during auto_transfer_expired_to_spoilage")


# Manual trigger endpoints for testing auto transfer notifications
@router.post("/test-notification-auto-transfer")
async def test_notification_auto_transfer():
    """Create test notifications for all auto transfer types"""
    try:
        # Sample transfer details for testing
        sample_details_master = [
            {"name": "Chicken Breast", "quantity": 5.0, "unit": "kg", "menu_item": "Chicken Adobo", "from_surplus": 2.0, "from_master": 3.0},
            {"name": "Rice", "quantity": 10.0, "unit": "kg", "menu_item": "Fried Rice", "from_surplus": 0.0, "from_master": 10.0},
            {"name": "Tomatoes", "quantity": 3.5, "unit": "kg", "menu_item": "Tomato Soup", "from_surplus": 1.5, "from_master": 2.0}
        ]

        sample_details_today = [
            {"name": "Ground Beef", "quantity": 4.2, "unit": "kg", "batch_date": "2025-11-15"},
            {"name": "Onions", "quantity": 2.0, "unit": "kg", "batch_date": "2025-11-16"},
            {"name": "Garlic", "quantity": 0.5, "unit": "kg", "batch_date": "2025-11-16"}
        ]

        sample_details_surplus = [
            {"name": "Pork Belly", "quantity": 3.0, "unit": "kg", "batch_date": "2025-11-10"},
            {"name": "Carrots", "quantity": 1.5, "unit": "kg", "batch_date": "2025-11-12"},
            {"name": "Potatoes", "quantity": 2.0, "unit": "kg", "batch_date": "2025-11-11"}
        ]

        # Test notification for master to today transfer
        create_transfer_notification(
            transfer_type="master",
            item_count=len(sample_details_master),
            details_list=sample_details_master
        )

        # Test notification for surplus to today transfer
        create_transfer_notification(
            transfer_type="today",
            item_count=len(sample_details_today),
            details_list=sample_details_today
        )

        # Test notification for today to surplus transfer
        create_transfer_notification(
            transfer_type="surplus",
            item_count=len(sample_details_surplus),
            details_list=sample_details_surplus
        )

        # Test notification for expired to spoilage transfer
        users_response = postgrest_client.table("users").select("user_id").execute()
        users = [u["user_id"] for u in users_response.data] if users_response.data else []

        for user_id in users:
            from app.routes.General.notification import create_notification
            create_notification(
                user_id=user_id,
                type="auto_transfer_spoilage",
                message=f"Auto transfer to Spoilage completed: 2 expired items transferred (TEST)",
                details=None
            )

        return {
            "status": "success",
            "message": "Test notifications created for all auto transfer types with detailed information. Check your notifications!"
        }
    except Exception as e:
        logger.exception("Error creating test notifications")
        return {"status": "error", "message": str(e)}
