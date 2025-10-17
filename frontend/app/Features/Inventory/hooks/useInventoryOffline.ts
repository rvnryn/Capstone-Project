import { useOfflineCRUD } from "@/app/hooks/useOfflineCRUD";

// Master Inventory Hook
export function useMasterInventory() {
  return useOfflineCRUD({
    entityName: "master_inventory",
    apiEndpoint: "/api/inventory/master",
    cacheKey: "cached_master_inventory",
  });
}

// Today's Inventory Hook
export function useTodayInventory() {
  return useOfflineCRUD({
    entityName: "today_inventory",
    apiEndpoint: "/api/inventory/today",
    cacheKey: "cached_today_inventory",
  });
}

// Surplus Inventory Hook
export function useSurplusInventory() {
  return useOfflineCRUD({
    entityName: "surplus_inventory",
    apiEndpoint: "/api/inventory/surplus",
    cacheKey: "cached_surplus_inventory",
  });
}

// Spoilage Inventory Hook
export function useSpoilageInventory() {
  return useOfflineCRUD({
    entityName: "spoilage_inventory",
    apiEndpoint: "/api/inventory/spoilage",
    cacheKey: "cached_spoilage_inventory",
  });
}

// Inventory Settings Hook
export function useInventorySettings() {
  return useOfflineCRUD({
    entityName: "inventory_settings",
    apiEndpoint: "/api/settings/inventory",
    cacheKey: "cached_inventory_settings",
  });
}
