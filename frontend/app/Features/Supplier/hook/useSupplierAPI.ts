/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "@/app/lib/axios";
import { useCallback } from "react";

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
          const response = await axios.get<Supplier>(`/api/suppliers/${id}`);
          return response.data;
     }, []);

     const addSupplier = useCallback(async (supplier: AddSupplierPayload) => {
          const response = await axios.post("/api/suppliers", supplier);
          return response.data;
     }, []);

     const updateSupplier = useCallback(
          async (id: number | string, supplier: UpdateSupplierPayload) => {
               const response = await axios.put(`/api/suppliers/${id}`, supplier);
               return response.data;
          },
          []
     );

     const deleteSupplier = useCallback(async (id: number | string) => {
          const response = await axios.delete(`/api/suppliers/${id}`);
          return response.data;
     }, []);

     const listSuppliers = useCallback(async () => {
          try {
               const response = await axios.get<Supplier[]>("/api/suppliers");
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
