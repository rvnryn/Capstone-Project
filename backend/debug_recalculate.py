import sys

sys.path.append(".")

from app.supabase import supabase
from datetime import datetime

print("=== DEBUGGING RECALCULATION LOGIC ===")

# 1. Build inventory map exactly like the recalculate function
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

print("Inventory map:")
for name, info in inventory_map.items():
    print(f"  {name}: stock={info['stock']}, expired={info['expired']}")

# 2. Check menu items
res = supabase.table("menu").select("*").execute()
data = (
    getattr(res, "data", None)
    if hasattr(res, "data")
    else res.get("data") if isinstance(res, dict) else None
)
if not data:
    print("No menu items found!")
    exit()

menu_ids = [item.get("id") or item.get("menu_id") for item in data]
print(f"\nMenu IDs: {menu_ids}")

# 3. Check ingredients
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

print(f"\nIngredients map:")
for mid, ingredients in ing_map.items():
    print(f"  Menu ID {mid}: {[ing['ingredient_name'] for ing in ingredients]}")

# 4. Check each menu item
print(f"\n=== CHECKING EACH MENU ITEM ===")
for item in data:
    mid = item.get("id") or item.get("menu_id")
    print(f"\nMenu: {item['dish_name']} (ID: {mid})")
    print(f"  Current stock_status: {item.get('stock_status')}")
    print(f"  Database keys: {list(item.keys())}")

    ingredients = ing_map.get(mid, [])
    print(f"  Ingredients: {len(ingredients)}")

    all_in_stock = True
    for ing in ingredients:
        ing_name = ing.get("ingredient_name") or ing.get("name")
        print(f"    - {ing_name} (qty: {ing.get('quantity')})")

        inv_info = inventory_map.get(ing_name)
        stock = inv_info["stock"] if inv_info else 0
        expired = inv_info["expired"] if inv_info else False
        print(f"      Available stock: {stock}, expired: {expired}")

        if expired or not stock or stock <= 0:
            all_in_stock = False
            print(f"      -> UNAVAILABLE")
        else:
            print(f"      -> AVAILABLE")

    new_status = "Available" if all_in_stock else "Out of Stock"
    print(f"  Calculated status: {new_status}")
    print(f"  Should update? {item.get('stock_status') != new_status}")
