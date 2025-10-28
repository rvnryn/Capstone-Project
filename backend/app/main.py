from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from .routes.General import notification
from .routes.General.notification import check_inventory_alerts
from fastapi.responses import PlainTextResponse
from fastapi import status

from .routes.Inventory import (
    general_Inventory,
    master_inventory,
    today_inventory,
    surplus_inventory,
    spoilage_inventory,
    AutomationTransferring,
    inventory_settings,
)
from .routes.Dashboard import (
    dashboard, 
    ph_holidays,
    custom_holiday
)

from .routes.Dashboard import (
    dashboard, 
    ph_holidays,
    custom_holiday
)

from .routes.Users import (
    auth_routes, 
    users
)

from .routes.Reports.Sales import(
    sales_prediction,
    sales_report,
    salesCalculation,
    salesimport,
)
from .routes.Reports.Inventory import inventory_log
from .routes.Reports.UserActivity import userActivity

from .routes.backup_restore import (
    backup,
    restore
)
from app.routes.backup_restore.backup import load_and_schedule
from .routes.Menu import menu
from .routes.Supplier import supplier
from app.supabase import SessionLocal
from slowapi.middleware import SlowAPIMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request, exc):
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Please try again later."},
    )


app.add_middleware(SlowAPIMiddleware)
scheduler = BackgroundScheduler()
scheduler.add_job(check_inventory_alerts, "interval", minutes=60)
scheduler.start()
print("Scheduler started and job added")

# Add a global validation error handler for debugging
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print("Validation error:", exc.errors())
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Unhandled error: {exc}")
    return PlainTextResponse(
        str(exc), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    )

# Routers (use a list for cleaner code)
routers = [
    auth_routes.router, 
    dashboard.router, 
    sales_prediction.router, 
    sales_report.router,
    salesCalculation.router, 
    salesimport.router, 
    general_Inventory.router, 
    master_inventory.router,
    today_inventory.router, 
    surplus_inventory.router, 
    spoilage_inventory.router, 
    menu.router,
    supplier.router, 
    notification.router, 
    users.router, 
    inventory_settings.router, 
    restore.router,
    backup.router, 
    inventory_log.router, 
    userActivity.router, 
    custom_holiday.router,
    ph_holidays.router, 
    AutomationTransferring.router
]
for router in routers:
    app.include_router(router, prefix="/api")


@app.on_event("startup")
async def schedule_backup_jobs():
    print("Starting backup job scheduling...")
    async with SessionLocal() as session:
        print("Session started for backup scheduling")
        await load_and_schedule(session)
    print("Backup job scheduling complete")


@app.get("/health")
async def health_check():
    return {"status": "ok"}
