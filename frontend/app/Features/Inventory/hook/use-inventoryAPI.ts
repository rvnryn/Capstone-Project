"use client";
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
}

export type UpdateInventoryPayload = Partial<AddInventoryPayload>;

export function useInventoryAPI() {
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
  // INVENTORY
  const getItem = useCallback(async (id: string) => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const response = await fetch(`${API_BASE_URL}/api/inventory/${id}`, {
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
      console.error(`Failed to fetch inventory item ${id}:`, error);
      throw error;
    }
  }, []);

  const addItem = useCallback(
    async (item: AddInventoryPayload) => {
      return handleOfflineWriteOperation(
        async () => {
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("token")
              : null;
          const response = await fetch(`${API_BASE_URL}/api/inventory`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify(item),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          return await response.json();
        },
        {
          action: "add-inventory-item",
          endpoint: `${API_BASE_URL}/api/inventory`,
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
        async () => {
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("token")
              : null;
          const response = await fetch(`${API_BASE_URL}/api/inventory/${id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify(cleanedItem),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          return await response.json();
        },
        {
          action: "update-inventory-item",
          endpoint: `${API_BASE_URL}/api/inventory/${id}`,
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
        async () => {
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("token")
              : null;
          const response = await fetch(`${API_BASE_URL}/api/inventory/${id}`, {
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
          action: "delete-inventory-item",
          endpoint: `${API_BASE_URL}/api/inventory/${id}`,
          method: "DELETE",
          payload: { id },
        }
      );
    },
    [handleOfflineWriteOperation]
  );

  const listItems = useCallback(async () => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const response = await fetch(`${API_BASE_URL}/api/inventory`, {
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
      console.error("Failed to fetch all inventory items:", error);
      throw error;
    }
  }, []);

  // INVENTORY TODAY
  const getTodayItem = useCallback(async (id: string) => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const response = await fetch(
        `${API_BASE_URL}/api/inventory-today/${id}`,
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
      console.error(`Failed to fetch today inventory item ${id}:`, error);
      throw error;
    }
  }, []);

  const addTodayItem = useCallback(
    async (item: AddInventoryPayload) => {
      return handleOfflineWriteOperation(
        async () => {
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("token")
              : null;
          const response = await fetch(`${API_BASE_URL}/api/inventory-today`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify(item),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          return await response.json();
        },
        {
          action: "add-today-inventory-item",
          endpoint: `${API_BASE_URL}/api/inventory-today`,
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
        async () => {
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("token")
              : null;
          const response = await fetch(
            `${API_BASE_URL}/api/inventory-today/${id}`,
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
          endpoint: `${API_BASE_URL}/api/inventory-today/${id}`,
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
        async () => {
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("token")
              : null;
          const response = await fetch(
            `${API_BASE_URL}/api/inventory-today/${id}`,
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
          endpoint: `${API_BASE_URL}/api/inventory-today/${id}`,
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
  const getSurplusItem = useCallback(async (id: string | number) => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const response = await fetch(
        `${API_BASE_URL}/api/inventory-surplus/${id}`,
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
      console.error(`Failed to fetch surplus inventory item ${id}:`, error);
      throw error;
    }
  }, []);

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
    async (id: string | number, item: UpdateInventoryPayload) => {
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
            `${API_BASE_URL}/api/inventory-surplus/${id}`,
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
          endpoint: `${API_BASE_URL}/api/inventory-surplus/${id}`,
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
        async () => {
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("token")
              : null;
          const response = await fetch(
            `${API_BASE_URL}/api/inventory-surplus/${id}`,
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
          endpoint: `${API_BASE_URL}/api/inventory-surplus/${id}`,
          method: "DELETE",
          payload: { id },
        }
      );
    },
    [handleOfflineWriteOperation]
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
  }, []);

  // TRANSFER ENDPOINTS

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

  const transferToSurplus = useCallback(
    async (id: string | number, quantity: number) => {
      return handleOfflineWriteOperation(
        async () => {
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("token")
              : null;
          const response = await fetch(
            `${API_BASE_URL}/api/inventory-today/${id}/transfer-to-surplus`,
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
          action: "transfer-to-surplus",
          endpoint: `${API_BASE_URL}/api/inventory-today/${id}/transfer-to-surplus`,
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
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const response = await fetch(
          `${API_BASE_URL}/api/inventory-surplus/${id}/transfer-to-today`,
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
      } catch (error: any) {
        console.error("Failed to transfer surplus to today:", error);
        throw error;
      }
    },
    []
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

    listSpoilage,
    transferToSpoilage,
    deleteSpoilage,

    getOfflineActions,
  };
}
