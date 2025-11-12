"""
Aggregate Stock Status Management

This module provides functionality for calculating and updating stock status
across multiple batches of the same item. Items are only marked as "Out Of Stock"
when ALL batches have zero stock quantity.
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Literal
import logging

from app.supabase import get_db

router = APIRouter()
logger = logging.getLogger(__name__)

# Type for valid inventory table names
InventoryTable = Literal["inventory", "inventory_today", "inventory_surplus"]


async def update_aggregate_stock_status(
    item_name: str,
    table_name: InventoryTable = "inventory_today",
    db: AsyncSession = None,
    auto_archive: bool = True
) -> str:
    """
    Update stock_status for all batches of an item based on aggregate logic.

    This ensures all batches show the same status (the aggregate status calculated
    across all batches). Only marks as "Out Of Stock" when ALL batches are depleted.

    Optionally auto-archives depleted old batches if newer batches exist.

    Args:
        item_name: Name of the item to update
        table_name: Which inventory table to update (default: inventory_today)
        db: Database session (if None, will use dependency injection)
        auto_archive: If True, automatically archive depleted old batches (default: True)

    Returns:
        The calculated aggregate status string

    Example:
        If "Sinigang Mix" has 3 batches:
        - Batch A (2025-10-01): 0 units (OLD, will be archived if newer batches exist)
        - Batch B (2025-11-05): 10 units (NEWER)
        - Batch C (2025-11-08): 5 units (NEWEST)
        Total: 15 units -> Status: "Normal" (all batches updated to "Normal")
        Batch A will be auto-archived since it's depleted and newer batches exist
    """
    if db is None:
        raise ValueError("Database session required")

    try:
        # Get aggregate status using database function
        result = await db.execute(
            text("SELECT calculate_aggregate_stock_status(:item_name, :table_name)"),
            {"item_name": item_name, "table_name": table_name}
        )
        aggregate_status = result.scalar()

        if aggregate_status is None:
            logger.warning(f"Could not calculate aggregate status for '{item_name}' in {table_name}")
            return "Unknown"

        # Update ALL batches with the same item name to have this aggregate status
        update_stmt = text(f"""
            UPDATE {table_name}
            SET stock_status = :status, updated_at = NOW()
            WHERE LOWER(item_name) = LOWER(:item_name)
        """)
        await db.execute(update_stmt, {"status": aggregate_status, "item_name": item_name})
        await db.commit()

        logger.info(f"Updated aggregate stock status for '{item_name}' in {table_name}: {aggregate_status}")

        # Auto-archive depleted old batches if enabled
        if auto_archive:
            try:
                archive_result = await db.execute(
                    text("SELECT auto_archive_depleted_old_batches(:item_name, :table_name)"),
                    {"item_name": item_name, "table_name": table_name}
                )
                archive_data = archive_result.scalar()
                if archive_data and archive_data.get('archived_count', 0) > 0:
                    logger.info(f"Auto-archived {archive_data['archived_count']} depleted old batch(es) for '{item_name}' in {table_name}")
                await db.commit()
            except Exception as archive_error:
                logger.warning(f"Auto-archive failed for '{item_name}': {str(archive_error)}")
                # Don't fail the whole operation if archiving fails

        return aggregate_status

    except Exception as e:
        logger.error(f"Error updating aggregate stock status for '{item_name}': {str(e)}")
        await db.rollback()
        raise


@router.get("/inventory/aggregate-stock-status/{item_name}")
async def get_aggregate_stock_status(
    item_name: str,
    table: InventoryTable = Query("inventory_today", description="Which inventory table to check"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get aggregate stock status for an item across all its batches.

    This endpoint provides detailed information about:
    - Total stock across all batches
    - Number of batches
    - Individual batch details
    - Calculated aggregate status

    Args:
        item_name: Name of the item to check
        table: Which inventory table to check (default: inventory_today)

    Returns:
        {
            "item_name": "Sinigang Mix",
            "aggregate_status": "Normal",
            "total_stock": 15.0,
            "batch_count": 3,
            "batches": [
                {"item_id": 1, "batch_date": "2025-11-01", "stock_quantity": 0, "individual_status": "Out Of Stock"},
                {"item_id": 2, "batch_date": "2025-11-05", "stock_quantity": 10, "individual_status": "Normal"},
                {"item_id": 3, "batch_date": "2025-11-08", "stock_quantity": 5, "individual_status": "Low"}
            ]
        }
    """
    try:
        # Execute database function to get aggregate status
        result = await db.execute(
            text("SELECT calculate_aggregate_stock_status(:item_name, :table_name)"),
            {"item_name": item_name, "table_name": table}
        )
        aggregate_status = result.scalar()

        if aggregate_status is None:
            raise HTTPException(status_code=404, detail=f"Item '{item_name}' not found in {table}")

        # Get individual batch details
        stmt = text(f"""
            SELECT item_id, batch_date, stock_quantity, stock_status, expiration_date, category
            FROM {table}
            WHERE LOWER(item_name) = LOWER(:item_name)
            ORDER BY batch_date ASC
        """)
        batch_result = await db.execute(stmt, {"item_name": item_name})
        batches = [
            {
                "item_id": row.item_id,
                "batch_date": row.batch_date.isoformat() if row.batch_date else None,
                "stock_quantity": float(row.stock_quantity),
                "individual_status": row.stock_status,
                "expiration_date": row.expiration_date.isoformat() if row.expiration_date else None,
                "category": row.category
            }
            for row in batch_result
        ]

        if not batches:
            raise HTTPException(status_code=404, detail=f"No batches found for '{item_name}' in {table}")

        total_stock = sum(b["stock_quantity"] for b in batches)

        return {
            "item_name": item_name,
            "aggregate_status": aggregate_status,
            "total_stock": total_stock,
            "batch_count": len(batches),
            "batches": batches,
            "table": table
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting aggregate stock status for '{item_name}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/inventory/archived")
async def get_archived_inventory(
    table: InventoryTable = Query("inventory_today", description="Which archived table to query"),
    item_name: str = Query(None, description="Filter by item name (optional)"),
    start_date: str = Query(None, description="Filter by archived_at >= start_date (optional)"),
    end_date: str = Query(None, description="Filter by archived_at <= end_date (optional)"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get archived inventory for reports.

    Archived batches are depleted old batches that were automatically removed
    from active inventory when newer batches existed. These records are kept
    for historical reporting purposes.

    Args:
        table: Which archived table to query (inventory, inventory_today, inventory_surplus)
        item_name: Optional filter by item name
        start_date: Optional filter by archived_at >= start_date (ISO format: YYYY-MM-DD)
        end_date: Optional filter by archived_at <= end_date (ISO format: YYYY-MM-DD)
        limit: Maximum records to return (1-1000)
        skip: Records to skip for pagination

    Returns:
        {
            "archived_items": [...],
            "total_count": 150,
            "table": "archived_inventory_today"
        }
    """
    try:
        # Determine archived table name
        if table == "inventory":
            archived_table = "archived_inventory"
        elif table == "inventory_today":
            archived_table = "archived_inventory_today"
        elif table == "inventory_surplus":
            archived_table = "archived_inventory_surplus"
        else:
            raise HTTPException(status_code=400, detail=f"Invalid table name: {table}")

        # Build query with filters
        where_clauses = []
        params = {"limit": limit, "skip": skip}

        if item_name:
            where_clauses.append("LOWER(item_name) = LOWER(:item_name)")
            params["item_name"] = item_name

        if start_date:
            where_clauses.append("archived_at >= :start_date")
            params["start_date"] = start_date

        if end_date:
            where_clauses.append("archived_at <= :end_date")
            params["end_date"] = end_date

        where_clause = " AND ".join(where_clauses) if where_clauses else "1=1"

        # Get total count
        count_stmt = text(f"SELECT COUNT(*) FROM {archived_table} WHERE {where_clause}")
        count_result = await db.execute(count_stmt, params)
        total_count = count_result.scalar()

        # Get archived items
        query_stmt = text(f"""
            SELECT item_id, item_name, stock_status, expiration_date, category,
                   batch_date, stock_quantity, unit_cost, archived_at, archived_reason,
                   original_table, created_at, updated_at
            FROM {archived_table}
            WHERE {where_clause}
            ORDER BY archived_at DESC
            LIMIT :limit OFFSET :skip
        """)
        result = await db.execute(query_stmt, params)
        archived_items = [
            {
                "item_id": row.item_id,
                "item_name": row.item_name,
                "stock_status": row.stock_status,
                "expiration_date": row.expiration_date.isoformat() if row.expiration_date else None,
                "category": row.category,
                "batch_date": row.batch_date.isoformat() if row.batch_date else None,
                "stock_quantity": float(row.stock_quantity),
                "unit_cost": float(row.unit_cost) if row.unit_cost else 0.0,
                "archived_at": row.archived_at.isoformat() if row.archived_at else None,
                "archived_reason": row.archived_reason,
                "original_table": row.original_table,
                "created_at": row.created_at.isoformat() if row.created_at else None,
                "updated_at": row.updated_at.isoformat() if row.updated_at else None
            }
            for row in result
        ]

        return {
            "archived_items": archived_items,
            "total_count": total_count,
            "table": archived_table,
            "filters": {
                "item_name": item_name,
                "start_date": start_date,
                "end_date": end_date
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting archived inventory: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/inventory/recalculate-aggregate-status")
async def recalculate_all_aggregate_statuses(
    table: InventoryTable = Query("inventory_today", description="Which inventory table to recalculate"),
    db: AsyncSession = Depends(get_db)
):
    """
    Recalculate aggregate stock status for ALL unique items in a table.

    This is useful for batch updates or fixing inconsistent status values.
    It will:
    1. Get all unique item names
    2. Calculate aggregate status for each
    3. Update all batches with the correct aggregate status

    Args:
        table: Which inventory table to recalculate (default: inventory_today)

    Returns:
        {
            "message": "Successfully recalculated aggregate status for 45 items",
            "updated_items": ["Sinigang Mix", "Chicken", ...],
            "table": "inventory_today"
        }
    """
    try:
        # Get all unique item names from the table
        stmt = text(f"""
            SELECT DISTINCT item_name
            FROM {table}
            WHERE item_name IS NOT NULL
            ORDER BY item_name
        """)
        result = await db.execute(stmt)
        item_names = [row[0] for row in result]

        if not item_names:
            return {
                "message": f"No items found in {table}",
                "updated_items": [],
                "table": table
            }

        # Update aggregate status for each item
        updated_items = []
        for item_name in item_names:
            try:
                aggregate_status = await update_aggregate_stock_status(item_name, table, db)
                updated_items.append({
                    "item_name": item_name,
                    "status": aggregate_status
                })
            except Exception as e:
                logger.error(f"Failed to update '{item_name}': {str(e)}")
                continue

        return {
            "message": f"Successfully recalculated aggregate status for {len(updated_items)} items",
            "updated_items": updated_items,
            "table": table
        }

    except Exception as e:
        logger.error(f"Error recalculating aggregate statuses: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
