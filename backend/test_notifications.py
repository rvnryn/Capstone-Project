import sys

sys.path.append(".")

from app.routes.notification import check_inventory_alerts
from app.supabase import supabase
from datetime import datetime

print("=== TESTING ENHANCED NOTIFICATION SYSTEM ===")

# Clear existing notifications for testing
print("Clearing existing notifications...")
supabase.table("notification").delete().neq("id", 0).execute()

print("\n=== CURRENT INVENTORY STATUS ===")
for table in ["inventory", "inventory_surplus", "inventory_today"]:
    print(f"\n{table.upper()}:")
    res = (
        supabase.table(table)
        .select("item_name,stock_quantity,expiration_date")
        .execute()
    )
    for item in res.data:
        expiry = item.get("expiration_date")
        stock = item.get("stock_quantity", 0)
        name = item.get("item_name")

        if expiry:
            try:
                expiry_date = datetime.strptime(expiry, "%Y-%m-%d").date()
                today = datetime.now().date()
                days_diff = (expiry_date - today).days
                if days_diff < 0:
                    status = f"EXPIRED {abs(days_diff)} days ago"
                elif days_diff <= 3:
                    status = f"EXPIRING in {days_diff} days"
                else:
                    status = f"{days_diff} days until expiry"
                print(f"  {name}: {stock} units, expires {expiry} ({status})")
            except Exception as e:
                print(f"  {name}: {stock} units, expires {expiry} (parse error: {e})")
        else:
            print(f"  {name}: {stock} units, no expiration date")

print(f"\nToday is: {datetime.now().date()}")

print("\n=== RUNNING NOTIFICATION CHECK ===")
try:
    check_inventory_alerts()
    print("Notification check completed successfully!")
except Exception as e:
    print(f"Error during notification check: {e}")
    import traceback

    traceback.print_exc()

print("\n=== NOTIFICATIONS CREATED ===")
# Get all notifications
notifications = (
    supabase.table("notification").select("*").order("created_at", desc=True).execute()
)
print(f"Total notifications: {len(notifications.data)}")

for notif in notifications.data:
    print(f"\nType: {notif['type']}")
    print(f"Message: {notif['message']}")
    print(f"Status: {notif['status']}")
    print(f"Created: {notif['created_at']}")
    if notif.get("details"):
        import json

        try:
            details = json.loads(notif["details"])
            print(f"Items affected: {len(details)}")
            for item in details[:3]:  # Show first 3 items
                item_info = f"  - {item['name']}"
                if "days_expired" in item:
                    item_info += f" (expired {item['days_expired']} days ago)"
                elif "days_until_expiry" in item:
                    item_info += f" (expires in {item['days_until_expiry']} days)"
                if "source_table" in item:
                    item_info += f" [from {item['source_table']}]"
                print(item_info)
            if len(details) > 3:
                print(f"  ... and {len(details) - 3} more items")
        except:
            print(f"Details: {notif['details'][:100]}...")
