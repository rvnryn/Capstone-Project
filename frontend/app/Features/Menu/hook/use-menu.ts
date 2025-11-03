import { useCallback } from "react";
import { useOfflineAPI, useOffline } from "@/app/context/OfflineContext";
import { toast } from "react-toastify";

export interface MenuItem {
  menu_id: number;
  itemcode: string;
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
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const { offlineReadyFetch } = useOfflineAPI();
  const { queueOfflineAction, getOfflineActions } = useOffline();

  const getToken = useCallback(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  }, []);

  // Fetch all menu items
  const fetchMenu = useCallback(async (): Promise<MenuItem[]> => {
    try {
      const response = await offlineReadyFetch(
        `${API_BASE_URL}/api/menu`,
        { method: "GET", headers: { "Content-Type": "application/json" } },
        "menu-list",
        24
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error: any) {
      console.warn(
        "[fetchMenu] Failed to fetch menu (offline or network error)",
        error
      );
      return [];
    }
  }, [API_BASE_URL, offlineReadyFetch]);

  // Add menu with image and ingredients
  const addMenuWithImageAndIngredients = useCallback(
    async (form: FormData) => {
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      if (navigator.onLine) {
        const response = await fetch(
          `${API_BASE_URL}/api/menu/create-with-image-and-ingredients`,
          { method: "POST", headers, body: form }
        );
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
      } else {
        queueOfflineAction({
          type: "add-menu-with-image",
          endpoint: `${API_BASE_URL}/api/menu/create-with-image-and-ingredients`,
          method: "POST",
          payload: form,
        });
        toast.info("Action saved offline - will sync when online");
        return { message: "Action queued for sync when online" };
      }
    },
    [API_BASE_URL, getToken, queueOfflineAction]
  );

  // Update menu (JSON, no image)
  const updateMenu = useCallback(
    async (
      menu_id: number,
      data: Partial<MenuItem> & { ingredients?: MenuIngredient[] }
    ) => {
      const token = getToken();
      if (navigator.onLine) {
        const response = await fetch(`${API_BASE_URL}/api/menu/${menu_id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(data),
        });
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
      } else {
        queueOfflineAction({
          type: "update-menu-item",
          endpoint: `${API_BASE_URL}/api/menu/${menu_id}`,
          method: "PATCH",
          payload: data,
        });
        toast.info("Action saved offline - will sync when online");
        return { message: "Action queued for sync when online" };
      }
    },
    [API_BASE_URL, getToken, queueOfflineAction]
  );

  // Update menu with image and ingredients
  const updateMenuWithImageAndIngredients = useCallback(
    async (menu_id: number, form: FormData) => {
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      if (navigator.onLine) {
        const response = await fetch(
          `${API_BASE_URL}/api/menu/${menu_id}/update-with-image-and-ingredients`,
          { method: "PATCH", headers, body: form }
        );
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
      } else {
        queueOfflineAction({
          type: "update-menu-with-image",
          endpoint: `${API_BASE_URL}/api/menu/${menu_id}/update-with-image-and-ingredients`,
          method: "PATCH",
          payload: form,
        });
        toast.info("Action saved offline - will sync when online");
        return { message: "Action queued for sync when online" };
      }
    },
    [API_BASE_URL, getToken, queueOfflineAction]
  );

  // Delete menu
  const deleteMenu = useCallback(
    async (menu_id: number) => {
      const token = getToken();
      if (navigator.onLine) {
        const response = await fetch(`${API_BASE_URL}/api/menu/${menu_id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
      } else {
        queueOfflineAction({
          type: "delete-menu-item",
          endpoint: `${API_BASE_URL}/api/menu/${menu_id}`,
          method: "DELETE",
          payload: { menu_id },
        });
        toast.info("Action saved offline - will sync when online");
        return { message: "Action queued for sync when online" };
      }
    },
    [API_BASE_URL, getToken, queueOfflineAction]
  );

  // Fetch menu by ID
  const fetchMenuById = useCallback(
    async (menu_id: number) => {
      try {
        const response = await offlineReadyFetch(
          `${API_BASE_URL}/api/menu/${menu_id}`,
          { method: "GET", headers: { "Content-Type": "application/json" } },
          `menu-item-${menu_id}`,
          24
        );
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
      } catch (error: any) {
        console.error(`Failed to fetch menu item ${menu_id}:`, error);
        throw error;
      }
    },
    [API_BASE_URL, offlineReadyFetch]
  );

  // Delete ingredient from menu
  const deleteIngredientFromMenu = useCallback(
    async (menu_id: number, ingredient_id: string) => {
      const token = getToken();
      if (navigator.onLine) {
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
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
      } else {
        queueOfflineAction({
          type: "delete-menu-ingredient",
          endpoint: `${API_BASE_URL}/api/menu/${menu_id}/ingredient/${ingredient_id}`,
          method: "DELETE",
          payload: { menu_id, ingredient_id },
        });
        toast.info("Action saved offline - will sync when online");
        return { message: "Action queued for sync when online" };
      }
    },
    [API_BASE_URL, getToken, queueOfflineAction]
  );

  // Recalculate stock status
  const recalculateStockStatus = useCallback(async () => {
    const token = getToken();
    if (navigator.onLine) {
      const response = await fetch(`${API_BASE_URL}/api/menu/recalc`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } else {
      queueOfflineAction({
        type: "recalculate-menu-stock",
        endpoint: `${API_BASE_URL}/api/menu/recalc`,
        method: "POST",
        payload: {},
      });
      toast.info("Action saved offline - will sync when online");
      return { message: "Action queued for sync when online" };
    }
  }, [API_BASE_URL, getToken, queueOfflineAction]);

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
