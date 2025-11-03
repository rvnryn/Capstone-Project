"use client";
import { useCallback } from "react";
import { useOfflineAPI, useOffline } from "@/app/context/OfflineContext";
import { toast } from "react-toastify";

// Utility to handle offline write operations
function handleOfflineWriteOperation<T>(
  onlineOperation: () => Promise<T>,
  offlineAction: {
    action: string;
    endpoint: string;
    method: string;
    payload: any;
  }
): Promise<T | { message: string }> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (navigator.onLine) {
    return onlineOperation();
  } else {
    // Use queueOfflineAction from context if available
    if (typeof window !== "undefined") {
      const offlineContext = (window as any).offlineContext;
      if (offlineContext && offlineContext.queueOfflineAction) {
        offlineContext.queueOfflineAction({
          type: offlineAction.action,
          endpoint: offlineAction.endpoint,
          method: offlineAction.method,
          payload: offlineAction.payload,
        });
      }
    }
    toast.info("Action saved offline - will sync when online");
    return Promise.resolve({ message: "Action queued for sync when online" });
  }
}

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
  unit_price?: number;
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
  unit_price?: number;
};

export interface SpoilageItem {
  spoilage_id: string | number;
  item_id: string | number;
  item_name: string;
  quantity_spoiled: number;
  spoilage_date: string;
  reason?: string | null;
  user_id?: string | number | null;
  created_at: string;
  updated_at: string;
  unit_price?: number;
}

export type UpdateInventoryPayload = Partial<AddInventoryPayload>;

export function useInventoryAPI() {
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const { offlineReadyFetch } = useOfflineAPI();
  const { queueOfflineAction, getOfflineActions } = useOffline();
  // INVENTORY
  const getItem = useCallback(
    async (id: string) => {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const response = await offlineReadyFetch(
          `${API_BASE_URL}/api/inventory/${id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          },
          `inventory-item-${id}`,
          24
        );
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
      } catch (error: any) {
        console.error(`Failed to fetch inventory item ${id}:`, error);
        throw error;
      }
    },
    [API_BASE_URL, offlineReadyFetch]
  );

  const addItem = useCallback(
    async (item: AddInventoryPayload) => {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (navigator.onLine) {
        const response = await fetch(`${API_BASE_URL}/api/inventory`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(item),
        });
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
      } else {
        queueOfflineAction({
          type: "add-inventory-item",
          endpoint: `${API_BASE_URL}/api/inventory`,
          method: "POST",
          payload: item,
        });
        toast.info("Action saved offline - will sync when online");
        return { message: "Action queued for sync when online" };
      }
    },
    [API_BASE_URL, queueOfflineAction]
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
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (navigator.onLine) {
        const response = await fetch(`${API_BASE_URL}/api/inventory/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(cleanedItem),
        });
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
      } else {
        queueOfflineAction({
          type: "update-inventory-item",
          endpoint: `${API_BASE_URL}/api/inventory/${id}`,
          method: "PUT",
          payload: cleanedItem,
        });
        toast.info("Action saved offline - will sync when online");
        return { message: "Action queued for sync when online" };
      }
    },
    [API_BASE_URL, queueOfflineAction]
  );

  const deleteItem = useCallback(
    async (id: string | number) => {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (navigator.onLine) {
        const response = await fetch(`${API_BASE_URL}/api/inventory/${id}`, {
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
          type: "delete-inventory-item",
          endpoint: `${API_BASE_URL}/api/inventory/${id}`,
          method: "DELETE",
          payload: { id },
        });
        toast.info("Action saved offline - will sync when online");
        return { message: "Action queued for sync when online" };
      }
    },
    [API_BASE_URL, queueOfflineAction]
  );

  const listItems = useCallback(async () => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const response = await offlineReadyFetch(
        `${API_BASE_URL}/api/inventory`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        },
        "inventory-list",
        24
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error: any) {
      console.error("Failed to fetch all inventory items:", error);
      throw error;
    }
  }, [API_BASE_URL, offlineReadyFetch]);

  // INVENTORY TODAY
  const getTodayItem = useCallback(async (id: string, batch_date: string) => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const response = await fetch(
        `${API_BASE_URL}/api/inventory-today/${id}/${batch_date}`,
        {
          method: "GET",
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
    } catch (error: any) {
      console.error(
        `Failed to fetch today inventory item ${id}/${batch_date}:`,
        error
      );
      throw error;
    }
  }, []);

  const addTodayItem = useCallback(
    async (item: AddInventoryPayload) => {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (navigator.onLine) {
        const response = await fetch(`${API_BASE_URL}/api/inventory-today`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(item),
        });
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
      } else {
        queueOfflineAction({
          type: "add-today-inventory-item",
          endpoint: `${API_BASE_URL}/api/inventory-today`,
          method: "POST",
          payload: item,
        });
        toast.info("Action saved offline - will sync when online");
        return { message: "Action queued for sync when online" };
      }
    },
    [API_BASE_URL, queueOfflineAction]
  );

  const updateTodayItem = useCallback(
    async (
      id: string | number,
      item: UpdateInventoryPayload,
      batch_date: string
    ) => {
      const cleanedItem = {
        ...item,
        expiration_date:
          item.expiration_date && item.expiration_date.trim() !== ""
            ? item.expiration_date
            : null,
      };

      return handleOfflineWriteOperation(
        async () => {
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("token")
              : null;
          const response = await fetch(
            `${API_BASE_URL}/api/inventory-today/${id}/${batch_date}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
              },
              body: JSON.stringify(cleanedItem),
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          return await response.json();
        },
        {
          action: "update-today-inventory-item",
          endpoint: `${API_BASE_URL}/api/inventory-today/${id}/${batch_date}`,
          method: "PUT",
          payload: cleanedItem,
        }
      );
    },
    [handleOfflineWriteOperation]
  );

  const deleteTodayItem = useCallback(
    async (id: string | number, batch_date: string) => {
      return handleOfflineWriteOperation(
        async () => {
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("token")
              : null;
          const response = await fetch(
            `${API_BASE_URL}/api/inventory-today/${id}/${batch_date}`,
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
          action: "delete-today-inventory-item",
          endpoint: `${API_BASE_URL}/api/inventory-today/${id}/${batch_date}`,
          method: "DELETE",
          payload: { id },
        }
      );
    },
    [handleOfflineWriteOperation]
  );

  const listTodayItems = useCallback(async () => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const response = await fetch(`${API_BASE_URL}/api/inventory-today`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error("Failed to fetch today inventory items:", error);
      throw error;
    }
  }, []);

  // INVENTORY SURPLUS
  // Updated: require both id and batch_date
  const getSurplusItem = useCallback(
    async (id: string | number, batch_date: string) => {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!batch_date) {
          throw new Error(
            "batch_date is required to fetch surplus inventory item"
          );
        }
        const response = await fetch(
          `${API_BASE_URL}/api/inventory-surplus/${id}/${batch_date}`,
          {
            method: "GET",
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
      } catch (error: any) {
        console.error(
          `Failed to fetch surplus inventory item ${id}/${batch_date}:`,
          error
        );
        throw error;
      }
    },
    [API_BASE_URL]
  );

  const addSurplusItem = useCallback(
    async (item: AddInventoryPayload) => {
      return handleOfflineWriteOperation(
        async () => {
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("token")
              : null;
          const response = await fetch(
            `${API_BASE_URL}/api/inventory-surplus`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
              },
              body: JSON.stringify(item),
            }
          );
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return await response.json();
        },
        {
          action: "add-surplus-inventory-item",
          endpoint: `${API_BASE_URL}/api/inventory-surplus`,
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
      batch_date: string
    ) => {
      const cleanedItem = {
        ...item,
        expiration_date:
          item.expiration_date && item.expiration_date.trim() !== ""
            ? item.expiration_date
            : null,
      };
      return handleOfflineWriteOperation(
        async () => {
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("token")
              : null;
          const response = await fetch(
            `${API_BASE_URL}/api/inventory-surplus/${id}/${batch_date}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
              },
              body: JSON.stringify(cleanedItem),
            }
          );
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return await response.json();
        },
        {
          action: "update-surplus-inventory-item",
          endpoint: `${API_BASE_URL}/api/inventory-surplus/${id}/${batch_date}`,
          method: "PUT",
          payload: cleanedItem,
        }
      );
    },
    [handleOfflineWriteOperation, API_BASE_URL]
  );

  const deleteSurplusItem = useCallback(
    async (id: string | number, batch_date: string) => {
      return handleOfflineWriteOperation(
        async () => {
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("token")
              : null;
          const response = await fetch(
            `${API_BASE_URL}/api/inventory-surplus/${id}/${batch_date}`,
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
          action: "delete-surplus-inventory-item",
          endpoint: `${API_BASE_URL}/api/inventory-surplus/${id}/${batch_date}`,
          method: "DELETE",
          payload: { id, batch_date },
        }
      );
    },
    [handleOfflineWriteOperation, API_BASE_URL]
  );

  const listSurplusItems = useCallback(async () => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const response = await fetch(`${API_BASE_URL}/api/inventory-surplus`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error: any) {
      console.error("Failed to fetch surplus inventory items:", error);
      throw error;
    }
  }, [API_BASE_URL]);

  const transferToToday = useCallback(
    async (id: string | number, quantity: number) => {
      return handleOfflineWriteOperation(
        async () => {
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("token")
              : null;
          const response = await fetch(
            `${API_BASE_URL}/api/inventory/${id}/transfer-to-today`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
              },
              body: JSON.stringify({ quantity }),
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          return await response.json();
        },
        {
          action: "transfer-to-today",
          endpoint: `${API_BASE_URL}/api/inventory/${id}/transfer-to-today`,
          method: "POST",
          payload: { id, quantity },
        }
      );
    },
    [handleOfflineWriteOperation]
  );

  const fifoTransferToToday = useCallback(
    async (item_name: string, quantity: number) => {
      return handleOfflineWriteOperation(
        async () => {
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("token")
              : null;
          const response = await fetch(
            `${API_BASE_URL}/api/inventory/fifo-transfer-to-today`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
              },
              body: JSON.stringify({ item_name, quantity }),
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
          }

          return await response.json();
        },
        {
          action: "fifo-transfer-to-today",
          endpoint: `${API_BASE_URL}/api/inventory/fifo-transfer-to-today`,
          method: "POST",
          payload: { item_name, quantity },
        }
      );
    },
    [handleOfflineWriteOperation, API_BASE_URL]
  );

  const listSpoilage = useCallback(async () => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const response = await fetch(`${API_BASE_URL}/api/inventory-spoilage`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error("Failed to fetch spoilage items:", error);
      throw error;
    }
  }, []);

  const transferToSpoilage = useCallback(
    async (id: string | number, quantity: number, reason?: string) => {
      return handleOfflineWriteOperation(
        async () => {
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("token")
              : null;
          const response = await fetch(
            `${API_BASE_URL}/api/inventory/${id}/transfer-to-spoilage`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
              },
              body: JSON.stringify({ quantity, reason }),
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          return await response.json();
        },
        {
          action: "transfer-to-spoilage",
          endpoint: `${API_BASE_URL}/api/inventory/${id}/transfer-to-spoilage`,
          method: "POST",
          payload: { id, quantity, reason },
        }
      );
    },
    [handleOfflineWriteOperation]
  );

  const deleteSpoilage = useCallback(
    async (spoilage_id: string | number) => {
      return handleOfflineWriteOperation(
        async () => {
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("token")
              : null;
          const response = await fetch(
            `${API_BASE_URL}/api/inventory-spoilage/${spoilage_id}`,
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
          action: "delete-spoilage-item",
          endpoint: `${API_BASE_URL}/api/inventory-spoilage/${spoilage_id}`,
          method: "DELETE",
          payload: { spoilage_id },
        }
      );
    },
    [handleOfflineWriteOperation]
  );

  // Transfer from any inventory to spoilage (expired)
  // Updated to support source_type and quantity as per backend API
  const transferAnyToSpoilage = useCallback(
    async (
      id: string | number,
      quantity: number,
      source_type: "main" | "today" | "surplus",
      reason?: string
    ) => {
      return handleOfflineWriteOperation(
        async () => {
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("token")
              : null;
          const response = await fetch(
            `${API_BASE_URL}/api/inventory/transfer-to-spoilage/${id}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
              },
              body: JSON.stringify({ quantity, source_type, reason }),
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          return await response.json();
        },
        {
          action: "transfer-any-to-spoilage",
          endpoint: `${API_BASE_URL}/api/inventory/transfer-to-spoilage/${id}`,
          method: "POST",
          payload: { id, quantity, source_type, reason },
        }
      );
    },
    [handleOfflineWriteOperation]
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
    fifoTransferToToday,

    listSpoilage,
    transferToSpoilage,
    deleteSpoilage,

    transferAnyToSpoilage,

    getOfflineActions,
  };
}
