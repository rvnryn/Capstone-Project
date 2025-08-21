export const routes = {
  home: "/",
  login: "/",
  ResetPassword: "/resetPassword",
  dashboard: "/Features/Dashboard",
  inventory: "/Features/Inventory",
  master_inventory: "/Features/Inventory/Master_Inventory",
  todays_inventory: "/Features/Inventory/Today_Inventory",
  surplus_inventory: "/Features/Inventory/Surplus_Inventory",
  addInventory: "/Features/Inventory/Master_Inventory/Add_Inventory",
  UpdateInventory: (id: number | string) =>
    `/Features/Inventory/Master_Inventory/Update_Inventory?id=${id}`,
  ViewInventory: (id: number | string) =>
    `/Features/Inventory/Master_Inventory/View_Inventory?id=${id}`,
  UpdateTodayInventory: (id: number | string) =>
    `/Features/Inventory/Today_Inventory/Update_Today_Inventory?id=${id}`,
  ViewTodayInventory: (id: number | string) =>
    `/Features/Inventory/Today_Inventory/View_Today_Inventory?id=${id}`,
  ViewSurplusInventory: (id: number | string) =>
    `/Features/Inventory/Surplus_Inventory/View_Surplus_Inventory?id=${id}`,
  report: "/Features/Report",
  salesReport: "/Features/Report/Report_Sales",
  inventoryReport: "/Features/Report/Report_Inventory",
  userActivityReport: "/Features/Report/Report_UserActivity",
  menu: "/Features/Menu",
  addMenu: "/Features/Menu/Add_Menu",
  UpdateMenu: (id: number | string) => `/Features/Menu/Update_Menu?id=${id}`,
  ViewMenu: (id: number | string) => `/Features/Menu/View_Menu?id=${id}`,
  supplier: "/Features/Supplier",
  addSupplier: "/Features/Supplier/Add_Supplier",
  UpdateSupplier: (id: number | string) =>
    `/Features/Supplier/Update_Supplier?id=${id}`,
  ViewSupplier: (id: number | string) =>
    `/Features/Supplier/View_Supplier?id=${id}`,
  settings: "/Features/Settings",
  user_management_settings: "/Features/Settings/userManagement",
  addUsers: "/Features/Settings/userManagement/Add_Users",
  UpdateUsers: (id: number | string) =>
    `/Features/Settings/userManagement/Update_Users?id=${id}`,
  ViewUsers: (id: number | string) =>
    `/Features/Settings/userManagement/View_Users?id=${id}`,
  notification_settings: "/Features/Settings/notification",
  inventory_settings: "/Features/Settings/inventory",
  backup_restore_settings: "/Features/Settings/backup_restore",
};
