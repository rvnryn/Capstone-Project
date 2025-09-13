from app.supabase import supabase

# Check menu items that are out of stock
print("=== MENU ITEMS OUT OF STOCK ===")
menu_res = (
    supabase.table("menu").select("*").eq("stock_status", "Out of Stock").execute()
)
print(f"Found {len(menu_res.data)} out of stock items")

for item in menu_res.data[:2]:  # Just first 2 items
    menu_id = item.get("id") or item.get("menu_id")
    print(f'Menu: {item["dish_name"]} (ID: {menu_id})')

    # Get ingredients for this menu
    ing_res = (
        supabase.table("menu_ingredients").select("*").eq("menu_id", menu_id).execute()
    )
    print(f"  Ingredients: {len(ing_res.data)}")

    for ing in ing_res.data:
        ing_name = ing["ingredient_name"]
        print(f'    - {ing_name} (qty: {ing["quantity"]})')

        # Check inventory for this ingredient
        inv_res = (
            supabase.table("inventory")
            .select("item_name,stock_quantity")
            .ilike("item_name", ing_name)
            .execute()
        )
        print(f"      Inventory matches: {len(inv_res.data)}")
        for inv in inv_res.data:
            print(f'        {inv["item_name"]}: {inv["stock_quantity"]}')

        # Also check inventory_surplus and inventory_today
        surplus_res = (
            supabase.table("inventory_surplus")
            .select("item_name,stock_quantity")
            .ilike("item_name", ing_name)
            .execute()
        )
        today_res = (
            supabase.table("inventory_today")
            .select("item_name,stock_quantity")
            .ilike("item_name", ing_name)
            .execute()
        )

        total_stock = 0
        if inv_res.data:
            total_stock += sum(
                inv.get("stock_quantity", 0) or 0 for inv in inv_res.data
            )
        if surplus_res.data:
            total_stock += sum(
                inv.get("stock_quantity", 0) or 0 for inv in surplus_res.data
            )
        if today_res.data:
            total_stock += sum(
                inv.get("stock_quantity", 0) or 0 for inv in today_res.data
            )

        print(f"      Total stock across all tables: {total_stock}")
    print()

# Also check if there are any items with stock that should be available
print("\n=== CHECKING SAMPLE INVENTORY ===")
inv_sample = (
    supabase.table("inventory").select("item_name,stock_quantity").limit(5).execute()
)
for inv in inv_sample.data:
    print(f'{inv["item_name"]}: {inv["stock_quantity"]}')
