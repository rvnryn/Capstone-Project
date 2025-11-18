from fastapi import APIRouter, Query, Depends, HTTPException, Request
from fastapi import Body
from slowapi.util import get_remote_address
from slowapi import Limiter

limiter = Limiter(key_func=get_remote_address, default_limits=["10/minute"])
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from typing import List, Optional
from datetime import datetime, timedelta
from dateutil import parser as date_parser
from app.supabase import get_db
from sqlalchemy import select
from app.models.custom_holiday import CustomHoliday
from app.models.user_activity_log import UserActivityLog
from app.routes.Inventory.master_inventory import require_role

from typing import Dict
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
import holidays

router = APIRouter()

@router.post("/import-sales-json")
async def import_sales_json(
    sales_data: list = Body(..., example=[{"sale_date": "02-Nov-25 11:09:12", "count": 1}]),
    session: AsyncSession = Depends(get_db),
):
    """
    Import sales data in custom JSON format, parse sale_date, and insert into sales_report table.
    Fetch category from menu table for each item.
    """
    inserted = 0
    errors = []
    for entry in sales_data:
        try:
            dt = datetime.strptime(entry["sale_date"], "%d-%b-%y %H:%M:%S")
            item_name = entry.get("item_name", "Imported Sale")
            itemcode = entry.get("itemcode")
            category_res = await session.execute(
                text("SELECT category FROM menu WHERE itemcode = :itemcode LIMIT 1"),
                {"itemcode": itemcode}
            )
            category_row = category_res.fetchone()
            category = category_row[0] if category_row else None

            await session.execute(
                text("""
                    INSERT INTO sales_report (sale_date, total_price, item_name, count, category)
                    VALUES (:sale_date, :total_price, :item_name, :count, :category)
                """),
                {
                    "sale_date": dt,
                    "total_price": entry.get("total_price", 0),
                    "item_name": item_name,
                    "count": entry.get("count", 1),
                    "category": category,
                },
            )
            inserted += 1
        except Exception as e:
            errors.append({"entry": entry, "error": str(e)})
    await session.commit()

    # --- Update missing categories after import ---
    update_query = text("""
        UPDATE sales_report sr
        SET category = m.category
        FROM menu m
        WHERE sr.itemcode = m.itemcode
        AND (sr.category IS NULL OR sr.category = '')
    """)
    await session.execute(update_query)
    await session.commit()
    return {"inserted": inserted, "errors": errors}

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
        filters = ["sale_date >= :start_date"]
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
            SELECT DATE_TRUNC('week', sale_date::timestamp)::date as week, SUM(total_price) as total_sales
            FROM sales_report
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
        if not rows or len(rows) < 1:
            return {"error": "Not enough historical data for weekly forecasting (need at least 1 week)."}

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
        custom_holiday_rows = await session.execute(select(CustomHoliday.date, CustomHoliday.name))
        custom_holiday_dict = {row[0]: row[1] for row in custom_holiday_rows.fetchall()}
        custom_holiday_dates = set(custom_holiday_dict.keys())

        # Add seasonality features (month, week of year, etc.)
        df["month"] = df["week"].dt.month
        df["weekofyear"] = df["week"].dt.isocalendar().week.astype(int)

        # Add holiday feature: 1 if week contains a holiday (official or custom), else 0
        # Also return holiday_type and holiday_names
        def get_holiday_info(week_start):
            week_end = week_start + timedelta(days=6)
            # Check official holidays
            official_holidays = [
                h for h in ph_holidays if week_start <= pd.to_datetime(h) <= week_end
            ]
            official_holiday_names = [ph_holidays[h] for h in official_holidays]

            custom_holidays = [
                h
                for h in custom_holiday_dates
                if week_start <= pd.to_datetime(h) <= week_end
            ]
            custom_holiday_names = [custom_holiday_dict[h] for h in custom_holidays]

            if official_holidays and custom_holidays:
                # If both, combine the names
                all_names = official_holiday_names + custom_holiday_names
                return 1, "official", ", ".join(all_names)
            elif official_holidays:
                return 1, "official", ", ".join(official_holiday_names)
            elif custom_holidays:
                return 1, "custom", ", ".join(custom_holiday_names)
            else:
                return 0, None, None

        holiday_info = df["week"].apply(get_holiday_info)
        df["is_holiday_week"] = holiday_info.apply(lambda x: x[0])
        df["holiday_type"] = holiday_info.apply(lambda x: x[1])
        df["holiday_names"] = holiday_info.apply(lambda x: x[2])

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
                "holiday_names": hnames,
            }
            for w, pred, actual, holiday, htype, hnames in zip(
                df["week"],
                hist_pred,
                df["total_sales"],
                df["is_holiday_week"],
                df["holiday_type"],
                df["holiday_names"],
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
        forecast_holiday_names = []
        for i, week_start in enumerate(forecast_dates, 1):
            week_num = last_week_num + i
            month = week_start.month
            weekofyear = week_start.isocalendar()[1]
            week_end = week_start + timedelta(days=6)
            # Check both official and custom holidays for forecast
            official_holidays = [
                h for h in ph_holidays if week_start <= pd.to_datetime(h) <= week_end
            ]
            official_holiday_names = [ph_holidays[h] for h in official_holidays]

            custom_holidays = [
                h
                for h in custom_holiday_dates
                if week_start <= pd.to_datetime(h) <= week_end
            ]
            custom_holiday_names = [custom_holiday_dict[h] for h in custom_holidays]

            if official_holidays and custom_holidays:
                is_holiday_week = 1
                holiday_type = "official"
                holiday_names = ", ".join(official_holiday_names + custom_holiday_names)
            elif official_holidays:
                is_holiday_week = 1
                holiday_type = "official"
                holiday_names = ", ".join(official_holiday_names)
            elif custom_holidays:
                is_holiday_week = 1
                holiday_type = "custom"
                holiday_names = ", ".join(custom_holiday_names)
            else:
                is_holiday_week = 0
                holiday_type = None
                holiday_names = None
            forecast_X.append([week_num, month, weekofyear, is_holiday_week])
            forecast_holiday_types.append(holiday_type)
            forecast_holiday_names.append(holiday_names)
        forecast_X = np.array(forecast_X)
        forecast = model.predict(forecast_X)

        forecast_results = [
            {
                "week_start": d.strftime("%Y-%m-%d"),
                "predicted_sales": float(max(0, pred)),
                "is_holiday_week": int(x[3]),
                "holiday_type": htype,
                "holiday_names": hnames,
            }
            for d, pred, x, htype, hnames in zip(
                forecast_dates, forecast, forecast_X, forecast_holiday_types, forecast_holiday_names
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
                SUM(quantity) as total_items_sold,
                SUM(total_price) as total_revenue,
                AVG(total_price) as avg_order_value,
                COUNT(DISTINCT item_name) as unique_items_sold
            FROM sales_report
            WHERE DATE(sale_date) BETWEEN :start_date AND :end_date
        """
        )

        print("[SALES SUMMARY] Start")
        print("[SALES SUMMARY] Query:", query)
        print(
            "[SALES SUMMARY] Params:",
            {"start_date": start_datetime, "end_date": end_datetime},
        )
        # Pass as datetime objects (not .date()) to match sales-detailed endpoint
        result = await session.execute(
            query,
            {"start_date": start_datetime, "end_date": end_datetime},
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
        # Fix: Map row indices to correct columns based on SELECT order
        # Query returns: total_items_sold(row[0]), total_revenue(row[1]), avg_order_value(row[2]), unique_items_sold(row[3])
        total_items = int(row[0] or 0)
        total_revenue = float(row[1] or 0)
        avg_order = float(row[2] or 0)
        unique_items = int(row[3] or 0)

        # Calculate total_orders: if we have items sold, use total_items as proxy for orders
        # (This assumes 1 order = 1 item; adjust if you track orders separately)
        total_orders = total_items  # or use COUNT(DISTINCT order_id) if you have order tracking

        return {
            "period": f"{start_date} to {end_date}",
            "total_orders": total_orders,
            "total_items_sold": total_items,
            "total_revenue": total_revenue,
            "avg_order_value": avg_order,
            "unique_items_sold": unique_items,
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
                sr.item_name,
                m.category,
                SUM(sr.quantity) as total_quantity,
                SUM(sr.total_price) as total_revenue,
                AVG(sr.unit_price) as avg_price
            FROM sales_report sr
            LEFT JOIN menu m ON LOWER(TRIM(sr.item_name)) = LOWER(TRIM(m.dish_name))
            WHERE DATE(sr.sale_date) BETWEEN :start_date AND :end_date
            GROUP BY sr.item_name, m.category
            ORDER BY total_revenue DESC
            """
        )
        params = {"start_date": start_datetime, "end_date": end_datetime}

        result = await session.execute(query, params)

        items = []
        for row in result.fetchall():
            items.append(
                {
                    "item_name": getattr(row, "item_name", "") or "",
                    "category": getattr(row, "category", "") or "",
                    "total_quantity": (
                        row.total_quantity if row.total_quantity is not None else 0
                    ),
                    "total_revenue": (
                        float(row.total_revenue)
                        if row.total_revenue is not None
                        else 0.0
                    ),
                    "avg_price": (
                        float(row.avg_price) if row.avg_price is not None else 0.0
                    ),
                    # "orders_count" removed: not present in query
                }
            )
        return {"period": f"{start_date} to {end_date}", "items": items}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error generating item sales report: {str(e)}"
        )


@limiter.limit("10/minute")
@router.get("/sales-detailed")
async def get_sales_detailed(
    request: Request,
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    session: AsyncSession = Depends(get_db),
):
    """Get detailed sales records with all restaurant information (NO aggregation)"""
    try:
        if not start_date:
            start_date = (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d")
        if not end_date:
            end_date = datetime.utcnow().strftime("%Y-%m-%d")

        # Convert string dates to datetime objects for proper SQL handling
        start_datetime = datetime.strptime(start_date, "%Y-%m-%d")
        end_datetime = datetime.strptime(end_date, "%Y-%m-%d")

        # First, check what columns exist in the table
        check_columns_query = text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'sales_report'
            ORDER BY ordinal_position
        """)

        columns_result = await session.execute(check_columns_query)
        available_columns = [row[0] for row in columns_result.fetchall()]

        print(f"[DEBUG] Available columns in sales_report: {available_columns}")

        # Build dynamic SELECT based on available columns
        base_columns = ["sale_date", "item_name", "category", "quantity", "unit_price", "price", "total_price"]
        optional_columns = [
            "order_number", "transaction_number", "receipt_number", "subtotal",
            "discount_percentage", "dine_type", "order_taker", "cashier",
            "terminal_no", "member", "itemcode"
        ]

        # Only select columns that exist
        select_columns = base_columns + [col for col in optional_columns if col in available_columns]
        select_clause = ", ".join(select_columns)

        # Query with LEFT JOIN to menu to get category if it's empty in sales_report
        # Uses REPLACE to remove spaces for matching (e.g., "BAGNETSILOG" matches "Bagnet Silog")
        query = text(f"""
            SELECT
                sr.sale_date,
                sr.item_name,
                COALESCE(NULLIF(sr.category, ''), m.category, '') as category,
                sr.quantity,
                sr.unit_price,
                sr.price,
                sr.total_price
                {', sr.' + ', sr.'.join([col for col in optional_columns if col in available_columns]) if any(col in available_columns for col in optional_columns) else ''}
            FROM sales_report sr
            LEFT JOIN menu m ON LOWER(REPLACE(TRIM(sr.item_name), ' ', '')) = LOWER(REPLACE(TRIM(m.dish_name), ' ', ''))
            WHERE DATE(sr.sale_date) BETWEEN :start_date AND :end_date
            ORDER BY sr.sale_date DESC
            LIMIT 1000
        """)

        params = {"start_date": start_datetime, "end_date": end_datetime}
        result = await session.execute(query, params)

        sales = []
        for row in result.fetchall():
            sale_dict = {}
            for i, col_name in enumerate(select_columns):
                value = row[i]
                if value is not None:
                    if col_name == "sale_date":
                        sale_dict[col_name] = value.strftime("%Y-%m-%d %H:%M") if hasattr(value, 'strftime') else str(value)
                    elif col_name in ["unit_price", "price", "subtotal", "discount_percentage", "total_price"]:
                        sale_dict[col_name] = float(value)
                    elif col_name == "quantity":
                        sale_dict[col_name] = int(value)
                    else:
                        sale_dict[col_name] = str(value)
                else:
                    sale_dict[col_name] = "" if col_name not in ["quantity", "unit_price", "price", "subtotal", "discount_percentage", "total_price"] else 0

            sales.append(sale_dict)

        print(f"[DEBUG] Returning {len(sales)} sales records")
        return {"period": f"{start_date} to {end_date}", "sales": sales}

    except Exception as e:
        import traceback
        print(f"[ERROR] sales-detailed endpoint error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Error generating detailed sales report: {str(e)}"
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
            "daily": "DATE(sale_date)",
            "weekly": "DATE_TRUNC('week', sale_date)::date",
            "monthly": "DATE_TRUNC('month', sale_date)::date",
        }

        date_format = date_format_map.get(grouping, "DATE(created_at)")

        query = text(
            f"""
            SELECT 
                {date_format} as period,
                SUM(quantity) as total_items,
                SUM(total_price) as total_revenue
            FROM sales_report 
            WHERE DATE(sale_date) BETWEEN :start_date AND :end_date
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
                    # "orders_count" removed: not present in query
                    "total_items": (
                        row.total_items if row.total_items is not None else 0
                    ),
                    "total_revenue": (
                        float(row.total_revenue)
                        if row.total_revenue is not None
                        else 0.0
                    ),
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
            "revenue": "SUM(total_price)",
            "quantity": "SUM(quantity)"
        }

        order_by = metric_map.get(metric, "SUM(total_price)")

        query = text(
            f"""
            SELECT
    LOWER(TRIM(REGEXP_REPLACE(item_name, '[^a-zA-Z0-9 ]', '', 'g'))) AS normalized_item_name,
    MAX(category) as category,
    SUM(quantity) as total_quantity_sold,
    SUM(total_price) as total_revenue,
    AVG(unit_price) as avg_price
FROM sales_report
WHERE DATE(sale_date) BETWEEN :start_date AND :end_date
GROUP BY normalized_item_name
ORDER BY total_revenue DESC
LIMIT 10
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
                EXTRACT(HOUR FROM sale_date) as hour,
                SUM(quantity) as total_items,
                SUM(total_price) as total_revenue
            FROM sales_report 
            WHERE DATE(sale_date) = :date
            GROUP BY EXTRACT(HOUR FROM sale_date)
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
                SUM(quantity) as total_items,
                SUM(total_price) as total_revenue,
                AVG(total_price) as avg_order_value
            FROM sales_report
            WHERE DATE(sale_date) BETWEEN :start_date AND :end_date
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


@limiter.limit("10/minute")
@router.get("/comprehensive-sales-analytics")
async def get_comprehensive_sales_analytics(
    request: Request,
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    session: AsyncSession = Depends(get_db),
):
    """
    Get comprehensive sales analytics including:
    - Total Revenue
    - Cost of Goods Sold (COGS)
    - Gross Profit
    - Loss/Spoilage Costs
    - Net Profit
    - Profit Margins
    - Top Performing Items
    - Category Breakdown

    IMPORTANT FIXES (2025):
    - Fixed COGS calculation that was showing negative profits due to unit mismatch
    - Added proper sales aggregation to prevent double-counting
    - Implemented unit conversion (g, kg, ml, L, oz, tbsp, tsp, cup, pcs)
    - Adjusted unit costs: assumes inventory unit_cost is per kg/L, divides by 1000 for gram/ml calculations
    - This prevents the 1000x multiplication error that caused COGS to be 73x revenue
    """
    try:
        # Default to ALL TIME if no dates provided
        if not start_date:
            start_date = "2000-01-01"  # Far enough in the past to capture all sales
        if not end_date:
            # Use current date in Philippine timezone (UTC+8)
            from datetime import timezone
            ph_tz = timezone(timedelta(hours=8))
            end_date = datetime.now(ph_tz).strftime("%Y-%m-%d")

        start_datetime = datetime.strptime(start_date, "%Y-%m-%d")
        end_datetime = datetime.strptime(end_date, "%Y-%m-%d")

        # 1. Get Total Revenue and Sales Summary
        revenue_query = text(
            """
            SELECT
                SUM(quantity) as total_items_sold,
                SUM(total_price) as total_revenue,
                AVG(unit_price) as avg_unit_cost,
                COUNT(DISTINCT item_name) as unique_items_sold,
                COUNT(*) as total_transactions
            FROM sales_report
            WHERE DATE(sale_date) BETWEEN :start_date AND :end_date
        """
        )

        revenue_result = await session.execute(
            revenue_query,
            {"start_date": start_datetime.date(), "end_date": end_datetime.date()},
        )
        revenue_row = revenue_result.fetchone()

        total_revenue = float(revenue_row.total_revenue or 0)
        total_items_sold = revenue_row.total_items_sold or 0
        unique_items_sold = revenue_row.unique_items_sold or 0
        total_transactions = revenue_row.total_transactions or 0
        avg_unit_cost = float(revenue_row.avg_unit_cost or 0)

        # 2. Calculate COGS (Cost of Goods Sold) from menu ingredients
        # This calculates the cost based on ingredients used for sold menu items
        # IMPORTANT: Properly aggregates sales by menu item first, then calculates ingredient costs
        # This prevents double-counting when multiple sales rows exist for the same dish
        cogs_query = text(
            """
            WITH sales_aggregated AS (
                -- CRITICAL FIX: Aggregate sales by item FIRST to avoid double-counting
                -- Each row in sales_report represents ONE item sold, so we SUM the quantities
                SELECT
                    sr.item_name,
                    SUM(sr.quantity) as total_quantity_sold,
                    m.menu_id
                FROM sales_report sr
                LEFT JOIN menu m ON LOWER(TRIM(sr.item_name)) = LOWER(TRIM(m.dish_name))
                WHERE DATE(sr.sale_date) BETWEEN :start_date AND :end_date
                  AND m.menu_id IS NOT NULL
                GROUP BY sr.item_name, m.menu_id
            ),
            ingredient_costs AS (
                SELECT
                    sa.item_name,
                    sa.total_quantity_sold,
                    mi.ingredient_name,
                    mi.quantity as ingredient_quantity_per_serving,
                    mi.measurements,
                    -- Get unit cost from inventory
                    COALESCE(
                        (SELECT AVG(it.unit_cost)
                        FROM inventory_today it
                        WHERE LOWER(TRIM(it.item_name)) = LOWER(TRIM(mi.ingredient_name))
                        ),
                        (SELECT AVG(i.unit_cost)
                        FROM inventory i
                        WHERE LOWER(TRIM(i.item_name)) = LOWER(TRIM(mi.ingredient_name))
                        ),
                        (SELECT AVG(isp.unit_cost)
                        FROM inventory_spoilage isp
                        WHERE LOWER(TRIM(isp.item_name)) = LOWER(TRIM(mi.ingredient_name))
                        ),
                        0
                    ) as inventory_unit_cost,
                    -- CRITICAL FIX: Determine the correct unit cost based on measurement type
                    -- If measurements use small units (g, ml) but inventory unit_cost is for large units (kg, L),
                    -- we need to divide by the appropriate conversion factor to get cost per base unit
                    CASE
                        WHEN LOWER(mi.measurements) IN ('g', 'ml', 'oz', 'tbsp', 'tsp', 'cup') THEN
                            -- For small units, assume inventory unit_cost is per kg/L, so divide by 1000
                            COALESCE(
                                (SELECT AVG(it.unit_cost) / 1000.0
                                FROM inventory_today it
                                WHERE LOWER(TRIM(it.item_name)) = LOWER(TRIM(mi.ingredient_name))
                                ),
                                (SELECT AVG(i.unit_cost) / 1000.0
                                FROM inventory i
                                WHERE LOWER(TRIM(i.item_name)) = LOWER(TRIM(mi.ingredient_name))
                                ),
                                (SELECT AVG(isp.unit_cost) / 1000.0
                                FROM inventory_spoilage isp
                                WHERE LOWER(TRIM(isp.item_name)) = LOWER(TRIM(mi.ingredient_name))
                                ),
                                0
                            )
                        WHEN LOWER(mi.measurements) IN ('kg', 'l', 'lbs', 'gal', 'gallon') THEN
                            -- For large units, assume unit_cost is per kg/L/lb/gal, divide by 1000 for gram/ml base
                            COALESCE(
                                (SELECT AVG(it.unit_cost) / 1000.0
                                FROM inventory_today it
                                WHERE LOWER(TRIM(it.item_name)) = LOWER(TRIM(mi.ingredient_name))
                                ),
                                (SELECT AVG(i.unit_cost) / 1000.0
                                FROM inventory i
                                WHERE LOWER(TRIM(i.item_name)) = LOWER(TRIM(mi.ingredient_name))
                                ),
                                (SELECT AVG(isp.unit_cost) / 1000.0
                                FROM inventory_spoilage isp
                                WHERE LOWER(TRIM(isp.item_name)) = LOWER(TRIM(mi.ingredient_name))
                                ),
                                0
                            )
                        WHEN LOWER(COALESCE(mi.measurements, '')) IN ('pcs', 'pack', 'case', 'sack', 'btl', 'bottle', 'can') THEN
                            -- For count/container units, use unit_cost as-is (cost per piece/pack/case/etc)
                            COALESCE(
                                (SELECT AVG(it.unit_cost)
                                FROM inventory_today it
                                WHERE LOWER(TRIM(it.item_name)) = LOWER(TRIM(mi.ingredient_name))
                                ),
                                (SELECT AVG(i.unit_cost)
                                FROM inventory i
                                WHERE LOWER(TRIM(i.item_name)) = LOWER(TRIM(mi.ingredient_name))
                                ),
                                (SELECT AVG(isp.unit_cost)
                                FROM inventory_spoilage isp
                                WHERE LOWER(TRIM(isp.item_name)) = LOWER(TRIM(mi.ingredient_name))
                                ),
                                0
                            )
                        ELSE
                            -- DEFAULT: For missing/unknown/empty units, assume grams and divide by 1000
                            -- This is the safe default since inventory unit_cost is per kg
                            COALESCE(
                                (SELECT AVG(it.unit_cost) / 1000.0
                                FROM inventory_today it
                                WHERE LOWER(TRIM(it.item_name)) = LOWER(TRIM(mi.ingredient_name))
                                ),
                                (SELECT AVG(i.unit_cost) / 1000.0
                                FROM inventory i
                                WHERE LOWER(TRIM(i.item_name)) = LOWER(TRIM(mi.ingredient_name))
                                ),
                                (SELECT AVG(isp.unit_cost) / 1000.0
                                FROM inventory_spoilage isp
                                WHERE LOWER(TRIM(isp.item_name)) = LOWER(TRIM(mi.ingredient_name))
                                ),
                                0
                            )
                    END as unit_cost_adjusted
                FROM sales_aggregated sa
                JOIN menu_ingredients mi ON sa.menu_id = mi.menu_id
                WHERE mi.ingredient_name IS NOT NULL
            ),
            ingredient_costs_normalized AS (
                SELECT
                    item_name,
                    total_quantity_sold,
                    ingredient_name,
                    ingredient_quantity_per_serving,
                    measurements,
                    unit_cost_adjusted,
                    -- Normalize quantity to base units (grams or ml)
                    -- Handles ALL measurement units from inventory settings and menu ingredients
                    CASE
                        -- Weight conversions to grams
                        WHEN LOWER(measurements) = 'kg' THEN ingredient_quantity_per_serving * 1000
                        WHEN LOWER(measurements) = 'g' THEN ingredient_quantity_per_serving
                        WHEN LOWER(measurements) = 'lbs' THEN ingredient_quantity_per_serving * 453.592  -- pounds to grams
                        WHEN LOWER(measurements) = 'oz' THEN ingredient_quantity_per_serving * 28.35    -- ounces to grams

                        -- Volume conversions to ml
                        WHEN LOWER(measurements) = 'l' THEN ingredient_quantity_per_serving * 1000      -- liters to ml
                        WHEN LOWER(measurements) = 'ml' THEN ingredient_quantity_per_serving            -- already ml
                        WHEN LOWER(measurements) = 'gal' THEN ingredient_quantity_per_serving * 3785.41 -- gallons to ml
                        WHEN LOWER(measurements) = 'gallon' THEN ingredient_quantity_per_serving * 3785.41 -- gallons to ml (alt spelling)
                        WHEN LOWER(measurements) = 'tbsp' THEN ingredient_quantity_per_serving * 15     -- tablespoon to ml
                        WHEN LOWER(measurements) = 'tsp' THEN ingredient_quantity_per_serving * 5       -- teaspoon to ml
                        WHEN LOWER(measurements) = 'cup' THEN ingredient_quantity_per_serving * 240     -- cup to ml

                        -- Count/container units (no conversion needed)
                        WHEN LOWER(measurements) IN ('pcs', 'pack', 'case', 'sack', 'btl', 'bottle', 'can') THEN ingredient_quantity_per_serving

                        ELSE ingredient_quantity_per_serving  -- default: no conversion
                    END as quantity_in_base_units
                FROM ingredient_costs
            )
            SELECT
                -- Calculate: (total dishes sold) × (ingredient qty in base units) × (adjusted unit cost)
                COALESCE(SUM(
                    total_quantity_sold * quantity_in_base_units * unit_cost_adjusted
                ), 0) as total_cogs
            FROM ingredient_costs_normalized
        """
        )

        # Debug: First, let's see sample data to understand the issue
        debug_query = text(
            """
            WITH sales_aggregated AS (
                SELECT
                    sr.item_name,
                    SUM(sr.quantity) as total_quantity_sold,
                    m.menu_id
                FROM sales_report sr
                LEFT JOIN menu m ON LOWER(TRIM(sr.item_name)) = LOWER(TRIM(m.dish_name))
                WHERE DATE(sr.sale_date) BETWEEN :start_date AND :end_date
                  AND m.menu_id IS NOT NULL
                GROUP BY sr.item_name, m.menu_id
            ),
            ingredient_costs AS (
                SELECT
                    sa.item_name,
                    sa.total_quantity_sold,
                    mi.ingredient_name,
                    mi.quantity as ingredient_quantity_per_serving,
                    mi.measurements,
                    COALESCE(
                        (SELECT AVG(it.unit_cost)
                        FROM inventory_today it
                        WHERE LOWER(TRIM(it.item_name)) = LOWER(TRIM(mi.ingredient_name))
                        ),
                        (SELECT AVG(i.unit_cost)
                        FROM inventory i
                        WHERE LOWER(TRIM(i.item_name)) = LOWER(TRIM(mi.ingredient_name))
                        ),
                        0
                    ) as inventory_unit_cost
                FROM sales_aggregated sa
                JOIN menu_ingredients mi ON sa.menu_id = mi.menu_id
                WHERE mi.ingredient_name IS NOT NULL
            )
            SELECT
                item_name,
                ingredient_name,
                total_quantity_sold,
                ingredient_quantity_per_serving,
                measurements,
                inventory_unit_cost,
                (total_quantity_sold * ingredient_quantity_per_serving * inventory_unit_cost) as raw_cost
            FROM ingredient_costs
            ORDER BY raw_cost DESC
            LIMIT 5
        """
        )

        debug_result = await session.execute(
            debug_query,
            {"start_date": start_datetime.date(), "end_date": end_datetime.date()},
        )

        for row in debug_result.fetchall():
            print(f"  {row.item_name} -> {row.ingredient_name}:")
            print(f"    Sold: {row.total_quantity_sold} | Per serving: {row.ingredient_quantity_per_serving} {row.measurements} | Unit cost: ₱{row.inventory_unit_cost:.4f} | Total: ₱{row.raw_cost:,.2f}")

        cogs_result = await session.execute(
            cogs_query,
            {"start_date": start_datetime.date(), "end_date": end_datetime.date()},
        )
        cogs_row = cogs_result.fetchone()
        total_cogs = float(cogs_row.total_cogs or 0) if cogs_row else 0.0

        if total_cogs > total_revenue:
            print(f"[COGS WARNING] COGS is higher than revenue! Check unit conversions and inventory unit_cost values.")
        print(f"{'='*60}\n")

        # 3. Get Spoilage/Loss Costs
        print(f"[DEBUG] Querying spoilage data: start={start_datetime.date()}, end={end_datetime.date()}")

        # First check if there's ANY data in inventory_spoilage
        check_query = text("SELECT COUNT(*), MIN(DATE(spoilage_date)), MAX(DATE(spoilage_date)) FROM inventory_spoilage")
        check_result = await session.execute(check_query)
        check_row = check_result.fetchone()
        print(f"[DEBUG] Spoilage table has {check_row[0]} total records, date range: {check_row[1]} to {check_row[2]}")

        spoilage_query = text(
            """
            SELECT
                SUM(quantity_spoiled * COALESCE(unit_cost, 0)) as total_spoilage_cost,
                SUM(quantity_spoiled) as total_quantity_spoiled,
                COUNT(*) as total_spoilage_incidents,
                COUNT(DISTINCT item_name) as unique_items_spoiled
            FROM inventory_spoilage
            WHERE DATE(spoilage_date) BETWEEN :start_date AND :end_date
        """
        )

        spoilage_result = await session.execute(
            spoilage_query,
            {"start_date": start_datetime.date(), "end_date": end_datetime.date()},
        )
        spoilage_row = spoilage_result.fetchone()

        total_spoilage_cost = float(spoilage_row.total_spoilage_cost or 0)
        total_quantity_spoiled = spoilage_row.total_quantity_spoiled or 0
        total_spoilage_incidents = spoilage_row.total_spoilage_incidents or 0
        unique_items_spoiled = spoilage_row.unique_items_spoiled or 0

        print(f"[DEBUG] Spoilage query results: cost={total_spoilage_cost}, qty={total_quantity_spoiled}, incidents={total_spoilage_incidents}")

        # 4. Calculate Profitability Metrics
        gross_profit = total_revenue - total_cogs
        net_profit = gross_profit - total_spoilage_cost

        gross_profit_margin = (
            (gross_profit / total_revenue * 100) if total_revenue > 0 else 0
        )
        net_profit_margin = (
            (net_profit / total_revenue * 100) if total_revenue > 0 else 0
        )
        loss_percentage = (
            (total_spoilage_cost / total_revenue * 100) if total_revenue > 0 else 0
        )

        # 5. Get Top Selling Items (Top 10)
        top_items_query = text(
            """
            SELECT
                sr.item_name,
                COALESCE(NULLIF(sr.category, ''), m.category, 'Uncategorized') as category,
                SUM(sr.quantity) as total_quantity_sold,
                SUM(sr.total_price) as total_revenue,
                AVG(sr.unit_price) as avg_price
            FROM sales_report sr
            LEFT JOIN menu m ON LOWER(REPLACE(TRIM(sr.item_name), ' ', '')) = LOWER(REPLACE(TRIM(m.dish_name), ' ', ''))
            WHERE DATE(sr.sale_date) BETWEEN :start_date AND :end_date
            GROUP BY sr.item_name, COALESCE(NULLIF(sr.category, ''), m.category, 'Uncategorized')
            ORDER BY total_revenue DESC
            LIMIT 10
        """
        )

        top_items_result = await session.execute(
            top_items_query,
            {"start_date": start_datetime.date(), "end_date": end_datetime.date()},
        )

        top_items = []
        for row in top_items_result.fetchall():
            top_items.append(
                {
                    "item_name": row.item_name or "",
                    "category": row.category or "",
                    "total_quantity_sold": row.total_quantity_sold or 0,
                    "total_revenue": float(row.total_revenue or 0),
                    "avg_price": float(row.avg_price or 0),
                }
            )

        # 6. Get Category Breakdown
        category_query = text(
            """
            SELECT
                COALESCE(NULLIF(sr.category, ''), m.category, 'Uncategorized') as category,
                SUM(sr.quantity) as total_quantity,
                SUM(sr.total_price) as total_revenue,
                COUNT(DISTINCT sr.item_name) as unique_items,
                AVG(sr.unit_price) as avg_price
            FROM sales_report sr
            LEFT JOIN menu m ON LOWER(REPLACE(TRIM(sr.item_name), ' ', '')) = LOWER(REPLACE(TRIM(m.dish_name), ' ', ''))
            WHERE DATE(sr.sale_date) BETWEEN :start_date AND :end_date
            GROUP BY COALESCE(NULLIF(sr.category, ''), m.category, 'Uncategorized')
            ORDER BY total_revenue DESC
        """
        )

        category_result = await session.execute(
            category_query,
            {"start_date": start_datetime.date(), "end_date": end_datetime.date()},
        )

        categories = []
        for row in category_result.fetchall():
            cat_revenue = float(row.total_revenue or 0)
            cat_percentage = (cat_revenue / total_revenue * 100) if total_revenue > 0 else 0

            categories.append(
                {
                    "category": row.category or "Uncategorized",
                    "total_quantity": row.total_quantity or 0,
                    "total_revenue": cat_revenue,
                    "revenue_percentage": round(cat_percentage, 2),
                    "unique_items": row.unique_items or 0,
                    "avg_price": float(row.avg_price or 0),
                }
            )

        # 7. Get Spoilage Breakdown by Item (Top 10 most spoiled)
        spoilage_items_query = text(
            """
            SELECT
                item_name,
                category,
                SUM(quantity_spoiled) as total_spoiled,
                SUM(quantity_spoiled * COALESCE(unit_cost, 0)) as total_cost,
                COUNT(*) as incidents,
                STRING_AGG(DISTINCT reason, ', ') as reasons
            FROM inventory_spoilage
            WHERE DATE(spoilage_date) BETWEEN :start_date AND :end_date
            GROUP BY item_name, category
            ORDER BY total_cost DESC
            LIMIT 10
        """
        )

        spoilage_items_result = await session.execute(
            spoilage_items_query,
            {"start_date": start_datetime.date(), "end_date": end_datetime.date()},
        )

        spoilage_items = []
        for row in spoilage_items_result.fetchall():
            spoilage_items.append(
                {
                    "item_name": row.item_name or "",
                    "category": row.category or "",
                    "total_spoiled": row.total_spoiled or 0,
                    "total_cost": float(row.total_cost or 0),
                    "incidents": row.incidents or 0,
                    "reasons": row.reasons or "",
                }
            )

        # 8. Daily Trend (last 7 days within the period)
        # Calculate the actual last 7 days from end_date
        from datetime import timedelta
        last_7_days_start = end_datetime.date() - timedelta(days=6)  # 6 days back + today = 7 days

        daily_trend_query = text(
            """
            SELECT
                DATE(sale_date) as sale_day,
                SUM(quantity) as daily_items,
                SUM(total_price) as daily_revenue
            FROM sales_report
            WHERE DATE(sale_date) BETWEEN :last_7_start AND :end_date
            GROUP BY DATE(sale_date)
            ORDER BY sale_day DESC
        """
        )

        daily_trend_result = await session.execute(
            daily_trend_query,
            {"last_7_start": last_7_days_start, "end_date": end_datetime.date()},
        )

        daily_trend = []
        for row in daily_trend_result.fetchall():
            daily_trend.append(
                {
                    "date": row.sale_day.strftime("%Y-%m-%d") if row.sale_day else "",
                    "total_items": row.daily_items or 0,
                    "total_revenue": float(row.daily_revenue or 0),
                }
            )

        # Return comprehensive analytics
        return {
            "period": f"{start_date} to {end_date}",
            "summary": {
                "total_revenue": round(total_revenue, 2),
                "total_cogs": round(total_cogs, 2),
                "gross_profit": round(gross_profit, 2),
                "total_loss": round(total_spoilage_cost, 2),
                "net_profit": round(net_profit, 2),
                "total_items_sold": total_items_sold,
                "unique_items_sold": unique_items_sold,
                "total_transactions": total_transactions,
                "avg_unit_price": round(avg_unit_cost, 2),
            },
            "profitability": {
                "gross_profit_margin": round(gross_profit_margin, 2),
                "net_profit_margin": round(net_profit_margin, 2),
                "loss_percentage": round(loss_percentage, 2),
                "cogs_percentage": round(
                    (total_cogs / total_revenue * 100) if total_revenue > 0 else 0, 2
                ),
            },
            "loss_analysis": {
                "total_spoilage_cost": round(total_spoilage_cost, 2),
                "total_quantity_spoiled": total_quantity_spoiled,
                "total_incidents": total_spoilage_incidents,
                "unique_items_spoiled": unique_items_spoiled,
                "spoilage_items": spoilage_items,
            },
            "top_performers": top_items,
            "category_breakdown": categories,
            "daily_trend": daily_trend,
        }

    except Exception as e:
        import traceback

        print("COMPREHENSIVE ANALYTICS ERROR:", e)
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error generating comprehensive sales analytics: {str(e)}",
        )


@limiter.limit("10/minute")
@router.post("/export-sales")
async def export_sales(
    request: Request,
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    export_type: str = Query("detailed", description="Export type: detailed or summary"),
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
    db: AsyncSession = Depends(get_db),
):
    """
    Log user activity when sales reports are exported.
    The actual export happens in the frontend, but this endpoint tracks the export action.
    """
    try:
        # Count the records that will be exported
        query = text("""
            SELECT COUNT(*) as count
            FROM sales_report
            WHERE sale_date >= :start_date AND sale_date <= :end_date
        """)
        result = await db.execute(query, {"start_date": start_date, "end_date": end_date})
        count_row = result.fetchone()
        record_count = count_row[0] if count_row else 0

        # Log user activity for sales export
        try:
            user_row = getattr(user, "user_row", user)
            new_activity = UserActivityLog(
                user_id=user_row.get("user_id"),
                action_type="export sales report",
                description=f"Exported {export_type} sales report ({record_count} records) for period: {start_date} to {end_date}",
                activity_date=datetime.utcnow(),
                report_date=datetime.utcnow(),
                user_name=user_row.get("name"),
                role=user_row.get("user_role"),
            )
            db.add(new_activity)
            await db.flush()
            await db.commit()
        except Exception as e:
            print(f"Failed to record user activity for sales export: {e}")

        return {
            "message": "Export logged successfully",
            "records": record_count,
            "date_range": f"{start_date} to {end_date}",
            "export_type": export_type
        }

    except Exception as e:
        import traceback
        print("EXPORT LOGGING ERROR:", e)
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error logging sales export: {str(e)}",
        )

@limiter.limit("5/minute")
@router.post("/clean-sales-report-invalid-dates")
async def clean_sales_report_invalid_dates(
    request: Request,
    session: AsyncSession = Depends(get_db),
):
    """
    Delete rows in sales_report where sale_date is not a valid date (YYYY-MM-DD or YYYY-MM-DD HH:MM:SS).
    Returns the number and details of deleted rows.
    """
    import re
    try:
        # Regex for valid date (YYYY-MM-DD or YYYY-MM-DD HH:MM:SS)
        date_regex = r"^\\d{4}-\\d{2}-\\d{2}(?:[ T]\\d{2}:\\d{2}(:\\d{2})?)?$"
        # Find invalid rows
        query = text("""
            SELECT sales_id, sale_date, item_name, total_price
            FROM sales_report
        """)
        result = await session.execute(query)
        rows = result.fetchall()
        invalid_rows = [
            dict(sales_id=row.sales_id, sale_date=row.sale_date, item_name=row.item_name, total_price=row.total_price)
            for row in rows
            if not row.sale_date or not re.match(date_regex, str(row.sale_date))
        ]
        deleted_count = 0
        deleted_ids = []
        if invalid_rows:
            # Delete invalid rows
            delete_ids = [row["sales_id"] for row in invalid_rows]
            delete_query = text("DELETE FROM sales_report WHERE sales_id = ANY(:ids)")
            await session.execute(delete_query, {"ids": delete_ids})
            await session.commit()
            deleted_count = len(delete_ids)
            deleted_ids = delete_ids
        return {
            "deleted_count": deleted_count,
            "deleted_ids": deleted_ids,
            "invalid_rows": invalid_rows,
            "message": f"Deleted {deleted_count} invalid sales_report rows."
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error cleaning sales_report: {str(e)}")

@router.post("/update-sales-categories")
async def update_sales_categories(session: AsyncSession = Depends(get_db)):
    """
    Update missing categories in sales_report by joining with menu table.
    """
    try:
        update_query = text("""
            UPDATE sales_report sr
            SET category = m.category
            FROM menu m
            WHERE sr.itemcode = m.itemcode
            AND (sr.category IS NULL OR sr.category = '')
        """)
        result = await session.execute(update_query)
        await session.commit()
        return {"message": "Sales categories updated successfully."}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error updating sales categories: {str(e)}")