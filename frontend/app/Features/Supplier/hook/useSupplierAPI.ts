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
  const getSupplier = useCallback(async (id: number | string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/suppliers/${id}`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error: any) {
      toast.error(`Failed to fetch supplier: ${error.message}`);
      throw error;
    }
  }, []);

  const addSupplier = useCallback(
    async (supplier: AddSupplierPayload) => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
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
      } catch (error: any) {
        toast.error(`Failed to add supplier: ${error.message}`);
        throw error;
      }
    },
    []);

  const updateSupplier = useCallback(
    async (id: number | string, supplier: UpdateSupplierPayload) => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
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
      } catch (error: any) {
        toast.error(`Failed to update supplier: ${error.message}`);
        throw error;
      }
    },
    []);

  const deleteSupplier = useCallback(
    async (id: number | string) => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const response = await fetch(`${API_BASE_URL}/api/suppliers/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
      } catch (error: any) {
        toast.error(`Failed to delete supplier: ${error.message}`);
        throw error;
      }
    },
    []);

  const listSuppliers = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/suppliers`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error: any) {
      toast.error(`Failed to fetch suppliers: ${error.message}`);
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
