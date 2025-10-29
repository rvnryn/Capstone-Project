from fastapi import APIRouter, Depends, Request
from slowapi.util import get_remote_address
from slowapi import Limiter

limiter = Limiter(key_func=get_remote_address, default_limits=["10/minute"])
from app.utils.rbac import require_role

router = APIRouter()


# --- Inventory Management ---
@limiter.limit("10/minute")
@router.post("/inventory/add")
async def add_inventory(
    request: Request,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
):
    return {"message": f"{user['user_role']} can add inventory."}


@limiter.limit("10/minute")
@router.put("/inventory/update")
async def update_inventory(
    request: Request,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
):
    return {"message": f"{user['user_role']} can update inventory."}


@limiter.limit("10/minute")
@router.delete("/inventory/remove")
async def remove_inventory(
    request: Request,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
):
    return {"message": f"{user['user_role']} can remove inventory."}


@limiter.limit("10/minute")
@router.get("/inventory/view")
async def view_inventory(
    request: Request,
    user=Depends(
        require_role(
            "Owner", "General Manager", "Store Manager", "Assistant Store Manager"
        )
    ),
):
    return {"message": f"{user['user_role']} can view inventory."}


# --- Menu Content ---
@limiter.limit("10/minute")
@router.post("/menu/add")
async def add_menu(
    request: Request,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
):
    return {"message": f"{user['user_role']} can add menu."}


@limiter.limit("10/minute")
@router.put("/menu/update")
async def update_menu(
    request: Request,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
):
    return {"message": f"{user['user_role']} can update menu."}


@limiter.limit("10/minute")
@router.delete("/menu/remove")
async def remove_menu(
    request: Request,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
):
    return {"message": f"{user['user_role']} can remove menu."}


@limiter.limit("10/minute")
@router.get("/menu/view")
async def view_menu(
    request: Request,
    user=Depends(
        require_role(
            "Owner", "General Manager", "Store Manager", "Assistant Store Manager"
        )
    ),
):
    return {"message": f"{user['user_role']} can view menu."}


# --- Supplier Information ---
@limiter.limit("10/minute")
@router.get("/supplier/view")
async def view_supplier(
    request: Request,
    user=Depends(
        require_role(
            "Owner", "General Manager", "Store Manager", "Assistant Store Manager"
        )
    ),
):
    return {"message": f"{user['user_role']} can view supplier info."}


@limiter.limit("10/minute")
@router.post("/supplier/manage")
async def manage_supplier(
    request: Request,
    user=Depends(require_role("Owner", "General Manager", "Store Manager")),
):
    return {"message": f"{user['user_role']} can manage supplier info."}


# --- Reports ---
@limiter.limit("10/minute")
@router.get("/reports/generate")
async def generate_reports(
    request: Request,
    user=Depends(
        require_role(
            "Owner", "General Manager", "Store Manager", "Assistant Store Manager"
        )
    ),
):
    return {"message": f"{user['user_role']} can generate reports."}


@limiter.limit("10/minute")
@router.get("/reports/sales")
async def sales_reports(
    request: Request,
    user=Depends(
        require_role(
            "Owner", "General Manager", "Store Manager", "Assistant Store Manager"
        )
    ),
):
    return {"message": f"{user['user_role']} can view sales reports."}


@limiter.limit("10/minute")
@router.get("/reports/user-activity")
async def user_activity_reports(request: Request, user=Depends(require_role("Owner"))):
    return {
        "message": f"{user['user_role']} can view user activity reports (Owner only)."
    }


# --- Settings ---
@router.get("/settings/inventory")
async def inventory_settings(
    request: Request,
    user=Depends(
        require_role(
            "Owner", "General Manager", "Store Manager", "Assistant Store Manager"
        )
    ),
):
    return {"message": f"{user['user_role']} can access inventory settings."}


@router.get("/settings/notification")
async def notification_settings(
    request: Request,
    user=Depends(
        require_role(
            "Owner", "General Manager", "Store Manager", "Assistant Store Manager"
        )
    ),
):
    return {"message": f"{user['user_role']} can access notification settings."}


@router.get("/settings/backup-restore")
async def backup_restore_settings(
    request: Request, user=Depends(require_role("Owner"))
):
    return {
        "message": f"{user['user_role']} can access backup and restore settings (Owner only)."
    }


@router.get("/settings/user-management")
async def user_management_settings(
    request: Request, user=Depends(require_role("Owner"))
):
    return {
        "message": f"{user['user_role']} can access user management settings (Owner only)."
    }


@router.get("/settings/user-account")
async def user_account_settings(
    request: Request, user=Depends(require_role("Owner", "General Manager"))
):
    return {
        "message": f"{user['user_role']} can configure user account (Owner, General Manager)."
    }


# --- Sign Out (all roles) ---
@router.post("/signout")
async def sign_out(
    request: Request,
    user=Depends(
        require_role(
            "Owner", "General Manager", "Store Manager", "Assistant Store Manager"
        )
    ),
):
    return {"message": f"{user['user_role']} signed out."}
