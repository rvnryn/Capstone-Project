import { useCallback } from "react";
import { useOfflineAPI, useOffline } from "@/app/context/OfflineContext";
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
  const { offlineReadyFetch } = useOfflineAPI();
  const { queueOfflineAction, getOfflineActions } = useOffline();

  const getSupplier = useCallback(async (id: number | string) => {
    try {
      const response = await offlineReadyFetch(
        `${API_BASE_URL}/api/suppliers/${id}`,
        { method: "GET", headers: { "Content-Type": "application/json" } },
        `supplier-${id}`,
        24
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error: any) {
      console.warn(`Failed to fetch supplier ${id} (offline or network error)`);
      throw error;
    }
  }, [API_BASE_URL, offlineReadyFetch]);

  const addSupplier = useCallback(
    async (supplier: AddSupplierPayload) => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (navigator.onLine) {
        const response = await fetch(`${API_BASE_URL}/api/suppliers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(supplier),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
      } else {
        queueOfflineAction({
          type: "add-supplier",
          endpoint: `${API_BASE_URL}/api/suppliers`,
          method: "POST",
          payload: supplier,
        });
        toast.info("Action saved offline - will sync when online");
        return { message: "Action queued for sync when online" };
      }
    },
    [API_BASE_URL, queueOfflineAction]);

  const updateSupplier = useCallback(
    async (id: number | string, supplier: UpdateSupplierPayload) => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (navigator.onLine) {
        const response = await fetch(`${API_BASE_URL}/api/suppliers/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(supplier),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
      } else {
        queueOfflineAction({
          type: "update-supplier",
          endpoint: `${API_BASE_URL}/api/suppliers/${id}`,
          method: "PUT",
          payload: supplier,
        });
        toast.info("Action saved offline - will sync when online");
        return { message: "Action queued for sync when online" };
      }
    },
    [API_BASE_URL, queueOfflineAction]);

  const deleteSupplier = useCallback(
    async (id: number | string) => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (navigator.onLine) {
        const response = await fetch(`${API_BASE_URL}/api/suppliers/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
      } else {
        queueOfflineAction({
          type: "delete-supplier",
          endpoint: `${API_BASE_URL}/api/suppliers/${id}`,
          method: "DELETE",
          payload: { id },
        });
        toast.info("Action saved offline - will sync when online");
        return { message: "Action queued for sync when online" };
      }
    },
    [API_BASE_URL, queueOfflineAction]);

  const listSuppliers = useCallback(async () => {
    try {
      const response = await offlineReadyFetch(
        `${API_BASE_URL}/api/suppliers`,
        { method: "GET", headers: { "Content-Type": "application/json" } },
        "supplier-list",
        24
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error: any) {
      console.error("Failed to fetch suppliers:", error);
      throw error;
    }
  }, [API_BASE_URL, offlineReadyFetch]);

  return {
    getSupplier,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    listSuppliers,
    getOfflineActions,
  };
}
