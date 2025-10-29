from fastapi import APIRouter, HTTPException, Request
import pandas as pd
from io import BytesIO
from datetime import datetime
from app.supabase import supabase
from collections import defaultdict

router = APIRouter()

@router.post("/import-sales")
async def import_sales(request: Request):
    data = await request.json()
    rows = data.get("rows", [])
    # Aggregate rows by item_name
    grouped = defaultdict(lambda: {
        "quantity": 0,
        "unit_price": 0,
        "price": 0,
        "subtotal": 0,
        "total_price": 0,
        "category": "",
        "sale_date": None,
    })

    for row in rows:
        item_name = row.get("item_name") or row.get("itemname")
        grouped[item_name]["quantity"] += int(row.get("quantity", 0))
        grouped[item_name]["unit_price"] = float(row.get("unit_price", row.get("amount", 0)))  # last unit price
        grouped[item_name]["price"] += float(row.get("price", row.get("amount", 0)))
        grouped[item_name]["subtotal"] += float(row.get("subtotal", row.get("amount", 0)))
        grouped[item_name]["total_price"] += float(row.get("total_price", row.get("amount", 0)))
        grouped[item_name]["category"] = row.get("category", "")
        grouped[item_name]["sale_date"] = row.get("date")

    imported = 0
    for item_name, data in grouped.items():
        db_row = {
            "item_name": item_name,
            "quantity": data["quantity"],
            "unit_price": data["unit_price"],
            "price": data["price"],
            "subtotal": data["subtotal"],
            "total_price": data["total_price"],
            "sale_date": data["sale_date"],
            "category": data["category"],
        }
        res = supabase.table("sales_report").insert(db_row).execute()
        if res.data is not None:
            imported += 1
    return {"message": "Sales data imported successfully (aggregated)", "rows": imported}