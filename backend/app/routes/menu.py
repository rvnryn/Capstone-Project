import json
from fastapi import (
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
from app.supabase import supabase, get_db
import uuid
from datetime import datetime
from app.routes.userActivity import UserActivityLog
from app.utils.rbac import require_role

router = APIRouter()


class MenuItem:
    pass  # Use your existing Pydantic MenuItem if needed for response_model


# Endpoint: create menu (with image) and its ingredients in one request
@router.post("/menu/create-with-image-and-ingredients")
async def create_menu_with_ingredients(
    dish_name: str = Form(...),
    category: str = Form(...),
    price: float = Form(...),
    stock_status: Optional[str] = Form(None),  # This will be overwritten below
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
                supabase.table("inventory")
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
                supabase.table("inventory_surplus")
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
                supabase.table("inventory_today")
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

        menu_data = {
            "dish_name": dish_name,
            "image_url": public_url,
            "category": category,
            "price": float(price),
            "stock_status": stock_status,
        }
        dbres = supabase.table("menu").insert(menu_data).execute()
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
            if not name or not quantity:
                continue
            search_res = (
                supabase.table("ingredients")
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
                    supabase.table("ingredients")
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
                supabase.table("menu_ingredients").insert(menu_ingredients).execute()
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
def get_menu():
    # Fetch all menu items
    res = supabase.table("menu").select("*").execute()
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

    # Get all menu_ids
    menu_ids = [item.get("id") or item.get("menu_id") for item in data]
    # Fetch all menu_ingredients for these menu_ids
    if menu_ids:
        ing_res = (
            supabase.table("menu_ingredients")
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
        # Group ingredients by menu_id
        ing_map = {}
        for ing in ing_data or []:
            mid = ing.get("menu_id")
            if mid not in ing_map:
                ing_map[mid] = []
            ing_map[mid].append(ing)
        # Attach ingredients to each menu item
        for item in data:
            mid = item.get("id") or item.get("menu_id")
            item["menu_id"] = item.get("menu_id", item.get("id"))
            item["ingredients"] = ing_map.get(mid, [])
            all_in_stock = True
            for ing in item["ingredients"]:
                ing_name = ing.get("ingredient_name") or ing.get("name")
                # Check inventory tables
                stock = 0
                expired = False

                # Check inventory
                inv = (
                    supabase.table("inventory")
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
                    supabase.table("inventory_surplus")
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
                    supabase.table("inventory_today")
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

            item["stock_status"] = "Available" if all_in_stock else "Out of Stock"
            new_status = "Available" if all_in_stock else "Out of Stock"
            if item.get("stock_status") != new_status:
                # Update DB if status changed
                update_res = (
                    supabase.table("menu")
                    .update({"stock_status": new_status})
                    .eq("menu_id", mid)
                    .execute()
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
                        f"Failed to update stock_status for menu_id {mid}: {update_error}"
                    )
            item["stock_status"] = new_status
    else:
        for item in data:
            item["menu_id"] = item.get("menu_id", item.get("id"))
            item["ingredients"] = []
    return data


@router.patch("/menu/{menu_id}")
async def update_menu(
    menu_id: int,
    menu_update: dict = Body(...),
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
    db=Depends(get_db),
):
    import json

    # Only allow updating certain fields
    allowed_fields = {"dish_name", "image_url", "category", "price", "stock_status"}
    update_data = {k: v for k, v in menu_update.items() if k in allowed_fields}
    # Handle ingredients update if provided
    ingredients = menu_update.get("ingredients")
    if ingredients is not None:
        # Remove all existing menu_ingredients for this menu
        supabase.table("menu_ingredients").delete().eq("menu_id", menu_id).execute()
        # Insert new menu_ingredients if any
        menu_ingredients = []
        for ing in ingredients:
            name = ing.get("name") or ing.get("ingredient_name")
            quantity = ing.get("quantity")
            if not name or not quantity:
                continue
            # Find or create ingredient_id
            search_res = (
                supabase.table("ingredients")
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
                    supabase.table("ingredients")
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
                supabase.table("menu_ingredients").insert(menu_ingredients).execute()
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
            supabase.table("menu").update(update_data).eq("menu_id", menu_id).execute()
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
    supabase.table("menu_ingredients").delete().eq("menu_id", menu_id).execute()
    # Then delete the menu item
    res = supabase.table("menu").delete().eq("menu_id", menu_id).execute()
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
            "stock_status": stock_status,
        }
        if public_url:
            update_data["image_url"] = public_url

        # Update menu table
        res = (
            supabase.table("menu").update(update_data).eq("menu_id", menu_id).execute()
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
        supabase.table("menu_ingredients").delete().eq("menu_id", menu_id).execute()
        # Insert new menu_ingredients if any
        menu_ingredients = []
        for ing in ingredients_list:
            name = ing.get("name")
            quantity = ing.get("quantity")
            if not name or not quantity:
                continue
            search_res = (
                supabase.table("ingredients")
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
                    supabase.table("ingredients")
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
                supabase.table("menu_ingredients").insert(menu_ingredients).execute()
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
    res = supabase.table("menu").select("*").eq("menu_id", menu_id).single().execute()
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

    # Optionally, fetch ingredients for this menu item
    ing_res = (
        supabase.table("menu_ingredients")
        .select("menu_id,ingredient_id,ingredient_name,quantity")
        .eq("menu_id", menu_id)
        .execute()
    )
    ing_data = (
        getattr(ing_res, "data", None)
        if hasattr(ing_res, "data")
        else ing_res.get("data") if isinstance(ing_res, dict) else None
    )
    data["ingredients"] = ing_data or []

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
        supabase.table("menu_ingredients")
        .select("ingredient_name")
        .eq("menu_id", menu_id)
        .eq("ingredient_id", ingredient_id)
        .single()
        .execute()
    )
    menu_name_res = (
        supabase.table("menu")
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
        supabase.table("menu_ingredients")
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
    # Instantly recalculate and update stock status for all menu items
    # 1. Fetch all inventory data from all tables
    inventory_data = []
    for table in ["inventory", "inventory_surplus", "inventory_today"]:
        res = (
            supabase.table(table)
            .select("item_name,stock_quantity,expiration_date")
            .execute()
        )
        data = (
            getattr(res, "data", None)
            if hasattr(res, "data")
            else res.get("data") if isinstance(res, dict) else None
        )
        if data:
            inventory_data.extend(data)

    # 2. Build a lookup map for item_name -> {stock, expired}
    inventory_map = {}
    for row in inventory_data:
        name = row.get("item_name")
        stock = row.get("stock_quantity", 0) or 0
        expiry = row.get("expiration_date")
        if not name:
            continue
        if name not in inventory_map:
            inventory_map[name] = {"stock": 0, "expired": False}
        inventory_map[name]["stock"] += stock
        if expiry:
            try:
                if datetime.strptime(expiry, "%Y-%m-%d").date() < datetime.now().date():
                    inventory_map[name]["expired"] = True
            except Exception:
                pass

    # 3. Fetch all menu items and ingredients
    res = supabase.table("menu").select("*").execute()
    data = (
        getattr(res, "data", None)
        if hasattr(res, "data")
        else res.get("data") if isinstance(res, dict) else None
    )
    if not data:
        return {"message": "No menu items found."}
    menu_ids = [item.get("id") or item.get("menu_id") for item in data]
    if not menu_ids:
        return {"message": "No menu items found."}
    ing_res = (
        supabase.table("menu_ingredients")
        .select("menu_id,ingredient_id,ingredient_name,quantity")
        .in_("menu_id", menu_ids)
        .execute()
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

    # 4. For each menu item, check ingredients against inventory_map and update instantly
    updated = 0
    for item in data:
        mid = item.get("id") or item.get("menu_id")
        ingredients = ing_map.get(mid, [])
        all_in_stock = True
        for ing in ingredients:
            ing_name = ing.get("ingredient_name") or ing.get("name")
            inv_info = inventory_map.get(ing_name)
            stock = inv_info["stock"] if inv_info else 0
            expired = inv_info["expired"] if inv_info else False
            if expired or not stock or stock <= 0:
                all_in_stock = False
                break
        new_status = "Available" if all_in_stock else "Out of Stock"
        if item.get("stock_status") != new_status:
            print(f"Updating menu_id {mid}: {item.get('stock_status')} -> {new_status}")
            supabase.table("menu").update({"stock_status": new_status}).eq(
                "menu_id", mid
            ).execute()
            updated += 1

    return {
        "message": f"Stock status recalculation completed. {updated} menu items updated."
    }
