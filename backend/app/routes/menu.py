import json
from fastapi import (
    APIRouter,
    HTTPException,
    Depends,
    UploadFile,
    File,
    Form,
    Body,
    BackgroundTasks,
    Request,
)
from slowapi.util import get_remote_address
from slowapi import Limiter

limiter = Limiter(key_func=get_remote_address, default_limits=["10/minute"])
(
    HTTPException,
    APIRouter,
    UploadFile,
    File,
    Form,
    Body,
    Depends,
    BackgroundTasks,
)
from typing import Optional
from app.supabase import postgrest_client, supabase, get_db
from starlette.concurrency import run_in_threadpool
import uuid
from datetime import datetime
from app.routes.userActivity import UserActivityLog
from app.utils.rbac import require_role
import logging
import math

router = APIRouter()


# Rate limited trigger endpoint for recalculation
@limiter.limit("5/minute")
@router.post("/menu/recalc")
async def trigger_recalculate(
    request: Request,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
    db=Depends(get_db),
):
    # run in threadpool to avoid blocking
    result = await run_in_threadpool(recalculate_stock_status)

    # record activity (best-effort)
    try:
        user_row = getattr(user, "user_row", user)
        desc = result.get("message") if isinstance(result, dict) else str(result)
        new_activity = UserActivityLog(
            user_id=user_row.get("user_id"),
            action_type="recalculate stock status",
            description=desc,
            activity_date=datetime.utcnow(),
            report_date=datetime.utcnow(),
            user_name=user_row.get("name"),
            role=user_row.get("user_role"),
        )
        db.add(new_activity)
        await db.flush()
        await db.commit()
    except Exception as e:
        print("Failed to record recalc activity:", e)

    return result


class MenuItem:
    pass  # Use your existing Pydantic MenuItem if needed for response_model


# Endpoint: create menu (with image) and its ingredients in one request
@limiter.limit("10/minute")
@router.post("/menu/create-with-image-and-ingredients")
async def create_menu_with_ingredients(
    request: Request,
    dish_name: str = Form(...),
    category: str = Form(...),
    price: float = Form(...),
    description: Optional[str] = Form(None),
    stock_status: Optional[str] = Form(None),
    file: UploadFile = File(...),
    ingredients: str = Form(...),
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
    db=Depends(get_db),
):
    try:
        ext = file.filename.split(".")[-1]
        filename = f"menu/{uuid.uuid4()}.{ext}"
        content = await file.read()
        res = supabase.storage.from_("menu-images").upload(filename, content)
        if hasattr(res, "error") and res.error:
            raise HTTPException(
                status_code=400,
                detail=f"Image upload failed: {getattr(res.error, 'message', res.error)}",
            )
        if hasattr(res, "data") and not res.data:
            raise HTTPException(
                status_code=400,
                detail="Image upload failed: No data returned from upload.",
            )
        public_url = supabase.storage.from_("menu-images").get_public_url(filename)

        try:
            ingredients_list = json.loads(ingredients)
        except Exception as e:
            raise HTTPException(
                status_code=400, detail=f"Invalid ingredients format: {str(e)}"
            )

        # --- Stock status logic ---
        all_in_stock = True
        for ing in ingredients_list:
            ing_name = ing.get("name") or ing.get("ingredient_name")
            stock = 0
            expired = False

            # Check inventory
            inv = (
                postgrest_client.table("inventory")
                .select("stock_quantity,expiration_date")
                .ilike("item_name", ing_name)
                .limit(1)
                .execute()
            )
            if inv.data and len(inv.data) > 0:
                stock += inv.data[0].get("stock_quantity", 0) or 0
                expiry = inv.data[0].get("expiration_date")
                if expiry:
                    try:
                        if (
                            datetime.strptime(expiry, "%Y-%m-%d").date()
                            < datetime.now().date()
                        ):
                            expired = True
                    except Exception:
                        pass

            # Check inventory_surplus
            surplus = (
                postgrest_client.table("inventory_surplus")
                .select("stock_quantity,expiration_date")
                .ilike("item_name", ing_name)
                .limit(1)
                .execute()
            )
            if surplus.data and len(surplus.data) > 0:
                stock += surplus.data[0].get("stock_quantity", 0) or 0
                expiry = surplus.data[0].get("expiration_date")
                if expiry:
                    try:
                        if (
                            datetime.strptime(expiry, "%Y-%m-%d").date()
                            < datetime.now().date()
                        ):
                            expired = True
                    except Exception:
                        pass

            # Check inventory_today
            today = (
                postgrest_client.table("inventory_today")
                .select("stock_quantity,expiration_date")
                .ilike("item_name", ing_name)
                .limit(1)
                .execute()
            )
            if today.data and len(today.data) > 0:
                stock += today.data[0].get("stock_quantity", 0) or 0
                expiry = today.data[0].get("expiration_date")
                if expiry:
                    try:
                        if (
                            datetime.strptime(expiry, "%Y-%m-%d").date()
                            < datetime.now().date()
                        ):
                            expired = True
                    except Exception:
                        pass

            # If any ingredient is expired or out of stock, mark as not available
            if expired or not stock or stock <= 0:
                all_in_stock = False
                break

        stock_status = "Available" if all_in_stock else "Out of Stock"

        # Add timestamps
        now = datetime.utcnow().isoformat()

        menu_data = {
            "dish_name": dish_name,
            "image_url": public_url,
            "category": category,
            "price": float(price),
            "description": description,
            "stock_status": stock_status,
            "created_at": now,
            "updated_at": now,
        }
        dbres = postgrest_client.table("menu").insert(menu_data).execute()
        error = (
            getattr(dbres, "error", None)
            if hasattr(dbres, "error")
            else dbres.get("error") if isinstance(dbres, dict) else None
        )
        if error:
            raise HTTPException(
                status_code=400, detail=getattr(error, "message", str(error))
            )
        data = (
            getattr(dbres, "data", None)
            if hasattr(dbres, "data")
            else dbres.get("data") if isinstance(dbres, dict) else None
        )
        if not data or not isinstance(data, list) or len(data) == 0:
            raise HTTPException(
                status_code=500, detail="Menu creation failed: No data returned."
            )
        menu_row = data[0]
        menu_id = menu_row.get("id") or menu_row.get("menu_id")
        if not menu_id:
            raise HTTPException(
                status_code=500, detail="Menu creation failed: No menu_id returned."
            )
        menu_row["menu_id"] = menu_id
        try:
            ingredients_list = json.loads(ingredients)
        except Exception as e:
            raise HTTPException(
                status_code=400, detail=f"Invalid ingredients format: {str(e)}"
            )
        menu_ingredients = []
        for ing in ingredients_list:
            name = ing.get("name")
            quantity = ing.get("quantity")
            measurements = ing.get("measurement") or ing.get("measurements")
            if not name or not quantity:
                continue
            search_res = (
                postgrest_client.table("ingredients")
                .select("ingredient_id")
                .ilike("ingredient_name", name)
                .limit(1)
                .execute()
            )
            ingredient_id = None
            search_data = (
                getattr(search_res, "data", None)
                if hasattr(search_res, "data")
                else search_res.get("data") if isinstance(search_res, dict) else None
            )
            if search_data and isinstance(search_data, list) and len(search_data) > 0:
                ingredient_id = search_data[0].get("ingredient_id")
            if not ingredient_id:
                create_res = (
                    postgrest_client.table("ingredients")
                    .insert({"ingredient_name": name})
                    .execute()
                )
                create_data = (
                    getattr(create_res, "data", None)
                    if hasattr(create_res, "data")
                    else (
                        create_res.get("data") if isinstance(create_res, dict) else None
                    )
                )
                if (
                    create_data
                    and isinstance(create_data, list)
                    and len(create_data) > 0
                ):
                    ingredient_id = create_data[0].get("ingredient_id")
            if not ingredient_id:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to create or find ingredient: {name}",
                )
            menu_ingredients.append(
                {
                    "menu_id": menu_id,
                    "ingredient_id": ingredient_id,
                    "ingredient_name": name,
                    "quantity": quantity,
                    "measurements": measurements,
                }
            )
        if menu_ingredients:
            res_ing = (
                postgrest_client.table("menu_ingredients").insert(menu_ingredients).execute()
            )
            err_ing = (
                getattr(res_ing, "error", None)
                if hasattr(res_ing, "error")
                else res_ing.get("error") if isinstance(res_ing, dict) else None
            )
            if err_ing:
                raise HTTPException(
                    status_code=400,
                    detail=f"Ingredient insert failed: {getattr(err_ing, 'message', str(err_ing))}",
                )

        try:
            user_row = getattr(user, "user_row", user)
            ingredient_details = []
            for ing in menu_ingredients:
                name = ing.get("ingredient_name")
            quantity = ing.get("quantity")
            if name and quantity is not None:
                ingredient_details.append(f"{name} (quantity: {quantity})")
            desc = f"Added menu item: {dish_name}"
            if ingredient_details:
                desc += f" with ingredients: {', '.join(ingredient_details)}"
            new_activity = UserActivityLog(
                user_id=user_row.get("user_id"),
                action_type="add menu item",
                description=desc,
                activity_date=datetime.utcnow(),
                report_date=datetime.utcnow(),
                user_name=user_row.get("name"),
                role=user_row.get("user_role"),
            )
            db.add(new_activity)
            await db.flush()
            await db.commit()
            print("Menu add activity logged successfully.")
        except Exception as e:
            print("Failed to record menu add activity:", e)

        return menu_row
    except Exception as e:
        import traceback

        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


# Endpoint: get all menu items
@router.get("/menu")
async def get_menu():
    def sync_get_menu():
        res = postgrest_client.table("menu").select("*").execute()
        error = (
            getattr(res, "error", None)
            if hasattr(res, "error")
            else res.get("error") if isinstance(res, dict) else None
        )
        if error:
            raise HTTPException(
                status_code=400, detail=getattr(error, "message", str(error))
            )
        data = (
            getattr(res, "data", None)
            if hasattr(res, "data")
            else res.get("data") if isinstance(res, dict) else None
        )
        if not data:
            return []

        menu_ids = [item.get("id") or item.get("menu_id") for item in data]
        menu_ids = [mid for mid in menu_ids if mid is not None]
        if menu_ids:
            ing_res = (
                postgrest_client.table("menu_ingredients")
                .select("menu_id,ingredient_id,ingredient_name,quantity")
                .in_("menu_id", menu_ids)
                .execute()
            )
            ing_error = (
                getattr(ing_res, "error", None)
                if hasattr(ing_res, "error")
                else ing_res.get("error") if isinstance(ing_res, dict) else None
            )
            if ing_error:
                raise HTTPException(
                    status_code=400, detail=getattr(ing_error, "message", str(ing_error))
                )
            ing_data = (
                getattr(ing_res, "data", None)
                if hasattr(ing_res, "data")
                else ing_res.get("data") if isinstance(ing_res, dict) else None
            )
            ing_map = {}
            for ing in ing_data or []:
                mid = ing.get("menu_id")
                if mid not in ing_map:
                    ing_map[mid] = []
                ing_map[mid].append(ing)
            for item in data:
                mid = item.get("id") or item.get("menu_id")
                item["menu_id"] = item.get("menu_id", item.get("id"))
                item["ingredients"] = ing_map.get(mid, [])
                all_in_stock = True
                for ing in item["ingredients"]:
                    ing_name = ing.get("ingredient_name") or ing.get("name")
                    available_stock = 0
                    inv = (
                        postgrest_client.table("inventory")
                        .select("stock_quantity,expiration_date")
                        .ilike("item_name", ing_name)
                        .execute()
                    )
                    for inv_item in inv.data or []:
                        stock = inv_item.get("stock_quantity", 0) or 0
                        expiry = inv_item.get("expiration_date")
                        is_expired = False
                        if expiry:
                            try:
                                if (
                                    datetime.strptime(expiry, "%Y-%m-%d").date()
                                    < datetime.now().date()
                                ):
                                    is_expired = True
                            except Exception:
                                pass
                        if not is_expired:
                            available_stock += stock
                    surplus = (
                        postgrest_client.table("inventory_surplus")
                        .select("stock_quantity,expiration_date")
                        .ilike("item_name", ing_name)
                        .execute()
                    )
                    for surplus_item in surplus.data or []:
                        stock = surplus_item.get("stock_quantity", 0) or 0
                        expiry = surplus_item.get("expiration_date")
                        is_expired = False
                        if expiry:
                            try:
                                if (
                                    datetime.strptime(expiry, "%Y-%m-%d").date()
                                    < datetime.now().date()
                                ):
                                    is_expired = True
                            except Exception:
                                pass
                        if not is_expired:
                            available_stock += stock
                    today = (
                        postgrest_client.table("inventory_today")
                        .select("stock_quantity,expiration_date")
                        .ilike("item_name", ing_name)
                        .execute()
                    )
                    for today_item in today.data or []:
                        stock = today_item.get("stock_quantity", 0) or 0
                        expiry = today_item.get("expiration_date")
                        is_expired = False
                        if expiry:
                            try:
                                if (
                                    datetime.strptime(expiry, "%Y-%m-%d").date()
                                    < datetime.now().date()
                                ):
                                    is_expired = True
                            except Exception:
                                pass
                        if not is_expired:
                            available_stock += stock
                    if not available_stock or available_stock <= 0:
                        all_in_stock = False
                        break
                new_status = "Available" if all_in_stock else "Out of Stock"
                if item.get("stock_status") != new_status:
                    pk_column = "id" if "id" in item else "menu_id"
                    pk_value = item.get("id") or item.get("menu_id")
                    update_res = (
                        postgrest_client.table("menu")
                        .update({"stock_status": new_status})
                        .eq(pk_column, pk_value)
                        .execute()
                    )
                    print(
                        f"Updating menu item {item.get('dish_name')} from {item.get('stock_status')} to {new_status}"
                    )
                    update_error = (
                        getattr(update_res, "error", None)
                        if hasattr(update_res, "error")
                        else (
                            update_res.get("error")
                            if isinstance(update_res, dict)
                            else None
                        )
                    )
                    if update_error:
                        print(
                            f"Failed to update stock_status for menu item {item.get('dish_name')}: {update_error}"
                        )
                item["stock_status"] = new_status
        else:
            for item in data:
                item["menu_id"] = item.get("menu_id", item.get("id"))
                item["ingredients"] = []
        return data
    return await run_in_threadpool(sync_get_menu)


@router.patch("/menu/{menu_id}")
async def update_menu(
    menu_id: int,
    menu_update: dict = Body(...),
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
    db=Depends(get_db),
):
    import json

    # Only allow updating certain fields
    allowed_fields = {
        "dish_name",
        "image_url",
        "category",
        "price",
        "description",
        "stock_status",
    }
    update_data = {k: v for k, v in menu_update.items() if k in allowed_fields}

    # Add updated timestamp
    if update_data:
        update_data["updated_at"] = datetime.utcnow().isoformat()
    # Handle ingredients update if provided
    ingredients = menu_update.get("ingredients")
    if ingredients is not None:
        # Remove all existing menu_ingredients for this menu
        postgrest_client.table("menu_ingredients").delete().eq("menu_id", menu_id).execute()
        # Insert new menu_ingredients if any
        menu_ingredients = []
        for ing in ingredients:
            name = ing.get("name") or ing.get("ingredient_name")
            quantity = ing.get("quantity")
            if not name or not quantity:
                continue
            # Find or create ingredient_id
            search_res = (
                postgrest_client.table("ingredients")
                .select("ingredient_id")
                .ilike("ingredient_name", name)
                .limit(1)
                .execute()
            )
            ingredient_id = None
            search_data = (
                getattr(search_res, "data", None)
                if hasattr(search_res, "data")
                else search_res.get("data") if isinstance(search_res, dict) else None
            )
            if search_data and isinstance(search_data, list) and len(search_data) > 0:
                ingredient_id = search_data[0].get("ingredient_id")
            if not ingredient_id:
                create_res = (
                    postgrest_client.table("ingredients")
                    .insert({"ingredient_name": name})
                    .execute()
                )
                create_data = (
                    getattr(create_res, "data", None)
                    if hasattr(create_res, "data")
                    else (
                        create_res.get("data") if isinstance(create_res, dict) else None
                    )
                )
                if (
                    create_data
                    and isinstance(create_data, list)
                    and len(create_data) > 0
                ):
                    ingredient_id = create_data[0].get("ingredient_id")
            if not ingredient_id:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to create or find ingredient: {name}",
                )
            menu_ingredients.append(
                {
                    "menu_id": menu_id,
                    "ingredient_id": ingredient_id,
                    "ingredient_name": name,
                    "quantity": quantity,
                }
            )
        if menu_ingredients:
            res_ing = (
                postgrest_client.table("menu_ingredients").insert(menu_ingredients).execute()
            )
            err_ing = (
                getattr(res_ing, "error", None)
                if hasattr(res_ing, "error")
                else res_ing.get("error") if isinstance(res_ing, dict) else None
            )
            if err_ing:
                raise HTTPException(
                    status_code=400,
                    detail=f"Ingredient insert failed: {getattr(err_ing, 'message', str(err_ing))}",
                )
    if not update_data and ingredients is None:
        raise HTTPException(status_code=400, detail="No valid fields to update.")
    # Only update menu if update_data is present
    menu_row = None
    if update_data:
        res = (
            postgrest_client.table("menu").update(update_data).eq("menu_id", menu_id).execute()
        )
        error = (
            getattr(res, "error", None)
            if hasattr(res, "error")
            else res.get("error") if isinstance(res, dict) else None
        )
        if error:
            raise HTTPException(
                status_code=400, detail=getattr(error, "message", str(error))
            )
        data = (
            getattr(res, "data", None)
            if hasattr(res, "data")
            else res.get("data") if isinstance(res, dict) else None
        )
        if not data or not isinstance(data, list) or len(data) == 0:
            raise HTTPException(status_code=404, detail="Menu item not found.")
        menu_row = data[0]
        menu_row["menu_id"] = menu_row.get("id") or menu_row.get("menu_id")

        try:
            user_row = getattr(user, "user_row", user)
            desc = f"Update menu item: {menu_row.get('dish_name')}"
            if ingredients is not None:
                updated_ingredients = []
                for ing in ingredients:
                    name = ing.get("name") or ing.get("ingredient_name")
                    quantity = ing.get("quantity")
                    if name and quantity is not None:
                        updated_ingredients.append(f"{name} (quantity: {quantity})")
                if updated_ingredients:
                    desc += (
                        f" with updated ingredients: {', '.join(updated_ingredients)}"
                    )
            new_activity = UserActivityLog(
                user_id=user_row.get("user_id"),
                action_type="update menu item",
                description=desc,
                activity_date=datetime.utcnow(),
                report_date=datetime.utcnow(),
                user_name=user_row.get("name"),
                role=user_row.get("user_role"),
            )
            db.add(new_activity)
            await db.flush()
            await db.commit()
            print("Menu delete activity logged successfully.")
        except Exception as e:
            print("Failed to record menu delete activity:", e)

    return menu_row or {"message": "Ingredients updated."}


# Delete menu item by menu_id
@router.delete("/menu/{menu_id}")
async def delete_menu(
    menu_id: int,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
    db=Depends(get_db),
):
    # Delete all menu_ingredients for this menu first
    postgrest_client.table("menu_ingredients").delete().eq("menu_id", menu_id).execute()
    # Then delete the menu item
    res = postgrest_client.table("menu").delete().eq("menu_id", menu_id).execute()
    error = (
        getattr(res, "error", None)
        if hasattr(res, "error")
        else res.get("error") if isinstance(res, dict) else None
    )
    if error:
        raise HTTPException(
            status_code=400, detail=getattr(error, "message", str(error))
        )
    data = (
        getattr(res, "data", None)
        if hasattr(res, "data")
        else res.get("data") if isinstance(res, dict) else None
    )
    if not data or not isinstance(data, list) or len(data) == 0:
        raise HTTPException(
            status_code=404, detail="Menu item not found or already deleted."
        )
    menu_row = data[0]
    menu_row["menu_id"] = menu_row.get("id") or menu_row.get("menu_id")

    try:
        user_row = getattr(user, "user_row", user)
        new_activity = UserActivityLog(
            user_id=user_row.get("user_id"),
            action_type="delete menu item",
            description=f"Deleted menu item: {menu_row.get('dish_name')}",
            activity_date=datetime.utcnow(),
            report_date=datetime.utcnow(),
            user_name=user_row.get("name"),
            role=user_row.get("user_role"),
        )
        db.add(new_activity)
        await db.flush()
        await db.commit()
        print("Menu delete activity logged successfully.")
    except Exception as e:
        print("Failed to record menu delete activity:", e)

    return {"message": "Menu item deleted successfully.", "menu": menu_row}


@router.patch("/menu/{menu_id}/update-with-image-and-ingredients")
async def update_menu_with_image_and_ingredients(
    menu_id: int,
    dish_name: str = Form(...),
    category: str = Form(...),
    price: float = Form(...),
    description: Optional[str] = Form(None),
    stock_status: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    ingredients: str = Form(...),
):
    try:
        # Handle image upload if a new file is provided
        public_url = None
        if file:
            ext = file.filename.split(".")[-1]
            filename = f"menu/{uuid.uuid4()}.{ext}"
            content = await file.read()
            res = supabase.storage.from_("menu-images").upload(filename, content)
            if hasattr(res, "error") and res.error:
                raise HTTPException(
                    status_code=400,
                    detail=f"Image upload failed: {getattr(res.error, 'message', res.error)}",
                )
            if hasattr(res, "data") and not res.data:
                raise HTTPException(
                    status_code=400,
                    detail="Image upload failed: No data returned from upload.",
                )
            public_url = supabase.storage.from_("menu-images").get_public_url(filename)

        # Prepare update data
        update_data = {
            "dish_name": dish_name,
            "category": category,
            "price": float(price),
            "description": description,
            "stock_status": stock_status,
            "updated_at": datetime.utcnow().isoformat(),
        }
        if public_url:
            update_data["image_url"] = public_url

        # Update menu table
        res = (
            postgrest_client.table("menu").update(update_data).eq("menu_id", menu_id).execute()
        )
        error = (
            getattr(res, "error", None)
            if hasattr(res, "error")
            else res.get("error") if isinstance(res, dict) else None
        )
        if error:
            raise HTTPException(
                status_code=400, detail=getattr(error, "message", str(error))
            )
        data = (
            getattr(res, "data", None)
            if hasattr(res, "data")
            else res.get("data") if isinstance(res, dict) else None
        )
        if not data or not isinstance(data, list) or len(data) == 0:
            raise HTTPException(status_code=404, detail="Menu item not found.")
        menu_row = data[0]
        menu_row["menu_id"] = menu_row.get("id") or menu_row.get("menu_id")

        # Update ingredients
        try:
            ingredients_list = json.loads(ingredients)
        except Exception as e:
            raise HTTPException(
                status_code=400, detail=f"Invalid ingredients format: {str(e)}"
            )

        # Remove all existing menu_ingredients for this menu
        postgrest_client.table("menu_ingredients").delete().eq("menu_id", menu_id).execute()

        # Insert new menu_ingredients if any
        menu_ingredients = []
        for ing in ingredients_list:
            name = ing.get("name")
            quantity = ing.get("quantity")
            measurements = ing.get("measurement") or ing.get("measurements")
            if not name or not quantity:
                continue
            search_res = (
                postgrest_client.table("ingredients")
                .select("ingredient_id")
                .ilike("ingredient_name", name)
                .limit(1)
                .execute()
            )
            ingredient_id = None
            search_data = (
                getattr(search_res, "data", None)
                if hasattr(search_res, "data")
                else search_res.get("data") if isinstance(search_res, dict) else None
            )
            if search_data and isinstance(search_data, list) and len(search_data) > 0:
                ingredient_id = search_data[0].get("ingredient_id")
            if not ingredient_id:
                create_res = (
                    postgrest_client.table("ingredients")
                    .insert({"ingredient_name": name})
                    .execute()
                )
                create_data = (
                    getattr(create_res, "data", None)
                    if hasattr(create_res, "data")
                    else (
                        create_res.get("data") if isinstance(create_res, dict) else None
                    )
                )
                if (
                    create_data
                    and isinstance(create_data, list)
                    and len(create_data) > 0
                ):
                    ingredient_id = create_data[0].get("ingredient_id")
            if not ingredient_id:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to create or find ingredient: {name}",
                )
            menu_ingredients.append(
                {
                    "menu_id": menu_id,
                    "ingredient_id": ingredient_id,
                    "ingredient_name": name,
                    "quantity": quantity,
                    "measurements": measurements,
                }
            )

        if menu_ingredients:
            res_ing = (
                postgrest_client.table("menu_ingredients").insert(menu_ingredients).execute()
            )
            err_ing = (
                getattr(res_ing, "error", None)
                if hasattr(res_ing, "error")
                else res_ing.get("error") if isinstance(res_ing, dict) else None
            )
            if err_ing:
                raise HTTPException(
                    status_code=400,
                    detail=f"Ingredient insert failed: {getattr(err_ing, 'message', str(err_ing))}",
                )

        return menu_row
    except Exception as e:
        import traceback

        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/menu/{menu_id}")
def get_menu_by_id(menu_id: int):
    res = postgrest_client.table("menu").select("*").eq("menu_id", menu_id).single().execute()
    error = (
        getattr(res, "error", None)
        if hasattr(res, "error")
        else res.get("error") if isinstance(res, dict) else None
    )
    if error:
        raise HTTPException(
            status_code=404, detail=getattr(error, "message", str(error))
        )
    data = (
        getattr(res, "data", None)
        if hasattr(res, "data")
        else res.get("data") if isinstance(res, dict) else None
    )
    if not data:
        raise HTTPException(status_code=404, detail="Menu item not found.")

    # Fetch ingredients for this menu item with availability information
    ing_res = (
        postgrest_client.table("menu_ingredients")
        .select("menu_id,ingredient_id,ingredient_name,quantity")
        .eq("menu_id", menu_id)
        .execute()
    )
    ing_data = (
        getattr(ing_res, "data", None)
        if hasattr(ing_res, "data")
        else ing_res.get("data") if isinstance(ing_res, dict) else None
    )

    # Check availability for each ingredient and calculate stock status
    ingredients_with_availability = []
    all_in_stock = True

    for ing in ing_data or []:
        ing_name = ing.get("ingredient_name") or ing.get("name")
        stock = 0
        expired = False

        # Check inventory
        inv = (
            postgrest_client.table("inventory")
            .select("stock_quantity,expiration_date")
            .ilike("item_name", ing_name)
            .limit(1)
            .execute()
        )
        if inv.data and len(inv.data) > 0:
            stock += inv.data[0].get("stock_quantity", 0) or 0
            expiry = inv.data[0].get("expiration_date")
            if expiry:
                try:
                    if (
                        datetime.strptime(expiry, "%Y-%m-%d").date()
                        < datetime.now().date()
                    ):
                        expired = True
                except Exception:
                    pass

        # Check inventory_surplus
        surplus = (
            postgrest_client.table("inventory_surplus")
            .select("stock_quantity,expiration_date")
            .ilike("item_name", ing_name)
            .limit(1)
            .execute()
        )
        if surplus.data and len(surplus.data) > 0:
            stock += surplus.data[0].get("stock_quantity", 0) or 0
            expiry = surplus.data[0].get("expiration_date")
            if expiry:
                try:
                    if (
                        datetime.strptime(expiry, "%Y-%m-%d").date()
                        < datetime.now().date()
                    ):
                        expired = True
                except Exception:
                    pass

        # Check inventory_today
        today = (
            postgrest_client.table("inventory_today")
            .select("stock_quantity,expiration_date")
            .ilike("item_name", ing_name)
            .limit(1)
            .execute()
        )
        if today.data and len(today.data) > 0:
            stock += today.data[0].get("stock_quantity", 0) or 0
            expiry = today.data[0].get("expiration_date")
            if expiry:
                try:
                    if (
                        datetime.strptime(expiry, "%Y-%m-%d").date()
                        < datetime.now().date()
                    ):
                        expired = True
                except Exception:
                    pass

        # Determine detailed availability status for this ingredient
        available_stock = 0
        total_stock = 0
        expired_stock = 0
        unavailable_reason = None

        # Check all inventory tables for detailed stock information
        for table_name in ["inventory", "inventory_surplus", "inventory_today"]:
            table_res = (
                postgrest_client.table(table_name)
                .select("stock_quantity,expiration_date")
                .ilike("item_name", ing_name)
                .execute()
            )
            for item in table_res.data or []:
                item_stock = item.get("stock_quantity", 0) or 0
                total_stock += item_stock
                expiry = item.get("expiration_date")
                is_expired = False
                if expiry:
                    try:
                        if (
                            datetime.strptime(expiry, "%Y-%m-%d").date()
                            < datetime.now().date()
                        ):
                            is_expired = True
                            expired_stock += item_stock
                    except Exception:
                        pass
                # Only count non-expired stock as available
                if not is_expired:
                    available_stock += item_stock

        # Determine specific unavailability reason
        is_unavailable = False
        if total_stock <= 0:
            is_unavailable = True
            unavailable_reason = "no_stock"
        elif available_stock <= 0 and expired_stock > 0:
            is_unavailable = True
            unavailable_reason = "expired"
        elif (
            available_stock > 0 and available_stock <= 5
        ):  # Consider low stock threshold
            is_unavailable = False  # Still available but low
            unavailable_reason = "low_stock"
        else:
            unavailable_reason = "available"

        if is_unavailable:
            all_in_stock = False

        # Add detailed availability information to ingredient
        ingredient_with_availability = {
            **ing,
            "is_unavailable": is_unavailable,
            "stock_quantity": total_stock,
            "available_stock": available_stock,
            "expired_stock": expired_stock,
            "unavailable_reason": unavailable_reason,
            "is_expired": available_stock <= 0 and expired_stock > 0,
            "is_low_stock": available_stock > 0 and available_stock <= 5,
        }
        ingredients_with_availability.append(ingredient_with_availability)

    data["ingredients"] = ingredients_with_availability

    # Update stock status based on ingredient availability
    new_status = "Available" if all_in_stock else "Out of Stock"
    if data.get("stock_status") != new_status:
        # Update DB if status changed
        update_res = (
            postgrest_client.table("menu")
            .update({"stock_status": new_status})
            .eq("menu_id", menu_id)
            .execute()
        )
        data["stock_status"] = new_status

    return data


# Delete menu ingredient by menu_id and ingredient_id
@router.delete("/menu/{menu_id}/ingredient/{ingredient_id}")
async def delete_menu_ingredient(
    menu_id: int,
    ingredient_id: int,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
    db=Depends(get_db),
):
    # Get ingredient name before deletion
    ing_res = (
        postgrest_client.table("menu_ingredients")
        .select("ingredient_name")
        .eq("menu_id", menu_id)
        .eq("ingredient_id", ingredient_id)
        .single()
        .execute()
    )
    menu_name_res = (
        postgrest_client.table("menu")
        .select("dish_name")
        .eq("menu_id", menu_id)
        .single()
        .execute()
    )
    ing_data = (
        getattr(ing_res, "data", None)
        if hasattr(ing_res, "data")
        else ing_res.get("data") if isinstance(ing_res, dict) else None
    )
    ingredient_name = ing_data.get("ingredient_name") if ing_data else None
    menu_name_data = getattr(menu_name_res, "data", None) if menu_name_res else None
    menu_name = menu_name_data.get("dish_name") if menu_name_data else None

    res = (
        postgrest_client.table("menu_ingredients")
        .delete()
        .eq("menu_id", menu_id)
        .eq("ingredient_id", ingredient_id)
        .execute()
    )
    error = (
        getattr(res, "error", None)
        if hasattr(res, "error")
        else res.get("error") if isinstance(res, dict) else None
    )
    if error:
        raise HTTPException(
            status_code=400, detail=getattr(error, "message", str(error))
        )
    try:
        user_row = getattr(user, "user_row", user)
        new_activity = UserActivityLog(
            user_id=user_row.get("user_id"),
            action_type="delete menu ingredient",
            description=f"Deleted ingredient '{ingredient_name}' from menu {menu_name}",
            activity_date=datetime.utcnow(),
            report_date=datetime.utcnow(),
            user_name=user_row.get("name"),
            role=user_row.get("user_role"),
        )
        db.add(new_activity)
        await db.flush()
        await db.commit()
        print("Menu ingredient delete activity logged successfully.")
    except Exception as e:
        print("Failed to record menu ingredient delete activity:", e)
    return {"message": f"Ingredient '{ingredient_name}' deleted from menu."}


@router.post("/menu/recalculate-stock-status")
def recalculate_stock_status():
    """
    New recalc logic (menu-centric):
    - Aggregates non-expired inventory across inventory, inventory_surplus, inventory_today by ingredient_id
    - Uses inventory_settings to convert quantities to a base UoM per ingredient
    - Computes max sellable portions per menu as min(floor(total_base / qty_per_portion_base)) across gating ingredients
    - Updates menu.stock_status and (optionally) menu.portions_left
    """

    logger = logging.getLogger("app.routes.menu.recalc")

    def to_base(qty, from_uom, ing_id, settings_map):
        """Convert qty (from_uom) to the ingredient's base_uom using inventory_settings mapping.
        Returns converted qty (float) or None if conversion not possible.
        """
        if qty is None:
            return None
        try:
            qty = float(qty)
        except Exception:
            return None

        settings = settings_map.get(ing_id)
        # If no settings, cannot convert reliably
        if not settings:
            # try common conversions heuristics if from_uom looks like kg/g/L/ml
            base = None
            conv = None
        else:
            base = settings.get("base_uom")
            convs = settings.get("conversions")
            # If conversions stored as JSON string, try parse
            if isinstance(convs, str):
                try:
                    import json as _json

                    convs = _json.loads(convs)
                except Exception:
                    convs = None

        # If no settings or no base, try simple common conversions
        if not settings or not base:
            # common pairs
            simple = {
                ("kg", "g"): 1000,
                ("g", "kg"): 1 / 1000,
                ("l", "ml"): 1000,
                ("ml", "l"): 1 / 1000,
            }
            if from_uom and from_uom.lower() == "pcs":
                return qty
            # if from_uom equals base unknown, return qty
            # fallback: if from_uom in simple mapping to a guessed base, apply if obvious
            for (a, b), f in simple.items():
                if from_uom and from_uom.lower() == a and base and b == base:
                    return qty * f
            # try same-unit passthrough
            return qty

        # If from_uom equals base
        if not from_uom or from_uom == base:
            return qty

        # If conversion available in settings (e.g., {'kg_to_g':1000} or {'kg->g':1000})
        if convs:
            # try several key formats
            keys = [f"{from_uom}->{base}", f"{from_uom}_to_{base}", f"{from_uom}to{base}"]
            for k in keys:
                if k in convs:
                    try:
                        return qty * float(convs[k])
                    except Exception:
                        pass

        # last-resort common conversions
        lc_from = (from_uom or "").lower()
        lc_base = (base or "").lower()
        simple = {
            ("kg", "g"): 1000,
            ("g", "kg"): 1 / 1000,
            ("l", "ml"): 1000,
            ("ml", "l"): 1 / 1000,
        }
        if (lc_from, lc_base) in simple:
            return qty * simple[(lc_from, lc_base)]

        logger.warning(f"Missing conversion for ingredient {ing_id}: {from_uom} -> {base}")
        return None

    # 1) load all menu_ingredients (single fetch)
    mi_res = postgrest_client.table("menu_ingredients").select("*").execute()
    mi_data = getattr(mi_res, "data", None) or mi_res.get("data") if isinstance(mi_res, dict) else None
    mi_data = mi_data or []

    # Build menu->ingredients mapping and collect ingredient_ids
    menu_map = {}
    ingredient_ids = set()
    legacy_names = set()
    for row in mi_data:
        mid = row.get("menu_id")
        if mid is None:
            continue
        menu_map.setdefault(mid, []).append(row)
        iid = row.get("ingredient_id")
        if iid:
            ingredient_ids.add(iid)
        else:
            name = (row.get("ingredient_name") or row.get("name") or "").strip()
            if name:
                legacy_names.add(name)

    # 2) Try to resolve legacy names to ingredient_id once and update menu_ingredients rows
    name_to_id = {}
    if legacy_names:
        for name in legacy_names:
            try:
                res = (
                    postgrest_client.table("ingredients")
                    .select("ingredient_id,ingredient_name")
                    .ilike("ingredient_name", name)
                    .limit(1)
                    .execute()
                )
                d = getattr(res, "data", None) or res.get("data") if isinstance(res, dict) else None
                if d and isinstance(d, list) and len(d) > 0:
                    found = d[0]
                    iid = found.get("ingredient_id")
                    if iid:
                        name_to_id[name] = iid
                        ingredient_ids.add(iid)
                        # One-time update: set ingredient_id on matching menu_ingredients
                        try:
                            postgrest_client.table("menu_ingredients").update({"ingredient_id": iid}).ilike("ingredient_name", name).execute()
                        except Exception:
                            # best-effort update; ignore failures
                            pass
            except Exception:
                continue

    # 3) Load inventory_settings for these ingredients
    settings_map = {}
    if ingredient_ids:
        try:
            sres = postgrest_client.table("inventory_settings").select("*").in_("ingredient_id", list(ingredient_ids)).execute()
            sdata = getattr(sres, "data", None) or sres.get("data") if isinstance(sres, dict) else None
            for s in sdata or []:
                ing = s.get("ingredient_id")
                if ing:
                    settings_map[ing] = s
        except Exception:
            logger.exception("Failed to load inventory_settings")

    # 4) Aggregate available (non-expired) inventory across three tables
    today = datetime.utcnow().date()
    available_base = {iid: 0.0 for iid in ingredient_ids}

    for table in ["inventory", "inventory_surplus", "inventory_today"]:
        try:
            # fetch rows that have ingredient_id in our set
            if ingredient_ids:
                q = postgrest_client.table(table).select("ingredient_id,ingredient_name,stock_quantity,quantity,remaining_stock,expiration_date,uom,unit").in_("ingredient_id", list(ingredient_ids)).execute()
                rows = getattr(q, "data", None) or q.get("data") if isinstance(q, dict) else None
                rows = rows or []
            else:
                rows = []
        except Exception:
            logger.exception(f"Failed to fetch from {table}")
            rows = []

        for r in rows:
            try:
                exp = r.get("expiration_date")
                if exp:
                    try:
                        if isinstance(exp, str):
                            exp_date = datetime.strptime(exp[:10], "%Y-%m-%d").date()
                        else:
                            exp_date = exp
                        if exp_date < today:
                            continue
                    except Exception:
                        # if parsing fails, be conservative and include the row
                        pass

                iid = r.get("ingredient_id")
                if not iid:
                    continue
                qty = r.get("stock_quantity") or r.get("quantity") or r.get("remaining_stock") or 0
                from_uom = r.get("uom") or r.get("unit")
                conv = to_base(qty, from_uom, iid, settings_map)
                if conv is None:
                    # skip ingredient if cannot convert; don't crash
                    logger.warning(f"Skipping inventory row for ingredient {iid} in {table} due to missing conversion")
                    continue
                available_base[iid] = available_base.get(iid, 0.0) + float(conv)
            except Exception:
                logger.exception("Error processing inventory row")

    # 5) Load ingredient gating information (ingredients.is_gating)
    ingredients_map = {}
    if ingredient_ids:
        try:
            ires = postgrest_client.table("ingredients").select("ingredient_id,is_gating").in_("ingredient_id", list(ingredient_ids)).execute()
            idata = getattr(ires, "data", None) or ires.get("data") if isinstance(ires, dict) else None
            for it in idata or []:
                ingredients_map[it.get("ingredient_id")] = it
        except Exception:
            logger.exception("Failed to load ingredients info")

    # 6) Fetch menus list to update
    mres = postgrest_client.table("menu").select("menu_id,stock_status,portions_left").execute()
    mdata = getattr(mres, "data", None) or mres.get("data") if isinstance(mres, dict) else None
    mdata = mdata or []
    updated = 0

    for m in mdata:
        mid = m.get("menu_id") or m.get("id")
        if mid is None:
            continue
        recipe = menu_map.get(mid, [])
        # compute portions per gating ingredient
        portions_list = []
        for ing in recipe:
            iid = ing.get("ingredient_id") or name_to_id.get((ing.get("ingredient_name") or ing.get("name") or "").strip())
            if not iid:
                logger.warning(f"Menu {mid}: missing ingredient_id for recipe row, skipping")
                continue
            # determine if gating; default True
            ing_info = ingredients_map.get(iid, {})
            is_gating = ing_info.get("is_gating") if ing_info and ing_info.get("is_gating") is not None else True
            if not is_gating:
                continue

            qty_per_portion = ing.get("qty_per_portion") or ing.get("quantity") or ing.get("qty") or 0
            recipe_uom = ing.get("uom") or ing.get("unit")
            if not qty_per_portion or float(qty_per_portion) == 0:
                logger.warning(f"Menu {mid} ingredient {iid}: missing qty_per_portion; skipping from limiting math")
                continue

            qty_per_base = to_base(qty_per_portion, recipe_uom, iid, settings_map)
            if qty_per_base is None or qty_per_base == 0:
                logger.warning(f"Menu {mid} ingredient {iid}: cannot convert recipe qty to base; skipping")
                continue

            total_available = available_base.get(iid, 0.0)
            try:
                possible = math.floor(total_available / float(qty_per_base))
            except Exception:
                possible = 0
            portions_list.append(possible)

        # determine max_portions
        if portions_list:
            max_portions = min(portions_list)
        else:
            # If there are no gating ingredients or none contributed to math, treat as Available but unknown portions
            max_portions = None

        new_status = "Available" if (max_portions is None or max_portions > 0) else "Out of Stock"

        # Update only if changed
        to_update = {}
        if m.get("stock_status") != new_status:
            to_update["stock_status"] = new_status
        # persist portions_left optionally
        if max_portions is not None:
            if m.get("portions_left") != max_portions:
                to_update["portions_left"] = max_portions
        else:
            # if previously set, clear it
            if m.get("portions_left") is not None:
                to_update["portions_left"] = None

        if to_update:
            try:
                postgrest_client.table("menu").update(to_update).eq("menu_id", mid).execute()
                updated += 1
            except Exception:
                logger.exception(f"Failed to update menu {mid}")

    return {"message": f"Stock status recalculation completed. {updated} menu items updated."}
