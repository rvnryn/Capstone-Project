import axios from "@/app/lib/axios";
import { offlineAxiosRequest } from "@/app/utils/offlineAxios";
import { useOfflineQueue } from "@/app/hooks/usePWA";
import { useCallback } from "react";
import { toast } from "react-toastify";

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
  const getSupplier = useCallback(async (id: number | string) => {
    try {
      const response = await offlineAxiosRequest(
        {
          method: "GET",
          url: `/api/suppliers/${id}`,
        },
        {
          cacheKey: `supplier-${id}`,
          cacheHours: 24, // Suppliers change less frequently
          showErrorToast: true,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error(`Failed to fetch supplier ${id}:`, error);
      throw error;
    }
  }, []);

  const addSupplier = useCallback(
    async (supplier: AddSupplierPayload) => {
      return handleOfflineWriteOperation(
        () =>
          offlineAxiosRequest(
            {
              method: "POST",
              url: "/api/suppliers",
              data: supplier,
            },
            {
              showErrorToast: true,
            }
          ),
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
        () =>
          offlineAxiosRequest(
            {
              method: "PUT",
              url: `/api/suppliers/${id}`,
              data: supplier,
            },
            {
              showErrorToast: true,
            }
          ),
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
        () =>
          offlineAxiosRequest(
            {
              method: "DELETE",
              url: `/api/suppliers/${id}`,
            },
            {
              showErrorToast: true,
            }
          ),
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
      const response = await offlineAxiosRequest<Supplier[]>(
        {
          method: "GET",
          url: "/api/suppliers",
        },
        {
          cacheKey: "suppliers-list",
          cacheHours: 24,
          showErrorToast: true,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error(
        "Supplier API list error:",
        error.response?.data || error.message
      );
      throw error;
    }
  }, []);

  return {
    getSupplier,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    listSuppliers,
  };
}
