from fastapi import APIRouter, Query
from typing import List
from prophet import Prophet
import pandas as pd

router = APIRouter()

# Example static sales data (replace with DB query in production)
sample_data = [
    {"item": "Burger", "date": "2025-06-01", "sales": 30},
    {"item": "Burger", "date": "2025-06-02", "sales": 45},
    {"item": "Burger", "date": "2025-06-03", "sales": 50},
    {"item": "Burger", "date": "2025-06-04", "sales": 35},
    {"item": "Burger", "date": "2025-06-05", "sales": 60},
    {"item": "Burger", "date": "2025-06-06", "sales": 70},
    {"item": "Burger", "date": "2025-06-07", "sales": 55},
    {"item": "Pizza", "date": "2025-06-01", "sales": 100},
    {"item": "Pizza", "date": "2025-07-02", "sales": 200},
]

def forecast_item_sales(item_name: str, data: List[dict], days_ahead: int = 7):
    df = pd.DataFrame(data)
    
    # Filter rows for this item
    df = df[df["item"] == item_name]
    
    # Group by date in case of duplicate rows
    df = df.groupby("date", as_index=False).agg({"sales": "sum"})
    
    # Prepare for Prophet
    df = df.rename(columns={"date": "ds", "sales": "y"})
    df["ds"] = pd.to_datetime(df["ds"])
    
    if df.shape[0] < 2:
        # Not enough data for forecasting
        return []
    
    model = Prophet(daily_seasonality=True)
    model.fit(df)
    
    future = model.make_future_dataframe(periods=days_ahead)
    forecast = model.predict(future)
    
    result = forecast.tail(days_ahead)[["ds", "yhat"]]
    result["ds"] = result["ds"].dt.strftime("%Y-%m-%d")
    return result.to_dict(orient="records")

@router.get("/predict_top_sales")
async def predict_top_sales(timeframe: str = Query("weekly")):
    days_map = {
        "daily": 1,
        "weekly": 7,
        "monthly": 30,
        "yearly": 365
    }
    forecast_days = days_map.get(timeframe, 7)
    
    items = ["Burger", "Pizza"]
    colors = {
        "Burger": "#F87171",
        "Pizza": "#50AC1A"
    }
    
    response = []
    
    for item in items:
        prediction = forecast_item_sales(item, sample_data, forecast_days)
        
        if prediction:
            response.append({
                "name": item,
                "sales": [round(p["yhat"], 2) for p in prediction],
                "week": [p["ds"] for p in prediction],
                "color": colors[item]
            })
    
    return response
