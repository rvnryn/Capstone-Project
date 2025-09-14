import axiosInstance from "@/app/lib/axios";
import { offlineAxiosRequest } from "@/app/utils/offlineAxios";
import { useOfflineQueue } from "@/app/hooks/usePWA";
import { useCallback } from "react";
import { toast } from "react-toastify";

export interface InventoryItem {
  item_id: string | number;
  item_name: string;
  category: string;
  stock_quantity: number;
  stock_status: "Out Of Stock" | "Critical" | "Low" | "Normal";
  batch_date: string;
  expiration_date: string | null;
  created_at: string;
  updated_at: string;
  // frontend-friendly aliases
  id?: string;
  name: string;
  stock: number;
  status: "Out Of Stock" | "Critical" | "Low" | "Normal";
  batch?: string;
  added?: string;
  updated?: string;
}

export type AddInventoryPayload = {
  item_name: string;
  category: string;
  stock_quantity: number;
  stock_status: "Out Of Stock" | "Critical" | "Low" | "Normal";
  batch_date: string;
  expiration_date: string | null;
};

export type UpdateInventoryPayload = Partial<AddInventoryPayload>;

export function useInventoryAPI() {
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
  // INVENTORY
  const getItem = useCallback(async (id: string) => {
    try {
      const response = await offlineAxiosRequest(
        {
          method: "GET",
          url: `/api/inventory/${id}`,
        },
        {
          cacheKey: `inventory-item-${id}`,
          cacheHours: 2,
          showErrorToast: true,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error(`Failed to fetch inventory item ${id}:`, error);
      throw error;
    }
  }, []);

  const addItem = useCallback(
    async (item: AddInventoryPayload) => {
      return handleOfflineWriteOperation(
        () =>
          offlineAxiosRequest(
            {
              method: "POST",
              url: "/api/inventory",
              data: item,
            },
            {
              showErrorToast: true,
            }
          ),
        {
          action: "add-inventory-item",
          endpoint: "/api/inventory",
          method: "POST",
          payload: item,
        }
      );
    },
    [handleOfflineWriteOperation]
  );

  const updateItem = useCallback(
    async (id: string | number, item: UpdateInventoryPayload) => {
      const cleanedItem = {
        ...item,
        expiration_date:
          item.expiration_date && item.expiration_date.trim() !== ""
            ? item.expiration_date
            : null,
      };

      return handleOfflineWriteOperation(
        () =>
          offlineAxiosRequest(
            {
              method: "PUT",
              url: `/api/inventory/${id}`,
              data: cleanedItem,
            },
            {
              showErrorToast: true,
            }
          ),
        {
          action: "update-inventory-item",
          endpoint: `/api/inventory/${id}`,
          method: "PUT",
          payload: cleanedItem,
        }
      );
    },
    [handleOfflineWriteOperation]
  );

  const deleteItem = useCallback(
    async (id: string | number) => {
      return handleOfflineWriteOperation(
        () =>
          offlineAxiosRequest(
            {
              method: "DELETE",
              url: `/api/inventory/${id}`,
            },
            {
              showErrorToast: true,
            }
          ),
        {
          action: "delete-inventory-item",
          endpoint: `/api/inventory/${id}`,
          method: "DELETE",
          payload: { id },
        }
      );
    },
    [handleOfflineWriteOperation]
  );

  const listItems = useCallback(async () => {
    try {
      const response = await offlineAxiosRequest<InventoryItem[]>(
        {
          method: "GET",
          url: "/api/inventory",
        },
        {
          cacheKey: "inventory-list",
          cacheHours: 2,
          showErrorToast: true,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error(
        "Inventory API list error:",
        error.response?.data || error.message
      );
      throw error;
    }
  }, []);

  // INVENTORY TODAY
  const getTodayItem = useCallback(async (id: string) => {
    const response = await offlineAxiosRequest<InventoryItem>(
      {
        method: "GET",
        url: `/api/inventory-today/${id}`,
      },
      {
        cacheKey: `inventory-today-item-${id}`,
        cacheHours: 2,
        showErrorToast: true,
      }
    );
    return response.data;
  }, []);

  const addTodayItem = useCallback(
    async (item: AddInventoryPayload) => {
      return handleOfflineWriteOperation(
        () =>
          offlineAxiosRequest(
            {
              method: "POST",
              url: "/api/inventory-today",
              data: item,
            },
            {
              showErrorToast: true,
            }
          ),
        {
          action: "add-today-inventory-item",
          endpoint: "/api/inventory-today",
          method: "POST",
          payload: item,
        }
      );
    },
    [handleOfflineWriteOperation]
  );

  const updateTodayItem = useCallback(
    async (id: string | number, item: UpdateInventoryPayload) => {
      const cleanedItem = {
        ...item,
        expiration_date:
          item.expiration_date && item.expiration_date.trim() !== ""
            ? item.expiration_date
            : null,
      };

      return handleOfflineWriteOperation(
        () =>
          offlineAxiosRequest(
            {
              method: "PUT",
              url: `/api/inventory-today/${id}`,
              data: cleanedItem,
            },
            {
              showErrorToast: true,
            }
          ),
        {
          action: "update-today-inventory-item",
          endpoint: `/api/inventory-today/${id}`,
          method: "PUT",
          payload: cleanedItem,
        }
      );
    },
    [handleOfflineWriteOperation]
  );

  const deleteTodayItem = useCallback(
    async (id: string | number) => {
      return handleOfflineWriteOperation(
        () =>
          offlineAxiosRequest(
            {
              method: "DELETE",
              url: `/api/inventory-today/${id}`,
            },
            {
              showErrorToast: true,
            }
          ),
        {
          action: "delete-today-inventory-item",
          endpoint: `/api/inventory-today/${id}`,
          method: "DELETE",
          payload: { id },
        }
      );
    },
    [handleOfflineWriteOperation]
  );

  const listTodayItems = useCallback(async () => {
    try {
      const response = await offlineAxiosRequest<InventoryItem[]>(
        {
          method: "GET",
          url: "/api/inventory-today",
        },
        {
          cacheKey: "inventory-today-list",
          cacheHours: 2,
          showErrorToast: true,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error(
        "Inventory Today API list error:",
        error.response?.data || error.message
      );
      throw error;
    }
  }, []);

  // INVENTORY SURPLUS
  const getSurplusItem = useCallback(async (id: string | number) => {
    const response = await offlineAxiosRequest<InventoryItem>(
      {
        method: "GET",
        url: `/api/inventory-surplus/${id}`,
      },
      {
        cacheKey: `inventory-surplus-item-${id}`,
        cacheHours: 2,
        showErrorToast: true,
      }
    );
    return response.data;
  }, []);

  const addSurplusItem = useCallback(
    async (item: AddInventoryPayload) => {
      return handleOfflineWriteOperation(
        () =>
          offlineAxiosRequest(
            {
              method: "POST",
              url: "/api/inventory-surplus",
              data: item,
            },
            {
              showErrorToast: true,
            }
          ),
        {
          action: "add-surplus-inventory-item",
          endpoint: "/api/inventory-surplus",
          method: "POST",
          payload: item,
        }
      );
    },
    [handleOfflineWriteOperation]
  );

  const updateSurplusItem = useCallback(
    async (
      id: string | number,
      item: UpdateInventoryPayload,
      token: string
    ) => {
      const cleanedItem = {
        ...item,
        expiration_date:
          item.expiration_date && item.expiration_date.trim() !== ""
            ? item.expiration_date
            : null,
      };

      return handleOfflineWriteOperation(
        () =>
          offlineAxiosRequest(
            {
              method: "PUT",
              url: `/api/inventory-surplus/${id}`,
              data: cleanedItem,
            },
            {
              showErrorToast: true,
            }
          ),
        {
          action: "update-surplus-inventory-item",
          endpoint: `/api/inventory-surplus/${id}`,
          method: "PUT",
          payload: cleanedItem,
        }
      );
    },
    [handleOfflineWriteOperation]
  );

  const deleteSurplusItem = useCallback(
    async (id: string | number) => {
      return handleOfflineWriteOperation(
        () =>
          offlineAxiosRequest(
            {
              method: "DELETE",
              url: `/api/inventory-surplus/${id}`,
            },
            {
              showErrorToast: true,
            }
          ),
        {
          action: "delete-surplus-inventory-item",
          endpoint: `/api/inventory-surplus/${id}`,
          method: "DELETE",
          payload: { id },
        }
      );
    },
    [handleOfflineWriteOperation]
  );

  const listSurplusItems = useCallback(async () => {
    try {
      const response = await offlineAxiosRequest<InventoryItem[]>(
        {
          method: "GET",
          url: "/api/inventory-surplus",
        },
        {
          cacheKey: "inventory-surplus-list",
          cacheHours: 2,
          showErrorToast: true,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error(
        "Inventory Surplus API list error:",
        error.response?.data || error.message
      );
      throw error;
    }
  }, []);

  // TRANSFER ENDPOINTS

  const transferToToday = useCallback(
    async (id: string | number, quantity: number) => {
      return handleOfflineWriteOperation(
        () =>
          offlineAxiosRequest(
            {
              method: "POST",
              url: `/api/inventory/${id}/transfer-to-today`,
              data: { quantity },
            },
            {
              showErrorToast: true,
            }
          ),
        {
          action: "transfer-to-today",
          endpoint: `/api/inventory/${id}/transfer-to-today`,
          method: "POST",
          payload: { id, quantity },
        }
      );
    },
    [handleOfflineWriteOperation]
  );

  const transferToSurplus = useCallback(
    async (id: string | number, quantity: number) => {
      return handleOfflineWriteOperation(
        () =>
          offlineAxiosRequest(
            {
              method: "POST",
              url: `/api/inventory-today/${id}/transfer-to-surplus`,
              data: { quantity },
            },
            {
              showErrorToast: true,
            }
          ),
        {
          action: "transfer-to-surplus",
          endpoint: `/api/inventory-today/${id}/transfer-to-surplus`,
          method: "POST",
          payload: { id, quantity },
        }
      );
    },
    [handleOfflineWriteOperation]
  );

  const transferSurplusToToday = useCallback(
    async (id: string | number, quantity: number) => {
      try {
        const response = await offlineAxiosRequest(
          {
            method: "POST",
            url: `/api/inventory-surplus/${id}/transfer-to-today`,
            data: { quantity },
          },
          {
            showErrorToast: true,
          }
        );
        return response.data;
      } catch (error: any) {
        console.error(
          "transferSurplusToToday API error:",
          error.response?.data || error.message
        );
        throw error;
      }
    },
    []
  );

  return {
    getItem,
    addItem,
    updateItem,
    deleteItem,
    listItems,

    getTodayItem,
    addTodayItem,
    updateTodayItem,
    deleteTodayItem,
    listTodayItems,

    getSurplusItem,
    addSurplusItem,
    updateSurplusItem,
    deleteSurplusItem,
    listSurplusItems,

    transferToToday,
    transferToSurplus,
    transferSurplusToToday,
  };
}
