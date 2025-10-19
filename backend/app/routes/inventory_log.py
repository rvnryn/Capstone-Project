from fastapi import APIRouter, Depends, HTTPException, Query, Request, Body
from fastapi.responses import JSONResponse
from fastapi.exception_handlers import RequestValidationError
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel
from typing import List, Optional
import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.supabase import (
    get_db,
)
import pandas as pd
from prophet import Prophet
import matplotlib.pyplot as plt


router = APIRouter()


# Updated to match DB table columns
class InventoryLogEntry(BaseModel):
    item_id: int
    remaining_stock: int
    action_date: str  # will parse to datetime in route
    user_id: int
    status: str
    wastage: int
    item_name: str
    batch_date: str  # will parse to datetime in route
    expiration_date: Optional[str] = None  # ISO format string


@router.put("/inventory-log")
async def put_inventory_log(
    entries: List[InventoryLogEntry] = Body(...),
    db: AsyncSession = Depends(get_db),
    request: Request = None,
):
    if request is not None:
        raw_body = await request.body()
        print("Raw request body:", raw_body.decode())
    try:
        print(f"Received {len(entries)} entries to insert.")
        for entry in entries:
            entry_data = entry.dict()
            # Parse action_date to datetime object
            try:
                action_date_dt = datetime.datetime.fromisoformat(
                    entry_data["action_date"].replace("Z", "+00:00")
                )
                print("Parsed action_date_dt:", action_date_dt, type(action_date_dt))
            except Exception as e:
                print("Error parsing action_date:", entry_data["action_date"], e)
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid action_date: {entry_data['action_date']}",
                )

            # Parse batch_date to datetime object
            try:
                batch_date_dt = datetime.datetime.fromisoformat(
                    entry_data["batch_date"].replace("Z", "+00:00")
                )
                print("Parsed batch_date_dt:", batch_date_dt, type(batch_date_dt))
            except Exception as e:
                print("Error parsing batch_date:", entry_data["batch_date"], e)
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid batch_date: {entry_data['batch_date']}",
                )

            # Ensure int types
            entry_data["remaining_stock"] = int(entry_data["remaining_stock"])
            entry_data["wastage"] = int(entry_data["wastage"])

            # Automatically set status to 'Spoiled' if wastage > 0 and status is not already 'Spoiled'
            if entry_data["wastage"] > 0 and entry_data["status"].lower() != "spoiled":
                entry_data["status"] = "Spoiled"

            # Parse expiration_date if present
            expiration_dt = None
            if entry_data.get("expiration_date"):
                try:
                    expiration_dt = datetime.datetime.fromisoformat(entry_data["expiration_date"].replace("Z", "+00:00"))
                except Exception as e:
                    print("Error parsing expiration_date:", entry_data["expiration_date"], e)
                    expiration_dt = None
            await db.execute(
                text(
                    """
                INSERT INTO inventory_log (item_id, remaining_stock, action_date, user_id, status, wastage, item_name, batch_date, expiration_date)
                VALUES (:item_id, :remaining_stock, :action_date, :user_id, :status, :wastage, :item_name, :batch_date, :expiration_date)
                """
                ),
                {
                    **entry_data,
                    "action_date": action_date_dt.isoformat(),
                    "batch_date": batch_date_dt.isoformat(),
                    "expiration_date": expiration_dt.isoformat() if expiration_dt else None,
                },
            )
        await db.commit()
        print("DB commit complete.")
        return {"message": "Inventory log(s) saved"}
    except Exception as e:
        import traceback

        print("Exception during insert/commit:", str(e))
        traceback.print_exc()
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/inventory-log")
async def get_inventory_log(
    db: AsyncSession = Depends(get_db),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
):
    query = "SELECT * FROM inventory_log"
    params = {}
    # Convert string dates to datetime.date objects if provided
    start_date_obj = None
    end_date_obj = None
    if start_date:
        try:
            start_date_obj = datetime.datetime.strptime(start_date, "%Y-%m-%d").date()
        except Exception:
            raise HTTPException(
                status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD."
            )
    if end_date:
        try:
            end_date_obj = datetime.datetime.strptime(end_date, "%Y-%m-%d").date()
        except Exception:
            raise HTTPException(
                status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD."
            )
    if start_date_obj and end_date_obj:
        query += " WHERE action_date::date BETWEEN :start_date AND :end_date"
        params = {"start_date": start_date_obj, "end_date": end_date_obj}
    elif start_date_obj:
        query += " WHERE action_date::date = :start_date"
        params = {"start_date": start_date_obj}
    query += " ORDER BY action_date DESC, item_id"
    result = await db.execute(text(query), params)
    rows = result.fetchall()
    # Convert SQLAlchemy Row objects to dicts using ._mapping
    return [dict(row._mapping) for row in rows]
