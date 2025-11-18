try:
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
        aggregate_status,
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
    from .routes.Reports.Inventory import inventory_log, inventory_analytics, inventory_analytics_v2, inventory_snapshot_scheduler
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

    import logging
    import traceback

    logger = logging.getLogger("uvicorn.error")

    @app.middleware("http")
    async def log_exceptions(request, call_next):
        try:
            return await call_next(request)
        except Exception as e:
            logger.error(f"❌ Exception: {e}")
            traceback.print_exc()
            raise

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "https://localhost:3000", "https://www.cardiacdelights.app", "http://www.cardiacdelights.app"],
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
    scheduler.add_job(check_inventory_alerts, "interval", minutes=1)
    scheduler.start()
    print("Scheduler started and job added")

    # Add a global validation error handler for debugging
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        print("Validation error:", exc.errors())
        # Only include serializable error details
        errors = exc.errors()
        # Remove any non-serializable context (e.g., ValueError objects)
        for error in errors:
            if "ctx" in error and "error" in error["ctx"]:
                error["ctx"]["error"] = str(error["ctx"]["error"])
        return JSONResponse(
            status_code=422,
            content={"detail": errors, "body": exc.body},
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
        aggregate_status.router,  # Multi-batch stock status management (MUST be before master_inventory to avoid route conflicts)
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
        inventory_analytics.router,
        inventory_analytics_v2.router,
        inventory_snapshot_scheduler.router,
        userActivity.router,
        custom_holiday.router,
        ph_holidays.router,
        AutomationTransferring.router
    ]
    for router in routers:
        app.include_router(router, prefix="/api")

    @app.on_event("startup")
    async def schedule_backup_jobs():
        """Schedule backup jobs in background to avoid blocking startup"""
        import asyncio
        
        async def run_backup_scheduling():
            print("Starting backup job scheduling in background...")
            try:
                async with SessionLocal() as session:
                    print("Session started for backup scheduling")
                    await load_and_schedule(session)
                print("Backup job scheduling complete")
            except Exception as e:
                import traceback
                print(f"[Backup Scheduling Error] {e}")
                traceback.print_exc()
        
        # Run in background to not block startup
        asyncio.create_task(run_backup_scheduling())
        print("Backup scheduling started in background")

    @app.get("/health")
    async def health_check():
        return {"status": "ok"}

except Exception as e:
    import traceback
    print(f"[Top-level Import/Init Error] {e}")
    traceback.print_exc()
