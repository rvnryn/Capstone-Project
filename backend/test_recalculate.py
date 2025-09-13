import sys

sys.path.append(".")

from app.supabase import supabase
from app.routes.menu import recalculate_stock_status

print("=== BEFORE RECALCULATION ===")
# Check current stock status
menu_res = (
    supabase.table("menu").select("*").eq("stock_status", "Out of Stock").execute()
)
print(f"Items currently out of stock: {len(menu_res.data)}")
for item in menu_res.data:
    print(f"- {item['dish_name']}: {item['stock_status']}")

print("\n=== RUNNING RECALCULATION ===")
# Call the recalculate function directly
try:
    result = recalculate_stock_status()
    print(f"Recalculation result: {result}")
except Exception as e:
    print(f"Error during recalculation: {e}")
    import traceback

    traceback.print_exc()

print("\n=== AFTER RECALCULATION ===")
# Check stock status again
menu_res_after = (
    supabase.table("menu").select("*").eq("stock_status", "Out of Stock").execute()
)
print(f"Items still out of stock: {len(menu_res_after.data)}")
for item in menu_res_after.data:
    print(f"- {item['dish_name']}: {item['stock_status']}")

# Check if any items became available
menu_available = (
    supabase.table("menu").select("*").eq("stock_status", "Available").execute()
)
print(f"\nItems now available: {len(menu_available.data)}")
for item in menu_available.data:
    print(f"- {item['dish_name']}: {item['stock_status']}")
