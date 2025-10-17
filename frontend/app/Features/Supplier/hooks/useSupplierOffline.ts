import { useOfflineCRUD } from "@/app/hooks/useOfflineCRUD";

// Supplier Management Hook
export function useSupplierOffline() {
  return useOfflineCRUD({
    entityName: "suppliers",
    apiEndpoint: "/api/suppliers",
    cacheKey: "cached_suppliers",
  });
}
