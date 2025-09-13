from fastapi import APIRouter, Query, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List, Optional
from datetime import datetime, timedelta
from app.supabase import get_db

router = APIRouter()


@router.get("/sales-summary")
async def get_sales_summary(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    timeframe: str = Query("daily", description="Timeframe: daily, weekly, monthly"),
    session: AsyncSession = Depends(get_db),
):
    """Get sales summary with total revenue, orders, and items sold"""
    try:
        # Default to last 30 days if no dates provided
        if not start_date:
            start_date = (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d")
        if not end_date:
            end_date = datetime.utcnow().strftime("%Y-%m-%d")

        # Convert string dates to datetime objects for proper SQL handling
        from datetime import datetime

        start_datetime = datetime.strptime(start_date, "%Y-%m-%d")
        end_datetime = datetime.strptime(end_date, "%Y-%m-%d")

        query = text(
            """
            SELECT 
                COUNT(DISTINCT order_id) as total_orders,
                SUM(quantity) as total_items_sold,
                SUM(subtotal) as total_revenue,
                AVG(subtotal) as avg_order_value,
                COUNT(DISTINCT item_name) as unique_items_sold
            FROM order_items 
            WHERE DATE(created_at) BETWEEN :start_date AND :end_date
        """
        )

        result = await session.execute(
            query, {"start_date": start_datetime, "end_date": end_datetime}
        )
        row = result.fetchone()

        return {
            "period": f"{start_date} to {end_date}",
            "total_orders": row.total_orders or 0,
            "total_items_sold": row.total_items_sold or 0,
            "total_revenue": float(row.total_revenue or 0),
            "avg_order_value": float(row.avg_order_value or 0),
            "unique_items_sold": row.unique_items_sold or 0,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error generating sales summary: {str(e)}"
        )


@router.get("/sales-by-item")
async def get_sales_by_item(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    limit: int = Query(10, description="Number of top items to return"),
    session: AsyncSession = Depends(get_db),
):
    """Get sales breakdown by individual items"""
    try:
        if not start_date:
            start_date = (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d")
        if not end_date:
            end_date = datetime.utcnow().strftime("%Y-%m-%d")

        # Convert string dates to datetime objects for proper SQL handling
        start_datetime = datetime.strptime(start_date, "%Y-%m-%d")
        end_datetime = datetime.strptime(end_date, "%Y-%m-%d")

        query = text(
            """
            SELECT 
                item_name,
                category,
                SUM(quantity) as total_quantity,
                SUM(subtotal) as total_revenue,
                AVG(unit_price) as avg_price,
                COUNT(DISTINCT order_id) as orders_count
            FROM order_items 
            WHERE DATE(created_at) BETWEEN :start_date AND :end_date
            GROUP BY item_name, category
            ORDER BY total_revenue DESC
            LIMIT :limit
        """
        )

        result = await session.execute(
            query,
            {"start_date": start_datetime, "end_date": end_datetime, "limit": limit},
        )

        items = []
        for row in result.fetchall():
            items.append(
                {
                    "item_name": row.item_name,
                    "category": row.category,
                    "total_quantity": row.total_quantity,
                    "total_revenue": float(row.total_revenue),
                    "avg_price": float(row.avg_price),
                    "orders_count": row.orders_count,
                }
            )

        return {"period": f"{start_date} to {end_date}", "items": items}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error generating item sales report: {str(e)}"
        )


@router.get("/sales-by-date")
async def get_sales_by_date(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    grouping: str = Query("daily", description="Grouping: daily, weekly, monthly"),
    session: AsyncSession = Depends(get_db),
):
    """Get sales data grouped by date periods"""
    try:
        if not start_date:
            start_date = (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d")
        if not end_date:
            end_date = datetime.utcnow().strftime("%Y-%m-%d")

        # Convert string dates to datetime objects for proper SQL handling
        start_datetime = datetime.strptime(start_date, "%Y-%m-%d")
        end_datetime = datetime.strptime(end_date, "%Y-%m-%d")

        # Different groupings for date formatting
        date_format_map = {
            "daily": "DATE(created_at)",
            "weekly": "DATE_TRUNC('week', created_at)::date",
            "monthly": "DATE_TRUNC('month', created_at)::date",
        }

        date_format = date_format_map.get(grouping, "DATE(created_at)")

        query = text(
            f"""
            SELECT 
                {date_format} as period,
                COUNT(DISTINCT order_id) as orders_count,
                SUM(quantity) as total_items,
                SUM(subtotal) as total_revenue
            FROM order_items 
            WHERE DATE(created_at) BETWEEN :start_date AND :end_date
            GROUP BY {date_format}
            ORDER BY period DESC
        """
        )

        result = await session.execute(
            query, {"start_date": start_datetime, "end_date": end_datetime}
        )

        sales_data = []
        for row in result.fetchall():
            sales_data.append(
                {
                    "period": row.period.strftime("%Y-%m-%d"),
                    "orders_count": row.orders_count,
                    "total_items": row.total_items,
                    "total_revenue": float(row.total_revenue),
                }
            )

        return {
            "grouping": grouping,
            "period": f"{start_date} to {end_date}",
            "data": sales_data,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating date-based sales report: {str(e)}",
        )


@router.get("/top-performers")
async def get_top_performers(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    metric: str = Query("revenue", description="Metric: revenue, quantity, orders"),
    limit: int = Query(5, description="Number of top performers to return"),
    session: AsyncSession = Depends(get_db),
):
    """Get top performing items by different metrics"""
    try:
        if not start_date:
            start_date = (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d")
        if not end_date:
            end_date = datetime.utcnow().strftime("%Y-%m-%d")

        metric_map = {
            "revenue": "SUM(subtotal)",
            "quantity": "SUM(quantity)",
            "orders": "COUNT(DISTINCT order_id)",
        }

        order_by = metric_map.get(metric, "SUM(subtotal)")

        query = text(
            f"""
            SELECT 
                item_name,
                category,
                SUM(quantity) as total_quantity,
                SUM(subtotal) as total_revenue,
                COUNT(DISTINCT order_id) as orders_count,
                AVG(unit_price) as avg_price
            FROM order_items 
            WHERE DATE(created_at) BETWEEN :start_date AND :end_date
            GROUP BY item_name, category
            ORDER BY {order_by} DESC
            LIMIT :limit
        """
        )

        result = await session.execute(
            query, {"start_date": start_date, "end_date": end_date, "limit": limit}
        )

        performers = []
        for row in result.fetchall():
            performers.append(
                {
                    "item_name": row.item_name,
                    "category": row.category,
                    "total_quantity": row.total_quantity,
                    "total_revenue": float(row.total_revenue),
                    "orders_count": row.orders_count,
                    "avg_price": float(row.avg_price),
                }
            )

        return {
            "metric": metric,
            "period": f"{start_date} to {end_date}",
            "top_performers": performers,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error generating top performers report: {str(e)}"
        )


@router.get("/hourly-sales")
async def get_hourly_sales(
    date: Optional[str] = Query(
        None, description="Date (YYYY-MM-DD), defaults to today"
    ),
    session: AsyncSession = Depends(get_db),
):
    """Get hourly sales breakdown for a specific date"""
    try:
        if not date:
            date = datetime.utcnow().strftime("%Y-%m-%d")

        query = text(
            """
            SELECT 
                EXTRACT(HOUR FROM created_at) as hour,
                COUNT(DISTINCT order_id) as orders_count,
                SUM(quantity) as total_items,
                SUM(subtotal) as total_revenue
            FROM order_items 
            WHERE DATE(created_at) = :date
            GROUP BY EXTRACT(HOUR FROM created_at)
            ORDER BY hour
        """
        )

        result = await session.execute(query, {"date": date})

        hourly_data = []
        for row in result.fetchall():
            hourly_data.append(
                {
                    "hour": int(row.hour),
                    "hour_formatted": f"{int(row.hour):02d}:00",
                    "orders_count": row.orders_count,
                    "total_items": row.total_items,
                    "total_revenue": float(row.total_revenue),
                }
            )

        return {"date": date, "hourly_sales": hourly_data}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error generating hourly sales report: {str(e)}"
        )


@router.get("/sales-comparison")
async def get_sales_comparison(
    current_start: str = Query(..., description="Current period start (YYYY-MM-DD)"),
    current_end: str = Query(..., description="Current period end (YYYY-MM-DD)"),
    previous_start: str = Query(..., description="Previous period start (YYYY-MM-DD)"),
    previous_end: str = Query(..., description="Previous period end (YYYY-MM-DD)"),
    session: AsyncSession = Depends(get_db),
):
    """Compare sales between two time periods"""
    try:
        # Current period query
        current_query = text(
            """
            SELECT 
                COUNT(DISTINCT order_id) as total_orders,
                SUM(quantity) as total_items,
                SUM(subtotal) as total_revenue,
                AVG(subtotal) as avg_order_value
            FROM order_items 
            WHERE DATE(created_at) BETWEEN :start_date AND :end_date
        """
        )

        current_result = await session.execute(
            current_query, {"start_date": current_start, "end_date": current_end}
        )
        current_row = current_result.fetchone()

        # Previous period query
        previous_result = await session.execute(
            current_query, {"start_date": previous_start, "end_date": previous_end}
        )
        previous_row = previous_result.fetchone()

        # Calculate changes
        current_orders = current_row.total_orders or 0
        previous_orders = previous_row.total_orders or 0
        orders_change = (
            ((current_orders - previous_orders) / previous_orders * 100)
            if previous_orders > 0
            else 0
        )

        current_revenue = float(current_row.total_revenue or 0)
        previous_revenue = float(previous_row.total_revenue or 0)
        revenue_change = (
            ((current_revenue - previous_revenue) / previous_revenue * 100)
            if previous_revenue > 0
            else 0
        )

        current_items = current_row.total_items or 0
        previous_items = previous_row.total_items or 0
        items_change = (
            ((current_items - previous_items) / previous_items * 100)
            if previous_items > 0
            else 0
        )

        return {
            "current_period": {
                "period": f"{current_start} to {current_end}",
                "orders": current_orders,
                "revenue": current_revenue,
                "items": current_items,
                "avg_order_value": float(current_row.avg_order_value or 0),
            },
            "previous_period": {
                "period": f"{previous_start} to {previous_end}",
                "orders": previous_orders,
                "revenue": previous_revenue,
                "items": previous_items,
                "avg_order_value": float(previous_row.avg_order_value or 0),
            },
            "changes": {
                "orders_change_percent": round(orders_change, 2),
                "revenue_change_percent": round(revenue_change, 2),
                "items_change_percent": round(items_change, 2),
            },
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error generating sales comparison: {str(e)}"
        )
