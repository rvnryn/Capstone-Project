import axiosInstance from "@/app/lib/axios";
import { offlineAxiosRequest } from "@/app/utils/offlineAxios";
import { useOfflineQueue } from "@/app/hooks/usePWA";
import { useCallback } from "react";
import { toast } from "react-toastify";

export interface MenuItem {
  menu_id: number;
  dish_name: string;
  image_url: string;
  category: string;
  price: number;
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
  // Get offline queue functions
  const { addOfflineAction, isOnline } = useOfflineQueue();

  // Helper function to handle offline write operations
  const handleOfflineWriteOperation = useCallback(
    async (
      operation: () => Promise<any>,
      offlineAction: {
        action: string;
        endpoint: string;
        method: string;
        payload: any;
      }
    ) => {
      if (isOnline) {
        // Online: Execute the operation immediately
        return await operation();
      } else {
        // Offline: Queue the action and show user feedback
        addOfflineAction(offlineAction.action, {
          endpoint: offlineAction.endpoint,
          method: offlineAction.method,
          payload: offlineAction.payload,
        });
        toast.info("📱 Action queued for when you're back online!", {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        });
        // Return a mock response to keep UI working
        return { success: true, queued: true };
      }
    },
    [isOnline, addOfflineAction]
  );
  // Menu endpoints
  const fetchMenu = async (): Promise<MenuItem[]> => {
    try {
      const response = await offlineAxiosRequest(
        {
          method: "GET",
          url: "/api/menu",
        },
        {
          cacheKey: "menu-list",
          cacheHours: 12, // Menu items change less frequently
          showErrorToast: true,
          fallbackData: [], // Return empty array as fallback
        }
      );
      return response.data;
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
      () =>
        offlineAxiosRequest(
          {
            method: "PATCH",
            url: `/api/menu/${menu_id}`,
            data,
          },
          {
            showErrorToast: true,
          }
        ),
      {
        action: "update-menu-item",
        endpoint: `/api/menu/${menu_id}`,
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
      () =>
        offlineAxiosRequest(
          {
            method: "PATCH",
            url: `/api/menu/${menu_id}/update-with-image-and-ingredients`,
            data: form,
            headers: { "Content-Type": "multipart/form-data" },
          },
          {
            showErrorToast: true,
          }
        ),
      {
        action: "update-menu-with-image",
        endpoint: `/api/menu/${menu_id}/update-with-image-and-ingredients`,
        method: "PATCH",
        payload: form, // Note: FormData will be serialized for queue
      }
    );
  };

  const deleteMenu = async (menu_id: number) => {
    return handleOfflineWriteOperation(
      () =>
        offlineAxiosRequest(
          {
            method: "DELETE",
            url: `/api/menu/${menu_id}`,
          },
          {
            showErrorToast: true,
          }
        ),
      {
        action: "delete-menu-item",
        endpoint: `/api/menu/${menu_id}`,
        method: "DELETE",
        payload: { menu_id },
      }
    );
  };

  // Add menu with image and ingredients (FormData)
  const addMenuWithImageAndIngredients = async (form: FormData) => {
    return handleOfflineWriteOperation(
      () =>
        offlineAxiosRequest(
          {
            method: "POST",
            url: "/api/menu/create-with-image-and-ingredients",
            data: form,
            headers: { "Content-Type": "multipart/form-data" },
          },
          {
            showErrorToast: true,
          }
        ),
      {
        action: "add-menu-with-image",
        endpoint: "/api/menu/create-with-image-and-ingredients",
        method: "POST",
        payload: form,
      }
    );
  };

  const fetchMenuById = async (menu_id: number) => {
    const res = await offlineAxiosRequest(
      {
        method: "GET",
        url: `/api/menu/${menu_id}`,
      },
      {
        cacheKey: `menu-item-${menu_id}`,
        cacheHours: 12,
        showErrorToast: true,
      }
    );
    return res.data;
  };

  const deleteIngredientFromMenu = async (
    menu_id: number,
    ingredient_id: string
  ) => {
    return handleOfflineWriteOperation(
      () =>
        offlineAxiosRequest(
          {
            method: "DELETE",
            url: `/api/menu/${menu_id}/ingredient/${ingredient_id}`,
          },
          {
            showErrorToast: true,
          }
        ),
      {
        action: "delete-menu-ingredient",
        endpoint: `/api/menu/${menu_id}/ingredient/${ingredient_id}`,
        method: "DELETE",
        payload: { menu_id, ingredient_id },
      }
    );
  };

  const recalculateStockStatus = async () => {
    return handleOfflineWriteOperation(
      () =>
        offlineAxiosRequest(
          {
            method: "POST",
            url: "/api/menu/recalculate-stock-status",
          },
          {
            showErrorToast: true,
          }
        ),
      {
        action: "recalculate-menu-stock",
        endpoint: "/api/menu/recalculate-stock-status",
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
  };
}
