from fastapi import APIRouter, Query, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional
from datetime import datetime, timedelta
from app.supabase import get_db
from decimal import Decimal
from app.models.user_activity_log import UserActivityLog
from app.utils.rbac import get_current_user
from pydantic import BaseModel
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


class ExportLogRequest(BaseModel):
    report_type: str
    record_count: int


@router.get("/inventory-analytics-historical")
async def get_inventory_analytics_historical(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    historical_date: Optional[str] = Query(None, description="Get snapshot for specific date (YYYY-MM-DD)"),
    session: AsyncSession = Depends(get_db),
):
    """
    Comprehensive inventory analytics with historical snapshot support.

    Parameters:
    - start_date: Start date for time-range queries (spoilage, movement)
    - end_date: End date for time-range queries
    - historical_date: Get snapshot from specific date instead of current inventory

    Returns analytics from either:
    - Current inventory (if historical_date is None)
    - Historical snapshot (if historical_date is provided)
    """
    try:
        # Default date range: last 30 days
        if not end_date:
            end_date = datetime.now().date().isoformat()
        if not start_date:
            start_date = (datetime.now().date() - timedelta(days=30)).isoformat()

        # Determine if we're querying historical snapshot or current inventory
        use_snapshot = historical_date is not None

        if use_snapshot:
            # Validate historical date exists
            check_query = text("""
                SELECT COUNT(*) as count
                FROM inventory_snapshots
                WHERE snapshot_date = :historical_date
            """)
            check_result = await session.execute(check_query, {"historical_date": historical_date})
            snapshot_count = check_result.scalar()

            if snapshot_count == 0:
                raise HTTPException(
                    status_code=404,
                    detail=f"No snapshot found for date {historical_date}. Create a snapshot first."
                )

        # Build queries based on data source
        if use_snapshot:
            base_table = "inventory_snapshots"
            date_filter = "WHERE snapshot_date = :historical_date"
            params = {"historical_date": historical_date}
        else:
            base_table = "inventory"
            date_filter = ""
            params = {}

        # 1. Stock Overview
        stock_query = text(f"""
            SELECT
                COUNT(DISTINCT item_name) as total_items,
                SUM(stock_quantity) as total_quantity,
                COUNT(DISTINCT category) as total_categories,
                SUM(CASE WHEN stock_quantity <= 0 THEN 1 ELSE 0 END) as out_of_stock_items,
                SUM(COALESCE(total_value, 0)) as total_inventory_value
            FROM {base_table}
            {date_filter}
        """)
        stock_result = await session.execute(stock_query, params)
        stock_overview = dict(stock_result.fetchone()._mapping)

        # 2. Stock by Category
        category_query = text(f"""
            SELECT
                category,
                COUNT(DISTINCT item_name) as item_count,
                SUM(stock_quantity) as total_quantity,
                SUM(COALESCE(total_value, 0)) as category_value
            FROM {base_table}
            {date_filter}
            GROUP BY category
            ORDER BY total_quantity DESC
        """)
        category_result = await session.execute(category_query, params)
        stock_by_category = [dict(row._mapping) for row in category_result.fetchall()]

        # 3. Stock Status Distribution
        status_query = text(f"""
            SELECT
                stock_status as status,
                COUNT(*) as count
            FROM {base_table}
            {date_filter}
            GROUP BY stock_status
        """)
        status_result = await session.execute(status_query, params)
        stock_status_distribution = [dict(row._mapping) for row in status_result.fetchall()]

        # 4. Top Items by Stock Quantity
        top_items_query = text(f"""
            SELECT
                item_name,
                category,
                stock_quantity,
                stock_status,
                batch_date,
                COALESCE(total_value, 0) as total_value
            FROM {base_table}
            {date_filter}
            ORDER BY stock_quantity DESC
            LIMIT 10
        """)
        top_items_result = await session.execute(top_items_query, params)
        top_items = [dict(row._mapping) for row in top_items_result.fetchall()]

        # 5. Critical/Low/Out of Stock Items (only meaningful for current, but include for historical comparison)
        critical_query = text(f"""
            SELECT
                i.item_name,
                i.category,
                i.stock_quantity,
                i.stock_status,
                COALESCE(CAST(s.low_stock_threshold AS INTEGER), 10) as threshold
            FROM {base_table} i
            LEFT JOIN inventory_settings s ON i.item_name = s.name
            {date_filter}
            {'AND' if use_snapshot else 'WHERE'} i.stock_status IN ('Critical', 'Out Of Stock', 'Low Stock')
            ORDER BY
                CASE i.stock_status
                    WHEN 'Out Of Stock' THEN 1
                    WHEN 'Critical' THEN 2
                    WHEN 'Low Stock' THEN 3
                    ELSE 4
                END,
                i.stock_quantity ASC
        """)
        critical_result = await session.execute(critical_query, params)
        problematic_items = [dict(row._mapping) for row in critical_result.fetchall()]

        # Split into categories
        outOfStock_items = [item for item in problematic_items if item['stock_status'] == 'Out Of Stock']
        critical_stock_items = [item for item in problematic_items if item['stock_status'] == 'Critical']
        low_stock_items = [item for item in problematic_items if item['stock_status'] == 'Low Stock']
        normal_items = []  # Not querying all normal items for performance

        # 6. Spoilage Analysis (time-based, not affected by historical_date)
        spoilage_query = text("""
            SELECT
                DATE(spoilage_date) as date,
                COUNT(*) as incidents,
                SUM(quantity_spoiled) as total_quantity,
                COUNT(DISTINCT item_name) as unique_items
            FROM inventory_spoilage
            WHERE spoilage_date >= :start_date AND spoilage_date <= :end_date
            GROUP BY DATE(spoilage_date)
            ORDER BY date DESC
        """)
        spoilage_result = await session.execute(
            spoilage_query, {"start_date": start_date, "end_date": end_date}
        )
        spoilage_trend = [dict(row._mapping) for row in spoilage_result.fetchall()]

        # 7. Spoilage Summary
        spoilage_summary_query = text("""
            SELECT
                COUNT(*) as total_incidents,
                SUM(quantity_spoiled) as total_quantity_spoiled,
                COUNT(DISTINCT item_name) as unique_items_spoiled
            FROM inventory_spoilage
            WHERE spoilage_date >= :start_date AND spoilage_date <= :end_date
        """)
        spoilage_summary_result = await session.execute(
            spoilage_summary_query, {"start_date": start_date, "end_date": end_date}
        )
        spoilage_summary = dict(spoilage_summary_result.fetchone()._mapping)

        # 8. Expiring Items (only for current inventory, not historical)
        if not use_snapshot:
            expiring_query = text("""
                SELECT
                    item_name,
                    category,
                    stock_quantity,
                    expiration_date,
                    (expiration_date::date - CURRENT_DATE) as days_until_expiry
                FROM inventory
                WHERE expiration_date IS NOT NULL
                AND expiration_date::date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '7 days')
                ORDER BY expiration_date ASC
                LIMIT 10
            """)
            expiring_result = await session.execute(expiring_query)
            expiring_items = [dict(row._mapping) for row in expiring_result.fetchall()]
        else:
            expiring_items = []

        # 9. Inventory Movement (sales data, time-based)
        movement_query = text("""
            SELECT
                DATE(sale_date) as date,
                COUNT(DISTINCT item_name) as items_sold,
                SUM(quantity) as total_quantity_sold
            FROM sales_report
            WHERE sale_date >= :start_date AND sale_date <= :end_date
            GROUP BY DATE(sale_date)
            ORDER BY date DESC
            LIMIT 30
        """)
        try:
            movement_result = await session.execute(
                movement_query, {"start_date": start_date, "end_date": end_date}
            )
            inventory_movement = [dict(row._mapping) for row in movement_result.fetchall()]
        except:
            inventory_movement = []

        return {
            "is_historical": use_snapshot,
            "snapshot_date": historical_date if use_snapshot else None,
            "period": {"start_date": start_date, "end_date": end_date},
            "stock_overview": stock_overview,
            "stock_by_category": stock_by_category,
            "stock_status_distribution": stock_status_distribution,
            "top_items": top_items,
            "critical_stock_items": critical_stock_items,
            "outOfStock_items": outOfStock_items,
            "low_stock_items": low_stock_items,
            "normal_items": normal_items,
            "expiring_items": expiring_items,
            "spoilage_summary": spoilage_summary,
            "spoilage_trend": spoilage_trend,
            "inventory_movement": inventory_movement,
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        logger.exception(f"INVENTORY ANALYTICS ERROR: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Error generating inventory analytics: {str(e)}"
        )


@router.get("/inventory-snapshots/compare")
async def compare_snapshots(
    date1: str = Query(..., description="First snapshot date (YYYY-MM-DD)"),
    date2: str = Query(..., description="Second snapshot date (YYYY-MM-DD)"),
    session: AsyncSession = Depends(get_db),
):
    """
    Compare two inventory snapshots to see changes over time.
    Returns differences in stock levels, new items, removed items, etc.
    """
    try:
        # Fetch both snapshots
        query = text("""
            SELECT
                snapshot_date,
                item_name,
                category,
                stock_quantity,
                stock_status,
                total_value
            FROM inventory_snapshots
            WHERE snapshot_date IN (:date1, :date2)
            ORDER BY snapshot_date, item_name
        """)

        result = await session.execute(query, {"date1": date1, "date2": date2})
        all_rows = result.fetchall()

        # Organize by date
        snapshot1 = {}
        snapshot2 = {}

        for row in all_rows:
            data = dict(row._mapping)
            if str(data['snapshot_date']) == date1:
                snapshot1[data['item_name']] = data
            elif str(data['snapshot_date']) == date2:
                snapshot2[data['item_name']] = data

        if not snapshot1 and not snapshot2:
            raise HTTPException(status_code=404, detail="Snapshots not found for specified dates")

        # Calculate differences
        all_items = set(snapshot1.keys()) | set(snapshot2.keys())

        changes = []
        new_items = []
        removed_items = []

        for item_name in all_items:
            item1 = snapshot1.get(item_name)
            item2 = snapshot2.get(item_name)

            if item1 and item2:
                # Item exists in both - calculate change
                qty_change = float(item2['stock_quantity']) - float(item1['stock_quantity'])
                value_change = (float(item2.get('total_value', 0) or 0) -
                               float(item1.get('total_value', 0) or 0))

                if qty_change != 0:
                    changes.append({
                        "item_name": item_name,
                        "category": item2['category'],
                        "quantity_before": float(item1['stock_quantity']),
                        "quantity_after": float(item2['stock_quantity']),
                        "quantity_change": qty_change,
                        "status_before": item1['stock_status'],
                        "status_after": item2['stock_status'],
                        "value_change": value_change
                    })
            elif item2 and not item1:
                # New item added
                new_items.append({
                    "item_name": item_name,
                    "category": item2['category'],
                    "stock_quantity": float(item2['stock_quantity']),
                    "stock_status": item2['stock_status']
                })
            elif item1 and not item2:
                # Item removed
                removed_items.append({
                    "item_name": item_name,
                    "category": item1['category'],
                    "stock_quantity": float(item1['stock_quantity']),
                    "stock_status": item1['stock_status']
                })

        # Sort changes by magnitude
        changes.sort(key=lambda x: abs(x['quantity_change']), reverse=True)

        return {
            "date1": date1,
            "date2": date2,
            "summary": {
                "total_items_date1": len(snapshot1),
                "total_items_date2": len(snapshot2),
                "items_changed": len(changes),
                "items_added": len(new_items),
                "items_removed": len(removed_items)
            },
            "changes": changes,
            "new_items": new_items,
            "removed_items": removed_items
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error comparing snapshots: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to compare snapshots: {str(e)}"
        )
