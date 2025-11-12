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

router = APIRouter()


class ExportLogRequest(BaseModel):
    report_type: str
    record_count: int


@router.get("/inventory-analytics")
async def get_inventory_analytics(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_db),
):
    """
    Comprehensive inventory analytics for panel presentation
    Includes: stock levels, turnover rates, wastage analysis, value metrics
    """
    try:
        # Default date range: last 30 days
        if not end_date:
            end_date = datetime.now().date().isoformat()
        if not start_date:
            start_date = (datetime.now().date() - timedelta(days=30)).isoformat()

        # 1. Current Stock Overview (includes archived items for complete reporting)
        stock_query = text("""
            SELECT
                COUNT(DISTINCT item_name) as total_items,
                SUM(stock_quantity) as total_quantity,
                COUNT(DISTINCT category) as total_categories,
                SUM(CASE WHEN stock_quantity <= 0 THEN 1 ELSE 0 END) as out_of_stock_items
            FROM (
                SELECT item_name, stock_quantity, category FROM inventory
                UNION ALL
                SELECT item_name, stock_quantity, category FROM archived_inventory
            ) AS combined_inventory
        """)
        stock_result = await session.execute(stock_query)
        stock_overview = dict(stock_result.fetchone()._mapping)

        # 2. Stock by Category (includes archived items for complete reporting)
        category_query = text("""
            SELECT
                category,
                COUNT(DISTINCT item_name) as item_count,
                SUM(stock_quantity) as total_quantity
            FROM (
                SELECT item_name, stock_quantity, category FROM inventory
                UNION ALL
                SELECT item_name, stock_quantity, category FROM archived_inventory
            ) AS combined_inventory
            GROUP BY category
            ORDER BY total_quantity DESC
        """)
        category_result = await session.execute(category_query)
        stock_by_category = [dict(row._mapping) for row in category_result.fetchall()]

        # 3. Critical Stock Items (stock <= 50% of threshold but > 0)
        critical_stock_query = text("""
            SELECT
                i.item_name,
                i.category,
                i.stock_quantity,
                COALESCE(CAST(s.low_stock_threshold AS INTEGER), 10) as threshold
            FROM inventory i
            LEFT JOIN inventory_settings s ON i.item_name = s.name
            WHERE i.stock_quantity <= (COALESCE(CAST(s.low_stock_threshold AS INTEGER), 10) * 0.5)
            AND i.stock_quantity > 0
            ORDER BY i.stock_quantity ASC
        """)
        critical_stock_result = await session.execute(critical_stock_query)
        critical_stock_items = [dict(row._mapping) for row in critical_stock_result.fetchall()]

        # 4. Out of Stock Items (stock = 0, includes archived for complete reporting)
        outOfStock_query = text("""
            SELECT
                i.item_name,
                i.category,
                i.stock_quantity,
                COALESCE(CAST(s.low_stock_threshold AS INTEGER), 10) as threshold,
                i.batch_date,
                i.archived_at
            FROM (
                SELECT
                    item_name::VARCHAR,
                    category::VARCHAR,
                    stock_quantity::FLOAT,
                    batch_date::DATE,
                    NULL::TIMESTAMP as archived_at
                FROM inventory WHERE stock_quantity = 0
                UNION ALL
                SELECT
                    item_name::VARCHAR,
                    category::VARCHAR,
                    stock_quantity::FLOAT,
                    batch_date::DATE,
                    archived_at::TIMESTAMP
                FROM archived_inventory WHERE stock_quantity = 0
            ) i
            LEFT JOIN inventory_settings s ON i.item_name = s.name
            ORDER BY i.item_name ASC, i.batch_date DESC
        """)
        outOfStock_result = await session.execute(outOfStock_query)
        outOfStock_items = [dict(row._mapping) for row in outOfStock_result.fetchall()]

        # 5. Low Stock Items (between 50% and 100% of threshold)
        low_stock_query = text("""
            SELECT
                i.item_name,
                i.category,
                i.stock_quantity,
                COALESCE(CAST(s.low_stock_threshold AS INTEGER), 10) as threshold
            FROM inventory i
            LEFT JOIN inventory_settings s ON i.item_name = s.name
            WHERE i.stock_quantity > (COALESCE(CAST(s.low_stock_threshold AS INTEGER), 10) * 0.5)
            AND i.stock_quantity <= COALESCE(CAST(s.low_stock_threshold AS INTEGER), 10)
            ORDER BY i.stock_quantity ASC
        """)
        low_stock_result = await session.execute(low_stock_query)
        low_stock_items = [dict(row._mapping) for row in low_stock_result.fetchall()]

        # 6. Normal Stock Items (stock > threshold)
        normal_items_query = text("""
            SELECT
                i.item_name,
                i.category,
                i.stock_quantity,
                COALESCE(CAST(s.low_stock_threshold AS INTEGER), 10) as threshold
            FROM inventory i
            LEFT JOIN inventory_settings s ON i.item_name = s.name
            WHERE i.stock_quantity > COALESCE(CAST(s.low_stock_threshold AS INTEGER), 10)
            ORDER BY i.stock_quantity DESC
        """)
        normal_items_result = await session.execute(normal_items_query)
        normal_items = [dict(row._mapping) for row in normal_items_result.fetchall()]

        # 7. Expiring Soon Items (next 7 days)
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

        # 5. Spoilage Analysis
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

        # 6. Total Spoilage Summary
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

        # 7. Top Items by Stock Quantity
        top_items_query = text("""
            SELECT
                item_name,
                category,
                stock_quantity,
                batch_date
            FROM inventory
            ORDER BY stock_quantity DESC
            LIMIT 10
        """)
        top_items_result = await session.execute(top_items_query)
        top_items = [dict(row._mapping) for row in top_items_result.fetchall()]

        # 8. Inventory Movement Summary (if sales data available)
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

        # 9. Stock Status Distribution (Out of Stock, Critical, Low Stock, Normal)
        stock_status_query = text("""
            SELECT
                CASE
                    WHEN stock_quantity = 0 THEN 'Out of Stock'
                    WHEN stock_quantity <= (COALESCE(CAST(s.low_stock_threshold AS INTEGER), 10) * 0.5) THEN 'Critical'
                    WHEN stock_quantity <= COALESCE(CAST(s.low_stock_threshold AS INTEGER), 10) THEN 'Low Stock'
                    ELSE 'Normal'
                END as status,
                COUNT(*) as count
            FROM inventory i
            LEFT JOIN inventory_settings s ON i.item_name = s.name
            GROUP BY status
        """)
        stock_status_result = await session.execute(stock_status_query)
        stock_status_distribution = [
            dict(row._mapping) for row in stock_status_result.fetchall()
        ]

        return {
            "period": {"start_date": start_date, "end_date": end_date},
            "stock_overview": stock_overview,
            "stock_by_category": stock_by_category,
            "critical_stock_items": critical_stock_items,
            "outOfStock_items": outOfStock_items,
            "low_stock_items": low_stock_items,
            "normal_items": normal_items,
            "expiring_items": expiring_items,
            "spoilage_summary": spoilage_summary,
            "spoilage_trend": spoilage_trend,
            "top_items": top_items,
            "inventory_movement": inventory_movement,
            "stock_status_distribution": stock_status_distribution,
        }

    except Exception as e:
        import traceback

        print("INVENTORY ANALYTICS ERROR:", e)
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Error generating inventory analytics: {str(e)}"
        )


@router.post("/log-export")
async def log_export(
    request: ExportLogRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Log when a user exports a report
    """
    try:
        user_row = getattr(user, "user_row", user) if user else None

        new_activity = UserActivityLog(
            user_id=user_row.get("user_id") if user_row else None,
            action_type=f"export {request.report_type}",
            description=f"Exported {request.report_type} ({request.record_count} records)",
            activity_date=datetime.utcnow(),
            report_date=datetime.utcnow(),
            user_name=user_row.get("name") if user_row else "Unknown",
            role=user_row.get("user_role") if user_row else None,
        )
        db.add(new_activity)
        await db.commit()

        return {"message": "Export logged successfully"}
    except Exception as e:
        print(f"Failed to log export: {e}")
        # Don't fail the export if logging fails
        return {"message": "Export log failed", "error": str(e)}
