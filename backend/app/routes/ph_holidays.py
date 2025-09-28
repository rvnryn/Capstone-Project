from fastapi import APIRouter, Query
from datetime import date
import holidays
from typing import List

router = APIRouter(tags=["holidays"])


@router.get("/philippines", response_model=List[dict])
def get_philippines_holidays(year: int = Query(None, description="Year for holidays")):
    """Return official Philippine holidays for a given year (default: current year)"""
    if not year:
        year = date.today().year
    ph_holidays = holidays.country_holidays("PH", years=[year])
    return [
        {"date": str(day), "name": name, "type": "official"}
        for day, name in ph_holidays.items()
    ]
