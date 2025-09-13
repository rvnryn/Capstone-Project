import sys

sys.path.append(".")

from app.routes.notification import check_inventory_alerts
from app.supabase import supabase
from datetime import datetime

print("=== TESTING ENHANCED NOTIFICATION SYSTEM WITH MISSING THRESHOLDS ===")

# Clear existing notifications for testing
print("Clearing existing notifications...")
supabase.table("notification").delete().neq("id", 0).execute()

print("\n=== CURRENT INVENTORY STATUS ===")
all_items = []
for table in ["inventory", "inventory_surplus", "inventory_today"]:
    print(f"\n{table.upper()}:")
    res = (
        supabase.table(table)
        .select("item_name,stock_quantity,expiration_date,category")
        .execute()
    )
    for item in res.data:
        expiry = item.get("expiration_date")
        stock = item.get("stock_quantity", 0)
        name = item.get("item_name")
        category = item.get("category")

        # Check if this item has a threshold configured
        threshold_by_name = (
            supabase.table("inventory_settings")
            .select("low_stock_threshold")
            .eq("name", name)
            .execute()
        )
        threshold_by_category = (
            supabase.table("inventory_settings")
            .select("low_stock_threshold")
            .eq("category", category)
            .execute()
            if category
            else None
        )

        has_threshold = False
        threshold_value = None
        threshold_source = None

        if (
            threshold_by_name.data
            and len(threshold_by_name.data) > 0
            and threshold_by_name.data[0].get("low_stock_threshold") is not None
        ):
            has_threshold = True
            threshold_value = threshold_by_name.data[0]["low_stock_threshold"]
            threshold_source = f"by name ({name})"
        elif (
            threshold_by_category
            and threshold_by_category.data
            and len(threshold_by_category.data) > 0
            and threshold_by_category.data[0].get("low_stock_threshold") is not None
        ):
            has_threshold = True
            threshold_value = threshold_by_category.data[0]["low_stock_threshold"]
            threshold_source = f"by category ({category})"

        all_items.append(
            {
                "name": name,
                "table": table,
                "stock": stock,
                "category": category,
                "has_threshold": has_threshold,
                "threshold_value": threshold_value,
                "threshold_source": threshold_source,
            }
        )

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
                expiry_info = f"expires {expiry} ({status})"
            except Exception as e:
                expiry_info = f"expires {expiry} (parse error: {e})"
        else:
            expiry_info = "no expiration date"

        threshold_info = (
            f"threshold: {threshold_value} ({threshold_source})"
            if has_threshold
            else "❌ NO THRESHOLD"
        )
        print(f"  {name}: {stock} units, {expiry_info}, {threshold_info}")

print(f"\nToday is: {datetime.now().date()}")

print("\n=== THRESHOLD ANALYSIS ===")
items_without_threshold = [item for item in all_items if not item["has_threshold"]]
items_with_threshold = [item for item in all_items if item["has_threshold"]]
print(f"Items WITH thresholds: {len(items_with_threshold)}")
print(f"Items WITHOUT thresholds: {len(items_without_threshold)}")

if items_without_threshold:
    print("\nItems missing threshold configuration:")
    for item in items_without_threshold:
        print(
            f"  - {item['name']} ({item['table']}) - Category: {item['category'] or 'None'}"
        )

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
                elif "reason" in item:
                    item_info += f" (reason: {item['reason']})"
                if "source_table" in item:
                    item_info += f" [from {item['source_table']}]"
                if "category" in item:
                    item_info += f" [category: {item['category'] or 'None'}]"
                print(item_info)
            if len(details) > 3:
                print(f"  ... and {len(details) - 3} more items")
        except:
            print(f"Details: {notif['details'][:100]}...")

print("\n=== INVENTORY SETTINGS SUMMARY ===")
settings = supabase.table("inventory_settings").select("*").execute()
print(f"Total threshold settings configured: {len(settings.data)}")
for setting in settings.data:
    print(
        f"  - {setting.get('name') or setting.get('category', 'Unknown')}: threshold = {setting.get('low_stock_threshold')}"
    )
