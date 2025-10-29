from fastapi import APIRouter, HTTPException, Request
from app.supabase import postgrest_client

router = APIRouter()


@router.get("/inventory/all-item-names")
async def get_all_unique_item_names(request: Request):
    try:

        def _fetch_inventory():
            return (
                postgrest_client.table("inventory")
                .select("item_name,category")
                .execute()
            )

        def _fetch_today():
            return (
                postgrest_client.table("inventory_today")
                .select("item_name,category")
                .execute()
            )

        def _fetch_surplus():
            return (
                postgrest_client.table("inventory_surplus")
                .select("item_name,category")
                .execute()
            )

        # Run all fetches (blocking)
        inventory = _fetch_inventory().data or []
        today = _fetch_today().data or []
        surplus = _fetch_surplus().data or []

        # Collect all item names and categories
        items = {}
        for row in inventory + today + surplus:
            name = row.get("item_name")
            category = row.get("category")
            if name and isinstance(name, str):
                key = name.strip()
                # Prefer first non-empty category found
                if key not in items or (not items[key] and category):
                    items[key] = (
                        category.strip()
                        if category and isinstance(category, str)
                        else ""
                    )

        # Format as list of dicts
        result = [
            {"item_name": name, "category": cat} for name, cat in sorted(items.items())
        ]

        return {"items": result}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail="Failed to fetch item names and categories"
        )
