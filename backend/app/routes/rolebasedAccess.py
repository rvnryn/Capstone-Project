from fastapi import APIRouter, Depends
from app.utils.rbac import require_role

router = APIRouter()

# --- Inventory Management ---
@router.post("/inventory/add")
async def add_inventory(user=Depends(require_role("Owner", "General Manager", "Store Manager"))):
    return {"message": f"{user['user_role']} can add inventory."}

@router.put("/inventory/update")
async def update_inventory(user=Depends(require_role("Owner", "General Manager", "Store Manager"))):
    return {"message": f"{user['user_role']} can update inventory."}

@router.delete("/inventory/remove")
async def remove_inventory(user=Depends(require_role("Owner", "General Manager", "Store Manager"))):
    return {"message": f"{user['user_role']} can remove inventory."}

@router.get("/inventory/view")
async def view_inventory(user=Depends(require_role("Owner", "General Manager", "Store Manager", "Assistant Store Manager"))):
    return {"message": f"{user['user_role']} can view inventory."}

# --- Menu Content ---
@router.post("/menu/add")
async def add_menu(user=Depends(require_role("Owner", "General Manager", "Store Manager"))):
    return {"message": f"{user['user_role']} can add menu."}

@router.put("/menu/update")
async def update_menu(user=Depends(require_role("Owner", "General Manager", "Store Manager"))):
    return {"message": f"{user['user_role']} can update menu."}

@router.delete("/menu/remove")
async def remove_menu(user=Depends(require_role("Owner", "General Manager", "Store Manager"))):
    return {"message": f"{user['user_role']} can remove menu."}

@router.get("/menu/view")
async def view_menu(user=Depends(require_role("Owner", "General Manager", "Store Manager", "Assistant Store Manager"))):
    return {"message": f"{user['user_role']} can view menu."}

# --- Supplier Information ---
@router.get("/supplier/view")
async def view_supplier(user=Depends(require_role("Owner", "General Manager", "Store Manager", "Assistant Store Manager"))):
    return {"message": f"{user['user_role']} can view supplier info."}

@router.post("/supplier/manage")
async def manage_supplier(user=Depends(require_role("Owner", "General Manager", "Store Manager"))):
    return {"message": f"{user['user_role']} can manage supplier info."}

# --- Reports ---
@router.get("/reports/generate")
async def generate_reports(user=Depends(require_role("Owner", "General Manager", "Store Manager", "Assistant Store Manager"))):
    return {"message": f"{user['user_role']} can generate reports."}

@router.get("/reports/sales")
async def sales_reports(user=Depends(require_role("Owner", "General Manager", "Store Manager", "Assistant Store Manager"))):
    return {"message": f"{user['user_role']} can view sales reports."}

@router.get("/reports/user-activity")
async def user_activity_reports(user=Depends(require_role("Owner"))):
    return {"message": f"{user['user_role']} can view user activity reports (Owner only)."}

# --- Settings ---
@router.get("/settings/inventory")
async def inventory_settings(user=Depends(require_role("Owner", "General Manager", "Store Manager", "Assistant Store Manager"))):
    return {"message": f"{user['user_role']} can access inventory settings."}

@router.get("/settings/notification")
async def notification_settings(user=Depends(require_role("Owner", "General Manager", "Store Manager", "Assistant Store Manager"))):
    return {"message": f"{user['user_role']} can access notification settings."}

@router.get("/settings/backup-restore")
async def backup_restore_settings(user=Depends(require_role("Owner"))):
    return {"message": f"{user['user_role']} can access backup and restore settings (Owner only)."}

@router.get("/settings/user-management")
async def user_management_settings(user=Depends(require_role("Owner"))):
    return {"message": f"{user['user_role']} can access user management settings (Owner only)."}

@router.get("/settings/user-account")
async def user_account_settings(user=Depends(require_role("Owner", "General Manager"))):
    return {"message": f"{user['user_role']} can configure user account (Owner, General Manager)."}

# --- Sign Out (all roles) ---
@router.post("/signout")
async def sign_out(user=Depends(require_role("Owner", "General Manager", "Store Manager", "Assistant Store Manager"))):
    return {"message": f"{user['user_role']} signed out."}
