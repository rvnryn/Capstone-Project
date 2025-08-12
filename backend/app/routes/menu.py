import json
from fastapi import HTTPException, APIRouter, UploadFile, File, Form, Body
from typing import Optional
from app.supabase import supabase 
import uuid
from datetime import datetime

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
):
    try:
        ext = file.filename.split(".")[-1]
        filename = f"menu/{uuid.uuid4()}.{ext}"
        content = await file.read()
        res = supabase.storage.from_("menu-images").upload(filename, content)
        if hasattr(res, 'error') and res.error:
            raise HTTPException(status_code=400, detail=f"Image upload failed: {getattr(res.error, 'message', res.error)}")
        if hasattr(res, 'data') and not res.data:
            raise HTTPException(status_code=400, detail="Image upload failed: No data returned from upload.")
        public_url = supabase.storage.from_("menu-images").get_public_url(filename)

        try:
            ingredients_list = json.loads(ingredients)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid ingredients format: {str(e)}")

        # --- Stock status logic ---
        all_in_stock = True
        for ing in ingredients_list:
            ing_name = ing.get("name") or ing.get("ingredient_name")
            stock = 0
            expired = False

            # Check inventory
            inv = supabase.table("inventory").select("stock_quantity,expiration_date").ilike("item_name", ing_name).limit(1).execute()
            if inv.data and len(inv.data) > 0:
                stock += inv.data[0].get('stock_quantity', 0) or 0
                expiry = inv.data[0].get('expiration_date')
                if expiry:
                    try:
                        if datetime.strptime(expiry, "%Y-%m-%d").date() < datetime.now().date():
                            expired = True
                    except Exception:
                        pass

            # Check inventory_surplus
            surplus = supabase.table("inventory_surplus").select("stock_quantity,expiration_date").ilike("item_name", ing_name).limit(1).execute()
            if surplus.data and len(surplus.data) > 0:
                stock += surplus.data[0].get('stock_quantity', 0) or 0
                expiry = surplus.data[0].get('expiration_date')
                if expiry:
                    try:
                        if datetime.strptime(expiry, "%Y-%m-%d").date() < datetime.now().date():
                            expired = True
                    except Exception:
                        pass

            # Check inventory_today
            today = supabase.table("inventory_today").select("stock_quantity,expiration_date").ilike("item_name", ing_name).limit(1).execute()
            if today.data and len(today.data) > 0:
                stock += today.data[0].get('stock_quantity', 0) or 0
                expiry = today.data[0].get('expiration_date')
                if expiry:
                    try:
                        if datetime.strptime(expiry, "%Y-%m-%d").date() < datetime.now().date():
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
        error = getattr(dbres, 'error', None) if hasattr(dbres, 'error') else dbres.get('error') if isinstance(dbres, dict) else None
        if error:
            raise HTTPException(status_code=400, detail=getattr(error, 'message', str(error)))
        data = getattr(dbres, 'data', None) if hasattr(dbres, 'data') else dbres.get('data') if isinstance(dbres, dict) else None
        if not data or not isinstance(data, list) or len(data) == 0:
            raise HTTPException(status_code=500, detail="Menu creation failed: No data returned.")
        menu_row = data[0]
        menu_id = menu_row.get("id") or menu_row.get("menu_id")
        if not menu_id:
            raise HTTPException(status_code=500, detail="Menu creation failed: No menu_id returned.")
        menu_row["menu_id"] = menu_id
        try:
            ingredients_list = json.loads(ingredients)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid ingredients format: {str(e)}")
        menu_ingredients = []
        for ing in ingredients_list:
            name = ing.get("name")
            quantity = ing.get("quantity")
            if not name or not quantity:
                continue
            search_res = supabase.table("ingredients").select("ingredient_id").ilike("ingredient_name", name).limit(1).execute()
            ingredient_id = None
            search_data = getattr(search_res, 'data', None) if hasattr(search_res, 'data') else search_res.get('data') if isinstance(search_res, dict) else None
            if search_data and isinstance(search_data, list) and len(search_data) > 0:
                ingredient_id = search_data[0].get("ingredient_id")
            if not ingredient_id:
                create_res = supabase.table("ingredients").insert({"ingredient_name": name}).execute()
                create_data = getattr(create_res, 'data', None) if hasattr(create_res, 'data') else create_res.get('data') if isinstance(create_res, dict) else None
                if create_data and isinstance(create_data, list) and len(create_data) > 0:
                    ingredient_id = create_data[0].get("ingredient_id")
            if not ingredient_id:
                raise HTTPException(status_code=500, detail=f"Failed to create or find ingredient: {name}")
            menu_ingredients.append({
                "menu_id": menu_id,
                "ingredient_id": ingredient_id,
                "ingredient_name": name,
                "quantity": quantity
            })
        if menu_ingredients:
            res_ing = supabase.table("menu_ingredients").insert(menu_ingredients).execute()
            err_ing = getattr(res_ing, 'error', None) if hasattr(res_ing, 'error') else res_ing.get('error') if isinstance(res_ing, dict) else None
            if err_ing:
                raise HTTPException(status_code=400, detail=f"Ingredient insert failed: {getattr(err_ing, 'message', str(err_ing))}")
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
    error = getattr(res, 'error', None) if hasattr(res, 'error') else res.get('error') if isinstance(res, dict) else None
    if error:
        raise HTTPException(status_code=400, detail=getattr(error, 'message', str(error)))
    data = getattr(res, 'data', None) if hasattr(res, 'data') else res.get('data') if isinstance(res, dict) else None
    if not data:
        return []
    
    # Get all menu_ids
    menu_ids = [item.get('id') or item.get('menu_id') for item in data]
    # Fetch all menu_ingredients for these menu_ids
    if menu_ids:
        ing_res = supabase.table("menu_ingredients").select("menu_id,ingredient_id,ingredient_name,quantity").in_("menu_id", menu_ids).execute()
        ing_error = getattr(ing_res, 'error', None) if hasattr(ing_res, 'error') else ing_res.get('error') if isinstance(ing_res, dict) else None
        if ing_error:
            raise HTTPException(status_code=400, detail=getattr(ing_error, 'message', str(ing_error)))
        ing_data = getattr(ing_res, 'data', None) if hasattr(ing_res, 'data') else ing_res.get('data') if isinstance(ing_res, dict) else None
        # Group ingredients by menu_id
        ing_map = {}
        for ing in ing_data or []:
            mid = ing.get('menu_id')
            if mid not in ing_map:
                ing_map[mid] = []
            ing_map[mid].append(ing)
        # Attach ingredients to each menu item
        for item in data:
            mid = item.get('id') or item.get('menu_id')
            item['menu_id'] = item.get('menu_id', item.get('id'))
            item['ingredients'] = ing_map.get(mid, [])
            all_in_stock = True
            for ing in item['ingredients']:
                ing_name = ing.get('ingredient_name') or ing.get('name')
                # Check inventory tables
                stock = 0
                expired = False

                # Check inventory
                inv = supabase.table("inventory").select("stock_quantity,expiration_date").ilike("item_name", ing_name).limit(1).execute()
                if inv.data and len(inv.data) > 0:
                    stock += inv.data[0].get('stock_quantity', 0) or 0
                    expiry = inv.data[0].get('expiration_date')
                    if expiry:
                        try:
                            if datetime.strptime(expiry, "%Y-%m-%d").date() < datetime.now().date():
                                expired = True
                        except Exception:
                            pass

                # Check inventory_surplus
                surplus = supabase.table("inventory_surplus").select("stock_quantity,expiration_date").ilike("item_name", ing_name).limit(1).execute()
                if surplus.data and len(surplus.data) > 0:
                    stock += surplus.data[0].get('stock_quantity', 0) or 0
                    expiry = surplus.data[0].get('expiration_date')
                    if expiry:
                        try:
                            if datetime.strptime(expiry, "%Y-%m-%d").date() < datetime.now().date():
                                expired = True
                        except Exception:
                            pass

                # Check inventory_today
                today = supabase.table("inventory_today").select("stock_quantity,expiration_date").ilike("item_name", ing_name).limit(1).execute()
                if today.data and len(today.data) > 0:
                    stock += today.data[0].get('stock_quantity', 0) or 0
                    expiry = today.data[0].get('expiration_date')
                    if expiry:
                        try:
                            if datetime.strptime(expiry, "%Y-%m-%d").date() < datetime.now().date():
                                expired = True
                        except Exception:
                            pass

                # If any ingredient is expired or out of stock, mark as not available
                if expired or not stock or stock <= 0:
                    all_in_stock = False
                    break

            item['stock_status'] = "Available" if all_in_stock else "Out of Stock"
    else:
        for item in data:
            item['menu_id'] = item.get('menu_id', item.get('id'))
            item['ingredients'] = []
    return data

@router.patch("/menu/{menu_id}")
def update_menu(menu_id: int, menu_update: dict = Body(...)):
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
            search_res = supabase.table("ingredients").select("ingredient_id").ilike("ingredient_name", name).limit(1).execute()
            ingredient_id = None
            search_data = getattr(search_res, 'data', None) if hasattr(search_res, 'data') else search_res.get('data') if isinstance(search_res, dict) else None
            if search_data and isinstance(search_data, list) and len(search_data) > 0:
                ingredient_id = search_data[0].get("ingredient_id")
            if not ingredient_id:
                create_res = supabase.table("ingredients").insert({"ingredient_name": name}).execute()
                create_data = getattr(create_res, 'data', None) if hasattr(create_res, 'data') else create_res.get('data') if isinstance(create_res, dict) else None
                if create_data and isinstance(create_data, list) and len(create_data) > 0:
                    ingredient_id = create_data[0].get("ingredient_id")
            if not ingredient_id:
                raise HTTPException(status_code=500, detail=f"Failed to create or find ingredient: {name}")
            menu_ingredients.append({
                "menu_id": menu_id,
                "ingredient_id": ingredient_id,
                "ingredient_name": name,
                "quantity": quantity
            })
        if menu_ingredients:
            res_ing = supabase.table("menu_ingredients").insert(menu_ingredients).execute()
            err_ing = getattr(res_ing, 'error', None) if hasattr(res_ing, 'error') else res_ing.get('error') if isinstance(res_ing, dict) else None
            if err_ing:
                raise HTTPException(status_code=400, detail=f"Ingredient insert failed: {getattr(err_ing, 'message', str(err_ing))}")
    if not update_data and ingredients is None:
        raise HTTPException(status_code=400, detail="No valid fields to update.")
    # Only update menu if update_data is present
    menu_row = None
    if update_data:
        res = supabase.table("menu").update(update_data).eq("menu_id", menu_id).execute()
        error = getattr(res, 'error', None) if hasattr(res, 'error') else res.get('error') if isinstance(res, dict) else None
        if error:
            raise HTTPException(status_code=400, detail=getattr(error, 'message', str(error)))
        data = getattr(res, 'data', None) if hasattr(res, 'data') else res.get('data') if isinstance(res, dict) else None
        if not data or not isinstance(data, list) or len(data) == 0:
            raise HTTPException(status_code=404, detail="Menu item not found.")
        menu_row = data[0]
        menu_row["menu_id"] = menu_row.get("id") or menu_row.get("menu_id")
    return menu_row or {"message": "Ingredients updated."}

# Delete menu item by menu_id
@router.delete("/menu/{menu_id}")
def delete_menu(menu_id: int):
    # Delete all menu_ingredients for this menu first
    supabase.table("menu_ingredients").delete().eq("menu_id", menu_id).execute()
    # Then delete the menu item
    res = supabase.table("menu").delete().eq("menu_id", menu_id).execute()
    error = getattr(res, 'error', None) if hasattr(res, 'error') else res.get('error') if isinstance(res, dict) else None
    if error:
        raise HTTPException(status_code=400, detail=getattr(error, 'message', str(error)))
    data = getattr(res, 'data', None) if hasattr(res, 'data') else res.get('data') if isinstance(res, dict) else None
    if not data or not isinstance(data, list) or len(data) == 0:
        raise HTTPException(status_code=404, detail="Menu item not found or already deleted.")
    menu_row = data[0]
    menu_row["menu_id"] = menu_row.get("id") or menu_row.get("menu_id")
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
        # 1. Handle image upload if a new file is provided
        public_url = None
        if file:
            ext = file.filename.split(".")[-1]
            filename = f"menu/{uuid.uuid4()}.{ext}"
            content = await file.read()
            res = supabase.storage.from_("menu-images").upload(filename, content)
            if hasattr(res, 'error') and res.error:
                raise HTTPException(status_code=400, detail=f"Image upload failed: {getattr(res.error, 'message', res.error)}")
            if hasattr(res, 'data') and not res.data:
                raise HTTPException(status_code=400, detail="Image upload failed: No data returned from upload.")
            public_url = supabase.storage.from_("menu-images").get_public_url(filename)

        # 2. Prepare update data
        update_data = {
            "dish_name": dish_name,
            "category": category,
            "price": float(price),
            "stock_status": stock_status,
        }
        if public_url:
            update_data["image_url"] = public_url

        # 3. Update menu table
        res = supabase.table("menu").update(update_data).eq("menu_id", menu_id).execute()
        error = getattr(res, 'error', None) if hasattr(res, 'error') else res.get('error') if isinstance(res, dict) else None
        if error:
            raise HTTPException(status_code=400, detail=getattr(error, 'message', str(error)))
        data = getattr(res, 'data', None) if hasattr(res, 'data') else res.get('data') if isinstance(res, dict) else None
        if not data or not isinstance(data, list) or len(data) == 0:
            raise HTTPException(status_code=404, detail="Menu item not found.")
        menu_row = data[0]
        menu_row["menu_id"] = menu_row.get("id") or menu_row.get("menu_id")

        # 4. Update ingredients
        try:
            ingredients_list = json.loads(ingredients)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid ingredients format: {str(e)}")
        # Remove all existing menu_ingredients for this menu
        supabase.table("menu_ingredients").delete().eq("menu_id", menu_id).execute()
        # Insert new menu_ingredients if any
        menu_ingredients = []
        for ing in ingredients_list:
            name = ing.get("name")
            quantity = ing.get("quantity")
            if not name or not quantity:
                continue
            search_res = supabase.table("ingredients").select("ingredient_id").ilike("ingredient_name", name).limit(1).execute()
            ingredient_id = None
            search_data = getattr(search_res, 'data', None) if hasattr(search_res, 'data') else search_res.get('data') if isinstance(search_res, dict) else None
            if search_data and isinstance(search_data, list) and len(search_data) > 0:
                ingredient_id = search_data[0].get("ingredient_id")
            if not ingredient_id:
                create_res = supabase.table("ingredients").insert({"ingredient_name": name}).execute()
                create_data = getattr(create_res, 'data', None) if hasattr(create_res, 'data') else create_res.get('data') if isinstance(create_res, dict) else None
                if create_data and isinstance(create_data, list) and len(create_data) > 0:
                    ingredient_id = create_data[0].get("ingredient_id")
            if not ingredient_id:
                raise HTTPException(status_code=500, detail=f"Failed to create or find ingredient: {name}")
            menu_ingredients.append({
                "menu_id": menu_id,
                "ingredient_id": ingredient_id,
                "ingredient_name": name,
                "quantity": quantity
            })
        if menu_ingredients:
            res_ing = supabase.table("menu_ingredients").insert(menu_ingredients).execute()
            err_ing = getattr(res_ing, 'error', None) if hasattr(res_ing, 'error') else res_ing.get('error') if isinstance(res_ing, dict) else None
            if err_ing:
                raise HTTPException(status_code=400, detail=f"Ingredient insert failed: {getattr(err_ing, 'message', str(err_ing))}")

        return menu_row
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/menu/{menu_id}")
def get_menu_by_id(menu_id: int):
    res = supabase.table("menu").select("*").eq("menu_id", menu_id).single().execute()
    error = getattr(res, 'error', None) if hasattr(res, 'error') else res.get('error') if isinstance(res, dict) else None
    if error:
        raise HTTPException(status_code=404, detail=getattr(error, 'message', str(error)))
    data = getattr(res, 'data', None) if hasattr(res, 'data') else res.get('data') if isinstance(res, dict) else None
    if not data:
        raise HTTPException(status_code=404, detail="Menu item not found.")

    # Optionally, fetch ingredients for this menu item
    ing_res = supabase.table("menu_ingredients").select("menu_id,ingredient_id,ingredient_name,quantity").eq("menu_id", menu_id).execute()
    ing_data = getattr(ing_res, 'data', None) if hasattr(ing_res, 'data') else ing_res.get('data') if isinstance(ing_res, dict) else None
    data["ingredients"] = ing_data or []

    return data
