import { useOfflineQueue } from "@/app/hooks/usePWA";
import { useCallback } from "react";
import { toast } from "react-toastify";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Supplier types
export interface Supplier {
  supplier_id: number;
  supplier_name: string;
  contact_person?: string;
  supplies?: string;
  phone_number?: string;
  email?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
}

export type AddSupplierPayload = {
  supplier_name: string;
  contact_person?: string;
  phone_number?: string;
  email?: string;
  address?: string;
  supplies?: string; // Add supplies field
};

export type UpdateSupplierPayload = Partial<AddSupplierPayload>;

export function useSupplierAPI() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
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

  const getSupplier = useCallback(async (id: number | string) => {
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_BASE_URL}/api/suppliers/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.warn(`Failed to fetch supplier ${id} (offline or network error)`);
      throw error;
    }
  }, []);

  const addSupplier = useCallback(
    async (supplier: AddSupplierPayload) => {
      return handleOfflineWriteOperation(
        async () => {
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("token")
              : null;
          const response = await fetch(`${API_BASE_URL}/api/suppliers`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify(supplier),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          return await response.json();
        },
        {
          action: "add-supplier",
          endpoint: "/api/suppliers",
          method: "POST",
          payload: supplier,
        }
      );
    },
    [handleOfflineWriteOperation]
  );

  const updateSupplier = useCallback(
    async (id: number | string, supplier: UpdateSupplierPayload) => {
      return handleOfflineWriteOperation(
        async () => {
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("token")
              : null;
          const response = await fetch(`${API_BASE_URL}/api/suppliers/${id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify(supplier),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          return await response.json();
        },
        {
          action: "update-supplier",
          endpoint: `/api/suppliers/${id}`,
          method: "PUT",
          payload: supplier,
        }
      );
    },
    [handleOfflineWriteOperation]
  );

  const deleteSupplier = useCallback(
    async (id: number | string) => {
      return handleOfflineWriteOperation(
        async () => {
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("token")
              : null;
          const response = await fetch(`${API_BASE_URL}/api/suppliers/${id}`, {
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
          action: "delete-supplier",
          endpoint: `/api/suppliers/${id}`,
          method: "DELETE",
          payload: { id },
        }
      );
    },
    [handleOfflineWriteOperation]
  );

  const listSuppliers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/suppliers`, {
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
      console.error("Failed to fetch suppliers:", error);
      throw error;
    }
  }, []);

  return {
    getSupplier,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    listSuppliers,
    getOfflineActions,
  };
}
