import { useOfflineCRUD } from "@/app/hooks/useOfflineCRUD";

// Menu Management Hook
export function useMenuOffline() {
  return useOfflineCRUD({
    entityName: "menu",
    apiEndpoint: "/api/menu",
    cacheKey: "cached_menu",
  });
}

// Menu Categories Hook
export function useMenuCategories() {
  return useOfflineCRUD({
    entityName: "menu_categories",
    apiEndpoint: "/api/menu/categories",
    cacheKey: "cached_menu_categories",
  });
}
