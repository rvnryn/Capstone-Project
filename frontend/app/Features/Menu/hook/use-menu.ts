import { useOfflineQueue } from "@/app/hooks/usePWA";
import { useCallback } from "react";
import { toast } from "react-toastify";

export interface MenuItem {
  menu_id: number;
  dish_name: string;
  image_url: string;
  category: string;
  price: number;
  description?: string;
  stock_status?: string;
  created_at?: string;
  updated_at?: string;
  ingredients?: MenuIngredient[];
}

export interface MenuIngredient {
  menu_id?: number;
  ingredient_id?: number;
  name?: string;
  ingredient_name?: string;
  quantity?: string;
  is_unavailable?: boolean;
  stock_quantity?: number;
}

export function useMenuAPI() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const { addOfflineAction, getOfflineActions } = useOfflineQueue();
  const isOnline = typeof window !== "undefined" ? navigator.onLine : true;

  // Helper for online/offline write operations
  const handleOfflineWriteOperation = useCallback(
    async (
      onlineOperation: () => Promise<any>,
      offlineAction: {
        action: string;
        endpoint: string;
        method: string;
        payload: any;
      }
    ) => {
      if (isOnline) {
        try {
          return await onlineOperation();
        } catch (error) {
          addOfflineAction(offlineAction.action, {
            endpoint: offlineAction.endpoint,
            method: offlineAction.method,
            payload: offlineAction.payload,
          });
          toast.info("Request queued for when connection is restored");
          throw error;
        }
      } else {
        addOfflineAction(offlineAction.action, {
          endpoint: offlineAction.endpoint,
          method: offlineAction.method,
          payload: offlineAction.payload,
        });
        toast.info("Action saved offline - will sync when online");
        return { message: "Action queued for sync when online" };
      }
    },
    [isOnline, addOfflineAction]
  );

  const getToken = useCallback(() => {
    return typeof window !== "undefined" ? localStorage.getItem("token") : null;
  }, []);

  // Fetch all menu items
  const fetchMenu = useCallback(async (): Promise<MenuItem[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/menu`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error: any) {
      console.error("Failed to fetch menu:", error);
      return [];
    }
  }, [API_BASE_URL]);

  // Add menu with image and ingredients
  const addMenuWithImageAndIngredients = useCallback(
    async (form: FormData) => {
      return handleOfflineWriteOperation(
        async () => {
          const token = getToken();
          const headers: Record<string, string> = {};
          if (token) headers["Authorization"] = `Bearer ${token}`;
          const response = await fetch(
            `${API_BASE_URL}/api/menu/create-with-image-and-ingredients`,
            { method: "POST", headers, body: form }
          );
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          return await response.json();
        },
        {
          action: "add-menu-with-image",
          endpoint: `${API_BASE_URL}/api/menu/create-with-image-and-ingredients`,
          method: "POST",
          payload: form,
        }
      );
    },
    [API_BASE_URL, getToken, handleOfflineWriteOperation]
  );

  // Update menu (JSON, no image)
  const updateMenu = useCallback(
    async (menu_id: number, data: Partial<MenuItem> & { ingredients?: MenuIngredient[] }) => {
      return handleOfflineWriteOperation(
        async () => {
          const token = getToken();
          const response = await fetch(`${API_BASE_URL}/api/menu/${menu_id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify(data),
          });
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          return await response.json();
        },
        {
          action: "update-menu-item",
          endpoint: `${API_BASE_URL}/api/menu/${menu_id}`,
          method: "PATCH",
          payload: data,
        }
      );
    },
    [API_BASE_URL, getToken, handleOfflineWriteOperation]
  );

  // Update menu with image and ingredients
  const updateMenuWithImageAndIngredients = useCallback(
    async (menu_id: number, form: FormData) => {
      return handleOfflineWriteOperation(
        async () => {
          const token = getToken();
          const headers: Record<string, string> = {};
          if (token) headers["Authorization"] = `Bearer ${token}`;
          const response = await fetch(
            `${API_BASE_URL}/api/menu/${menu_id}/update-with-image-and-ingredients`,
            { method: "PATCH", headers, body: form }
          );
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          return await response.json();
        },
        {
          action: "update-menu-with-image",
          endpoint: `${API_BASE_URL}/api/menu/${menu_id}/update-with-image-and-ingredients`,
          method: "PATCH",
          payload: form,
        }
      );
    },
    [API_BASE_URL, getToken, handleOfflineWriteOperation]
  );

  // Delete menu
  const deleteMenu = useCallback(
    async (menu_id: number) => {
      return handleOfflineWriteOperation(
        async () => {
          const token = getToken();
          const response = await fetch(`${API_BASE_URL}/api/menu/${menu_id}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          });
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          return await response.json();
        },
        {
          action: "delete-menu-item",
          endpoint: `${API_BASE_URL}/api/menu/${menu_id}`,
          method: "DELETE",
          payload: { menu_id },
        }
      );
    },
    [API_BASE_URL, getToken, handleOfflineWriteOperation]
  );

  // Fetch menu by ID
  const fetchMenuById = useCallback(
    async (menu_id: number) => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/menu/${menu_id}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
      } catch (error: any) {
        console.error(`Failed to fetch menu item ${menu_id}:`, error);
        throw error;
      }
    },
    [API_BASE_URL]
  );

  // Delete ingredient from menu
  const deleteIngredientFromMenu = useCallback(
    async (menu_id: number, ingredient_id: string) => {
      return handleOfflineWriteOperation(
        async () => {
          const token = getToken();
          const response = await fetch(
            `${API_BASE_URL}/api/menu/${menu_id}/ingredient/${ingredient_id}`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
              },
            }
          );
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          return await response.json();
        },
        {
          action: "delete-menu-ingredient",
          endpoint: `${API_BASE_URL}/api/menu/${menu_id}/ingredient/${ingredient_id}`,
          method: "DELETE",
          payload: { menu_id, ingredient_id },
        }
      );
    },
    [API_BASE_URL, getToken, handleOfflineWriteOperation]
  );

  // Recalculate stock status
  const recalculateStockStatus = useCallback(
    async () => {
      return handleOfflineWriteOperation(
        async () => {
          const token = getToken();
          const response = await fetch(
            `${API_BASE_URL}/api/menu/recalc`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
              },
            }
          );
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          return await response.json();
        },
        {
          action: "recalculate-menu-stock",
          endpoint: `${API_BASE_URL}/api/menu/recalc`,
          method: "POST",
          payload: {},
        }
      );
    },
    [API_BASE_URL, getToken, handleOfflineWriteOperation]
  );

  return {
    fetchMenu,
    addMenuWithImageAndIngredients,
    updateMenu,
    updateMenuWithImageAndIngredients,
    fetchMenuById,
    recalculateStockStatus,
    deleteMenu,
    deleteIngredientFromMenu,
    getOfflineActions,
  };
}