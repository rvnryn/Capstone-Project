from fastapi import APIRouter, Query, Depends, HTTPException, Request
from slowapi.util import get_remote_address
from slowapi import Limiter

limiter = Limiter(key_func=get_remote_address, default_limits=["10/minute"])
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from typing import List, Optional
from datetime import datetime, timedelta
from app.supabase import get_db
from sqlalchemy import select
from app.models.custom_holiday import CustomHoliday

router = APIRouter()

# --- Weekly Sales Forecast Endpoint ---
from typing import Dict
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression

import holidays


@limiter.limit("10/minute")
@router.get("/weekly-sales-forecast")
async def get_weekly_sales_forecast(
    request: Request,
    weeks_ahead: int = Query(1, description="Number of weeks to forecast"),
    item_name: Optional[str] = Query(None, description="Filter by item name"),
    category: Optional[str] = Query(None, description="Filter by category"),
    session: AsyncSession = Depends(get_db),
):
    """Forecast total sales, or sales for a specific item/category, for the next N weeks using linear regression"""
    try:
        # Build dynamic SQL for filtering
        filters = ["created_at >= :start_date"]
        params = {}
        if item_name:
            filters.append("item_name = :item_name")
            params["item_name"] = item_name
        if category:
            filters.append("category = :category")
            params["category"] = category
        where_clause = " AND ".join(filters)
        query = text(
            f"""
            SELECT DATE_TRUNC('week', created_at::timestamp)::date as week, SUM(subtotal) as total_sales
            FROM order_items
            WHERE {where_clause}
            GROUP BY week
            ORDER BY week
            """
        )

        start_date = (datetime.utcnow() - timedelta(weeks=8)).date()
        # Convert start_date to ISO string if it's a date or datetime
        if isinstance(start_date, (datetime,)):
            params["start_date"] = start_date.isoformat()
        else:
            params["start_date"] = start_date.strftime("%Y-%m-%d")
        result = await session.execute(query, params)
        rows = result.fetchall()
        if not rows or len(rows) < 4:
            return {"error": "Not enough historical data for weekly forecasting."}

        # Prepare data for regression with seasonality and holiday features
        df = pd.DataFrame(rows, columns=["week", "total_sales"])
        df["week"] = pd.to_datetime(df["week"])
        df = df.sort_values("week")
        df["week_num"] = (df["week"] - df["week"].min()).dt.days // 7

        # Drop rows with NaN total_sales (prevents model.fit error)
        df = df.dropna(subset=["total_sales"])
        if df.empty or len(df) < 4:
            return {"error": "Not enough clean historical data for weekly forecasting."}

        # Use holidays library for Philippine holidays
        ph_holidays = holidays.country_holidays(
            "PH", years=range(df["week"].min().year, df["week"].max().year + 3)
        )

        # --- Fetch custom holidays from DB ---
        custom_holiday_rows = await session.execute(select(CustomHoliday.date))
        custom_holiday_dates = set([row[0] for row in custom_holiday_rows.fetchall()])

        # Add seasonality features (month, week of year, etc.)
        df["month"] = df["week"].dt.month
        df["weekofyear"] = df["week"].dt.isocalendar().week.astype(int)

        # Add holiday feature: 1 if week contains a holiday (official or custom), else 0
        # Also return holiday_type: 'official', 'custom', or None
        def get_holiday_info(week_start):
            week_end = week_start + timedelta(days=6)
            # Check official holidays
            official_holidays = [
                h for h in ph_holidays if week_start <= pd.to_datetime(h) <= week_end
            ]
            custom_holidays = [
                h
                for h in custom_holiday_dates
                if week_start <= pd.to_datetime(h) <= week_end
            ]
            if official_holidays and custom_holidays:
                # If both, prefer 'official' (or could return 'both')
                return 1, "official"  # or 'both' if you want to distinguish
            elif official_holidays:
                return 1, "official"
            elif custom_holidays:
                return 1, "custom"
            else:
                return 0, None

        holiday_info = df["week"].apply(get_holiday_info)
        df["is_holiday_week"] = holiday_info.apply(lambda x: x[0])
        df["holiday_type"] = holiday_info.apply(lambda x: x[1])

        # Features: week_num, month, weekofyear, is_holiday_week
        X = df[["week_num", "month", "weekofyear", "is_holiday_week"]].values
        y = df["total_sales"].values

        # Train linear regression model
        model = LinearRegression()
        model.fit(X, y)

        # Historical predictions (for chart/accuracy)
        hist_X = df[["week_num", "month", "weekofyear", "is_holiday_week"]].values
        hist_pred = model.predict(hist_X)
        historical_predictions = [
            {
                "week_start": w.strftime("%Y-%m-%d"),
                "predicted_sales": float(max(0, pred)),
                "actual_sales": float(actual),
                "is_holiday_week": int(holiday),
                "holiday_type": htype,
            }
            for w, pred, actual, holiday, htype in zip(
                df["week"],
                hist_pred,
                df["total_sales"],
                df["is_holiday_week"],
                df["holiday_type"],
            )
        ]

        # Forecast for the next N weeks (future)
        last_week_num = df["week_num"].max()
        last_week = df["week"].max()
        forecast_dates = [
            (last_week + timedelta(weeks=i)) for i in range(1, weeks_ahead + 1)
        ]

        forecast_X = []
        forecast_holiday_types = []
        for i, week_start in enumerate(forecast_dates, 1):
            week_num = last_week_num + i
            month = week_start.month
            weekofyear = week_start.isocalendar()[1]
            week_end = week_start + timedelta(days=6)
            # Check both official and custom holidays for forecast
            official_holidays = [
                h for h in ph_holidays if week_start <= pd.to_datetime(h) <= week_end
            ]
            custom_holidays = [
                h
                for h in custom_holiday_dates
                if week_start <= pd.to_datetime(h) <= week_end
            ]
            if official_holidays and custom_holidays:
                is_holiday_week = 1
                holiday_type = "official"  # or 'both' if you want to distinguish
            elif official_holidays:
                is_holiday_week = 1
                holiday_type = "official"
            elif custom_holidays:
                is_holiday_week = 1
                holiday_type = "custom"
            else:
                is_holiday_week = 0
                holiday_type = None
            forecast_X.append([week_num, month, weekofyear, is_holiday_week])
            forecast_holiday_types.append(holiday_type)
        forecast_X = np.array(forecast_X)
        forecast = model.predict(forecast_X)

        forecast_results = [
            {
                "week_start": d.strftime("%Y-%m-%d"),
                "predicted_sales": float(max(0, pred)),
                "is_holiday_week": int(x[3]),
                "holiday_type": htype,
            }
            for d, pred, x, htype in zip(
                forecast_dates, forecast, forecast_X, forecast_holiday_types
            )
        ]

        return {
            "forecast_period": f"{forecast_dates[0].strftime('%Y-%m-%d')} to {forecast_dates[-1].strftime('%Y-%m-%d')}",
            "forecast": forecast_results,
            "historical_predictions": historical_predictions,
        }
    except Exception as e:
        import traceback

        print("WEEKLY FORECAST ERROR:", e)
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Error generating weekly sales forecast: {str(e)}"
        )


@limiter.limit("10/minute")
@router.get("/sales-summary")
async def get_sales_summary(
    request: Request,
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

        # Convert to datetime if needed
        def ensure_datetime(val):
            if isinstance(val, datetime):
                return val
            if isinstance(val, str):
                return datetime.strptime(val, "%Y-%m-%d")
            raise ValueError(f"Invalid date value: {val}")

        start_datetime = ensure_datetime(start_date)
        end_datetime = ensure_datetime(end_date)

        query = text(
            """
            SELECT 
                COUNT(DISTINCT order_id) as total_orders,
                SUM(quantity) as total_items_sold,
                SUM(subtotal) as total_revenue,
                AVG(subtotal) as avg_order_value,
                COUNT(DISTINCT item_name) as unique_items_sold
            FROM order_items 
            WHERE DATE(created_at) BETWEEN DATE(:start_date) AND DATE(:end_date)
        """
        )

        print("[SALES SUMMARY] Start")
        print("[SALES SUMMARY] Query:", query)
        print(
            "[SALES SUMMARY] Params:",
            {"start_date": start_datetime, "end_date": end_datetime},
        )
        # Pass as date objects for asyncpg compatibility
        result = await session.execute(
            query,
            {"start_date": start_datetime.date(), "end_date": end_datetime.date()},
        )
        row = result.fetchone()
        print("[SALES SUMMARY] Row:", row)
        if row is None:
            print("[SALES SUMMARY] No row returned, returning zeros.")
            return {
                "period": f"{start_date} to {end_date}",
                "total_orders": 0,
                "total_items_sold": 0,
                "total_revenue": 0.0,
                "avg_order_value": 0.0,
                "unique_items_sold": 0,
            }
        if all(val is None or val == 0 for val in row):
            print("[SALES SUMMARY] All row values None/0, returning zeros.")
            return {
                "period": f"{start_date} to {end_date}",
                "total_orders": 0,
                "total_items_sold": 0,
                "total_revenue": 0.0,
                "avg_order_value": 0.0,
                "unique_items_sold": 0,
            }

        print("[SALES SUMMARY] Returning data.")
        return {
            "period": f"{start_date} to {end_date}",
            "total_orders": row[0] or 0,
            "total_items_sold": row[1] or 0,
            "total_revenue": float(row[2] or 0),
            "avg_order_value": float(row[3] or 0),
            "unique_items_sold": row[4] or 0,
        }
    except Exception as e:
        import traceback

        print("[SALES SUMMARY] Exception:", e)
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Error generating sales summary: {str(e)}"
        )


@limiter.limit("10/minute")
@router.get("/sales-by-item")
async def get_sales_by_item(
    request: Request,
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
                    "item_name": getattr(row, "item_name", "") or "",
                    "category": getattr(row, "category", "") or "",
                    "total_quantity": row.total_quantity if row.total_quantity is not None else 0,
                    "total_revenue": float(row.total_revenue) if row.total_revenue is not None else 0.0,
                    "avg_price": float(row.avg_price) if row.avg_price is not None else 0.0,
                    "orders_count": row.orders_count if row.orders_count is not None else 0,
                }
            )
        return {"period": f"{start_date} to {end_date}", "items": items}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error generating item sales report: {str(e)}"
        )


@limiter.limit("10/minute")
@router.get("/sales-by-date")
async def get_sales_by_date(
    request: Request,
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
                    "period": row.period.strftime("%Y-%m-%d") if row.period else "",
                    "orders_count": row.orders_count if row.orders_count is not None else 0,
                    "total_items": row.total_items if row.total_items is not None else 0,
                    "total_revenue": float(row.total_revenue) if row.total_revenue is not None else 0.0,
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


@limiter.limit("10/minute")
@router.get("/top-performers")
async def get_top_performers(
    request: Request,
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


@limiter.limit("10/minute")
@router.get("/hourly-sales")
async def get_hourly_sales(
    request: Request,
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


@limiter.limit("10/minute")
@router.get("/sales-comparison")
async def get_sales_comparison(
    request: Request,
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
