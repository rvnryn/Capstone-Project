from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from .routes import sales_prediction
from .routes import sales_report
from .routes import auth_routes
from .routes import dashboard
from .routes import inventory
from .routes import resetpass
from .routes import menu
from .routes import supplier
from .routes import notification
from app.routes.notification import check_inventory_alerts
from .routes import users
from .routes import inventory_settings
from .routes import backup_restore
from .routes import inventory_log
from .routes import userActivity
from .routes import custom_holiday
from .routes import ph_holidays


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://www.cardiacdelights.app",
        "https://cardiacdelights.app",
        "http://localhost:3000",
    ],
    allow_origin_regex=r"https://.*\.cardiacdelights\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter


@app.middleware("http")
async def skip_options_for_limiter(request, call_next):
    if request.method == "OPTIONS":
        return await call_next(request)
    return await call_next(request)


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request, exc):
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Please try again later."},
    )


from slowapi.middleware import SlowAPIMiddleware

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


app.include_router(auth_routes.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(sales_prediction.router, prefix="/api")
app.include_router(sales_report.router, prefix="/api")
app.include_router(inventory.router, prefix="/api")
app.include_router(resetpass.router, prefix="/api")
app.include_router(menu.router, prefix="/api")
app.include_router(supplier.router, prefix="/api")
app.include_router(notification.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(inventory_settings.router, prefix="/api")
app.include_router(backup_restore.router, prefix="/api")
app.include_router(inventory_log.router, prefix="/api")
app.include_router(userActivity.router, prefix="/api")
app.include_router(custom_holiday.router, prefix="/api")
app.include_router(ph_holidays.router)

# Global error handler for debugging deployment issues
from fastapi.responses import PlainTextResponse
from fastapi import status


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Unhandled error: {exc}")
    return PlainTextResponse(
        str(exc), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    )


from app.routes.backup_restore import load_and_schedule
from app.supabase import SessionLocal


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Unhandled error: {exc}")
    return PlainTextResponse(
        str(exc), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    )


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
