from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from .routes import sales_prediction
from .routes import auth_routes
from .routes import dashboard
from .routes import inventory
from .routes import report
from .routes import resetpass 
from .routes import menu
from .routes import supplier
from .routes import notification
from app.routes.notification import check_inventory_alerts
from .routes import users
from .routes import inventory_settings
from .routes import backup_restore
from .routes import inventory_log

scheduler = BackgroundScheduler()
scheduler.add_job(check_inventory_alerts, "interval", seconds=1)
scheduler.start()
print("Scheduler started and job added")

app = FastAPI()

# Add a global validation error handler for debugging
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print("Validation error:", exc.errors())
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )

# CORS middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

# Include the auth routes (including the /login endpoint)
app.include_router(auth_routes.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(sales_prediction.router, prefix="/api")
app.include_router(inventory.router, prefix="/api")
app.include_router(report.router, prefix="/api")
app.include_router(resetpass.router, prefix="/api")
app.include_router(menu.router, prefix="/api")
app.include_router(supplier.router, prefix="/api")
app.include_router(notification.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(inventory_settings.router, prefix="/api")
app.include_router(backup_restore.router, prefix="/api")
app.include_router(inventory_log.router, prefix="/api")

# Optional: A simple health check route (you can remove or modify this)
@app.get("/health")
async def health_check():
    return {"status": "ok"}
