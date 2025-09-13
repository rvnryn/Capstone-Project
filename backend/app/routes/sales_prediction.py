from fastapi import APIRouter, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List, Dict, Any
import pandas as pd
from datetime import datetime, timedelta
from app.supabase import get_db

router = APIRouter()


async def get_sales_data(session: AsyncSession, days: int = 90):
    since = datetime.utcnow() - timedelta(days=days)
    print(f"[DEBUG] Fetching sales data since: {since}")
    query = text(
        """
        SELECT item_name as item,
               DATE(created_at) as date,
               SUM(quantity) as sales,
               COUNT(*) as order_count
        FROM order_items
        WHERE created_at >= :since
        GROUP BY item_name, DATE(created_at)
        ORDER BY DATE(created_at) DESC, SUM(quantity) DESC
    """
    )
    result = await session.execute(query, {"since": since})
    rows = result.fetchall()
    print(f"[DEBUG] Raw query results: {len(rows)} rows")

    # Enhanced debugging - show all dates found
    dates_found = set()
    for row in rows:
        dates_found.add(row.date.strftime("%Y-%m-%d"))
    print(f"[DEBUG] Unique dates found: {sorted(dates_found)}")

    for row in rows[:10]:  # Print first 10 rows for debugging
        print(
            f"[DEBUG] Row: {row.item}, {row.date}, {row.sales} sales, {row.order_count} orders"
        )

    return [
        {
            "item": row.item,
            "date": row.date.strftime("%Y-%m-%d"),
            "sales": int(row.sales),
        }
        for row in rows
    ]


def generate_simple_chart_data_with_all_dates(
    item_name: str, sales_data: List[dict], timeframe: str, all_labels: List[str]
) -> List[dict]:
    """Generate chart data ensuring all dates are included with 0 for missing dates"""
    print(f"[DEBUG] Generating chart data for {item_name} with timeframe: {timeframe}")

    # Filter data for this specific item
    item_data = [row for row in sales_data if row["item"] == item_name]
    print(f"[DEBUG] Found {len(item_data)} rows for {item_name}")

    if not item_data:
        print(f"[DEBUG] No data for {item_name}, returning zeros for all dates")
        return [{"ds": label, "yhat": 0.0} for label in all_labels]

    df = pd.DataFrame(item_data)
    df["date"] = pd.to_datetime(df["date"])

    # Group by timeframe
    if timeframe == "daily":
        grouped = df.groupby(df["date"].dt.date)["sales"].sum()
        # Create a mapping of dates to their formatted labels
        date_to_label = {}
        for date in grouped.index:
            date_to_label[date.strftime("%b %d")] = float(grouped[date])
        print(f"[DEBUG] Daily grouping for {item_name}: {date_to_label}")
    elif timeframe == "weekly":
        grouped = df.groupby(df["date"].dt.to_period("W"))["sales"].sum()
        date_to_label = {}
        for period in grouped.index:
            label = f"Week of {period.start_time.strftime('%b %d')}"
            date_to_label[label] = float(grouped[period])
    elif timeframe == "monthly":
        grouped = df.groupby(df["date"].dt.to_period("M"))["sales"].sum()
        date_to_label = {}
        for period in grouped.index:
            label = period.strftime("%B %Y")
            date_to_label[label] = float(grouped[period])
    else:
        grouped = df.groupby(df["date"].dt.date)["sales"].sum()
        date_to_label = {}
        for date in grouped.index:
            date_to_label[date.strftime("%b %d")] = float(grouped[date])

    # Create result with 0 for missing dates
    result = []
    for label in all_labels:
        sales_value = date_to_label.get(label, 0.0)
        result.append({"ds": label, "yhat": sales_value})

    print(f"[DEBUG] Final chart data for {item_name}: {result}")
    return result


def generate_simple_chart_data(
    item_name: str, data: List[dict], timeframe: str = "daily"
):
    """Generate simple chart data for historical sales"""
    print(f"[DEBUG] Generating chart data for {item_name}, timeframe: {timeframe}")
    print(f"[DEBUG] Input data for {item_name}: {data}")

    df = pd.DataFrame(data)
    df = df[df["item"] == item_name]
    print(f"[DEBUG] Filtered data for {item_name}: {len(df)} rows")

    if len(df) > 0:
        print(
            f"[DEBUG] Date range for {item_name}: {df['date'].min()} to {df['date'].max()}"
        )

    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date")

    if df.empty:
        print(f"[DEBUG] No data for {item_name} after filtering")
        return []

    # Group by timeframe
    if timeframe == "daily":
        grouped = df.groupby(df["date"].dt.date)["sales"].sum()
        labels = [date.strftime("%b %d") for date in grouped.index]
        print(f"[DEBUG] Daily grouping for {item_name}: {dict(grouped)}")
    elif timeframe == "weekly":
        grouped = df.groupby(df["date"].dt.to_period("W"))["sales"].sum()
        labels = [
            f"Week of {period.start_time.strftime('%b %d')}" for period in grouped.index
        ]
    elif timeframe == "monthly":
        grouped = df.groupby(df["date"].dt.to_period("M"))["sales"].sum()
        labels = [period.strftime("%B %Y") for period in grouped.index]
    else:
        grouped = df.groupby(df["date"].dt.date)["sales"].sum()
        labels = [date.strftime("%b %d") for date in grouped.index]

    result = [
        {
            "ds": label,
            "yhat": float(value),
        }
        for label, value in zip(labels, grouped.values)
    ]

    print(f"[DEBUG] Final chart data for {item_name}: {result}")
    return result


def analyze_historical_data(data: List[dict]) -> Dict[str, Any]:
    """Simple historical data analysis without machine learning"""
    if not data:
        return {"error": "No data available for analysis"}

    df = pd.DataFrame(data)
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date")

    analysis = {
        "overview": {},
        "top_performers": {},
        "trends": {},
        "patterns": {},
        "insights": [],
    }

    # Overall Statistics
    total_sales = df["sales"].sum()
    unique_items = df["item"].nunique()
    date_range = (df["date"].max() - df["date"].min()).days + 1
    avg_daily_sales = total_sales / date_range if date_range > 0 else 0

    analysis["overview"] = {
        "total_sales": int(total_sales),
        "unique_items": int(unique_items),
        "date_range_days": int(date_range),
        "avg_daily_sales": round(float(avg_daily_sales), 2),
        "analysis_period": f"{df['date'].min().strftime('%Y-%m-%d')} to {df['date'].max().strftime('%Y-%m-%d')}",
    }

    # Top Performers Analysis
    item_totals = df.groupby("item")["sales"].agg(["sum", "mean", "count"]).fillna(0)
    item_totals = item_totals.sort_values("sum", ascending=False)

    analysis["top_performers"] = {
        "by_total_sales": [
            {
                "item": item,
                "total_sales": int(row["sum"]),
                "avg_sales": round(float(row["mean"]), 2),
                "frequency": int(row["count"]),
            }
            for item, row in item_totals.head(10).iterrows()
        ]
    }

    # Simple Trend Analysis (without ML)
    trends_data = []
    for item in df["item"].unique():
        item_data = df[df["item"] == item].copy()
        if len(item_data) >= 2:
            # Simple comparison: latest vs earliest sales
            latest_sales = item_data.tail(3)["sales"].mean()  # Average of last 3 days
            earliest_sales = item_data.head(3)[
                "sales"
            ].mean()  # Average of first 3 days

            change_percent = (
                ((latest_sales - earliest_sales) / earliest_sales * 100)
                if earliest_sales > 0
                else 0
            )

            if change_percent > 10:
                trend_direction = "increasing"
            elif change_percent < -10:
                trend_direction = "decreasing"
            else:
                trend_direction = "stable"

            trends_data.append(
                {
                    "item": item,
                    "trend_direction": trend_direction,
                    "change_percent": round(change_percent, 1),
                    "total_sales": int(item_data["sales"].sum()),
                    "latest_avg": round(latest_sales, 2),
                    "earliest_avg": round(earliest_sales, 2),
                }
            )

    analysis["trends"] = {
        "items_with_trends": sorted(
            trends_data, key=lambda x: x["total_sales"], reverse=True
        )
    }

    # Day of Week Patterns
    if len(df) > 0:
        df["day_of_week"] = df["date"].dt.day_name()
        dow_sales = df.groupby("day_of_week")["sales"].sum().to_dict()
        analysis["patterns"] = {"day_of_week": dow_sales}

    # Generate Simple Insights
    insights = []

    # Revenue insights
    if total_sales > 0:
        top_item = item_totals.index[0]
        top_item_contribution = (item_totals.iloc[0]["sum"] / total_sales) * 100
        insights.append(
            f"Top performer '{top_item}' contributes {top_item_contribution:.1f}% of total sales"
        )

    # Trend insights
    increasing_items = [t for t in trends_data if t["trend_direction"] == "increasing"]
    decreasing_items = [t for t in trends_data if t["trend_direction"] == "decreasing"]

    if increasing_items:
        insights.append(f"{len(increasing_items)} items showing growth trends")
    if decreasing_items:
        insights.append(f"{len(decreasing_items)} items showing declining trends")

    # Data quality insights
    if date_range < 7:
        insights.append("Limited historical data - consider collecting more data")
    elif date_range >= 30:
        insights.append("Good historical data range available for analysis")

    analysis["insights"] = insights

    return analysis


@router.get("/predict_top_sales")
async def get_top_sales_historical(
    timeframe: str = Query("daily"),
    top_n: int = Query(3, description="Number of top items to show"),
    session: AsyncSession = Depends(get_db),
):
    """Get historical sales data for top selling items"""
    sales_data = await get_sales_data(session)
    print("[DEBUG] sales_data:", len(sales_data))

    if not sales_data:
        print("[DEBUG] No sales data found in the last 90 days.")
        return []

    df = pd.DataFrame(sales_data)

    # Get top items by total sales
    top_items = (
        df.groupby("item")["sales"]
        .sum()
        .sort_values(ascending=False)
        .head(top_n)
        .index.tolist()
    )

    # Get all unique dates in the dataset to ensure consistent date range
    df["date"] = pd.to_datetime(df["date"])

    if timeframe == "daily":
        all_dates = df["date"].dt.date.unique()
        all_dates = sorted(all_dates)
        all_labels = [date.strftime("%b %d") for date in all_dates]
        print(f"[DEBUG] All dates for daily view: {all_dates}")
    elif timeframe == "weekly":
        all_periods = df["date"].dt.to_period("W").unique()
        all_periods = sorted(all_periods)
        all_labels = [
            f"Week of {period.start_time.strftime('%b %d')}" for period in all_periods
        ]
    elif timeframe == "monthly":
        all_periods = df["date"].dt.to_period("M").unique()
        all_periods = sorted(all_periods)
        all_labels = [period.strftime("%B %Y") for period in all_periods]
    else:
        all_dates = df["date"].dt.date.unique()
        all_dates = sorted(all_dates)
        all_labels = [date.strftime("%b %d") for date in all_dates]

    color_palette = [
        "#F87171",  # Red
        "#50AC1A",  # Green
        "#3B82F6",  # Blue
        "#F59E42",  # Orange
        "#A855F7",  # Purple
        "#FBBF24",  # Yellow
        "#EC4899",  # Pink
        "#10B981",  # Emerald
        "#8B5CF6",  # Violet
        "#F97316",  # Orange-red
    ]

    colors = {
        item: color_palette[i % len(color_palette)] for i, item in enumerate(top_items)
    }

    response = []
    for item in top_items:
        chart_data = generate_simple_chart_data_with_all_dates(
            item, sales_data, timeframe, all_labels
        )
        print(
            f"[DEBUG] {item}: chart_data = {len(chart_data)} points for {len(all_labels)} dates"
        )

        if chart_data:
            item_data = {
                "name": item,
                "sales": [p["yhat"] for p in chart_data],
                "week": all_labels,  # Use consistent date labels for all items
                "color": colors[item],
            }
            print(
                f"[DEBUG] Adding item_data: {item_data['name']} with {len(item_data['sales'])} sales points and {len(item_data['week'])} week labels"
            )
            response.append(item_data)

    print(f"[DEBUG] Final response: {len(response)} items")
    return response


@router.get("/historical_analysis")
async def get_historical_analysis(
    days: int = Query(90, description="Number of days to analyze"),
    session: AsyncSession = Depends(get_db),
):
    """Get simple historical sales analysis"""
    sales_data = await get_sales_data(session, days)

    if not sales_data:
        return {"error": "No sales data found for analysis"}

    analysis = analyze_historical_data(sales_data)

    print(f"[DEBUG] Historical analysis completed for {len(sales_data)} data points")
    return analysis
