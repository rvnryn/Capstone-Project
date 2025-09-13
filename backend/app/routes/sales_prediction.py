from fastapi import APIRouter, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List
from prophet import Prophet
import pandas as pd
from datetime import datetime, timedelta
from app.supabase import get_db

router = APIRouter()


async def get_sales_data(session: AsyncSession, days: int = 90):
    since = datetime.utcnow() - timedelta(days=days)
    query = text(
        """
        SELECT item_name as item,
               DATE(created_at) as date,
               SUM(quantity) as sales
        FROM order_items
        WHERE created_at >= :since
        GROUP BY item_name, DATE(created_at)
    """
    )
    result = await session.execute(query, {"since": since})
    rows = result.fetchall()
    return [
        {
            "item": row.item,
            "date": row.date.strftime("%Y-%m-%d"),
            "sales": int(row.sales),
        }
        for row in rows
    ]


def forecast_item_sales(item_name: str, data: List[dict], days_ahead: int = 7):
    df = pd.DataFrame(data)
    df = df[df["item"] == item_name]
    df = df.groupby("date", as_index=False).agg({"sales": "sum"})
    df = df.rename(columns={"date": "ds", "sales": "y"})
    df["ds"] = pd.to_datetime(df["ds"])

    # If insufficient data for forecasting, return current data
    if df.shape[0] < 2:
        if df.shape[0] == 1:
            # Return the single data point we have
            current_data = df.iloc[0]
            return [
                {
                    "ds": current_data["ds"].strftime("%Y-%m-%d"),
                    "yhat": float(current_data["y"]),
                }
            ]
        return []

    model = Prophet(daily_seasonality=True)
    model.fit(df)
    future = model.make_future_dataframe(periods=days_ahead)
    forecast = model.predict(future)
    result = forecast.tail(days_ahead)[["ds", "yhat"]]
    result["ds"] = result["ds"].dt.strftime("%Y-%m-%d")
    return result.to_dict(orient="records")


@router.get("/predict_top_sales")
async def predict_top_sales(
    timeframe: str = Query("weekly"),
    top_n: int = Query(3, description="Number of top items to predict"),
    session: AsyncSession = Depends(get_db),
):
    days_map = {"daily": 1, "weekly": 7, "monthly": 30, "yearly": 365}
    forecast_days = days_map.get(timeframe, 7)

    sales_data = await get_sales_data(session)
    print("[DEBUG] sales_data:", sales_data)
    df = pd.DataFrame(sales_data)
    print("[DEBUG] DataFrame shape:", df.shape)
    if df.empty:
        print("[DEBUG] No sales data found in the last 90 days.")
        return []
    top_items = (
        df.groupby("item")["sales"]
        .sum()
        .sort_values(ascending=False)
        .head(top_n)
        .index.tolist()
    )
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
    print(f"[DEBUG] Color assignments: {colors}")
    response = []
    for item in top_items:
        prediction = forecast_item_sales(item, sales_data, forecast_days)
        print(f"[DEBUG] {item}: prediction = {prediction}")
        if prediction:
            item_data = {
                "name": item,
                "sales": [round(p["yhat"], 2) for p in prediction],
                "week": [p["ds"] for p in prediction],
                "color": colors[item],
            }
            print(f"[DEBUG] Adding item_data: {item_data}")
            response.append(item_data)

    print(f"[DEBUG] Final response: {response}")
    return response
