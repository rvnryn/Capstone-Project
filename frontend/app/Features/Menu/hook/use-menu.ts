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
  ingredients?: MenuIngredient[];
}

export interface MenuIngredient {
  menu_id?: number;
  ingredient_id?: number;
  name?: string; // for new/edited ingredients
  ingredient_name?: string; // for compatibility
  quantity?: string;
  is_unavailable?: boolean; // indicates if this ingredient is out of stock
  stock_quantity?: number; // current stock quantity
}

export function useMenuAPI() {
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const { addOfflineAction, getOfflineActions } = useOfflineQueue();
  const isOnline = typeof window !== "undefined" ? navigator.onLine : true;

  // Helper function for online/offline write operations
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

  // Menu endpoints
  const fetchMenu = async (): Promise<MenuItem[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/menu`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error("Failed to fetch menu:", error);
      return []; // Return empty array instead of throwing
    }
  };

  // PATCH menu (JSON, no image)
  const updateMenu = async (
    menu_id: number,
    data: Partial<MenuItem> & { ingredients?: MenuIngredient[] }
  ) => {
    return handleOfflineWriteOperation(
      async () => {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const response = await fetch(`${API_BASE_URL}/api/menu/${menu_id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      },
      {
        action: "update-menu-item",
        endpoint: `${API_BASE_URL}/api/menu/${menu_id}`,
        method: "PATCH",
        payload: data,
      }
    );
  };

  // PATCH menu with image and ingredients (FormData)
  const updateMenuWithImageAndIngredients = async (
    menu_id: number,
    form: FormData
  ) => {
    return handleOfflineWriteOperation(
      async () => {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(
          `${API_BASE_URL}/api/menu/${menu_id}/update-with-image-and-ingredients`,
          {
            method: "PATCH",
            headers,
            body: form, // FormData automatically sets Content-Type
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      },
      {
        action: "update-menu-with-image",
        endpoint: `${API_BASE_URL}/api/menu/${menu_id}/update-with-image-and-ingredients`,
        method: "PATCH",
        payload: form, // Note: FormData will be serialized for queue
      }
    );
  };

  const deleteMenu = async (menu_id: number) => {
    return handleOfflineWriteOperation(
      async () => {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const response = await fetch(`${API_BASE_URL}/api/menu/${menu_id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      },
      {
        action: "delete-menu-item",
        endpoint: `${API_BASE_URL}/api/menu/${menu_id}`,
        method: "DELETE",
        payload: { menu_id },
      }
    );
  };

  // Add menu with image and ingredients (FormData)
  const addMenuWithImageAndIngredients = async (form: FormData) => {
    return handleOfflineWriteOperation(
      async () => {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(
          `${API_BASE_URL}/api/menu/create-with-image-and-ingredients`,
          {
            method: "POST",
            headers,
            body: form, // FormData automatically sets Content-Type
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      },
      {
        action: "add-menu-with-image",
        endpoint: `${API_BASE_URL}/api/menu/create-with-image-and-ingredients`,
        method: "POST",
        payload: form,
      }
    );
  };

  const fetchMenuById = async (menu_id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/menu/${menu_id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error(`Failed to fetch menu item ${menu_id}:`, error);
      throw error;
    }
  };

  const deleteIngredientFromMenu = async (
    menu_id: number,
    ingredient_id: string
  ) => {
    return handleOfflineWriteOperation(
      async () => {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
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

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      },
      {
        action: "delete-menu-ingredient",
        endpoint: `${API_BASE_URL}/api/menu/${menu_id}/ingredient/${ingredient_id}`,
        method: "DELETE",
        payload: { menu_id, ingredient_id },
      }
    );
  };

  const recalculateStockStatus = async () => {
    return handleOfflineWriteOperation(
      async () => {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const response = await fetch(
          `${API_BASE_URL}/api/menu/recalculate-stock-status`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      },
      {
        action: "recalculate-menu-stock",
        endpoint: `${API_BASE_URL}/api/menu/recalculate-stock-status`,
        method: "POST",
        payload: {},
      }
    );
  };

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
