/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosInstance from "@/app/lib/axios";
import { useCallback } from "react";

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
     // INVENTORY
     const getItem = useCallback(async (id: string) => {
          const response = await axiosInstance.get<InventoryItem>(`/api/inventory/${id}`);
          return response.data;
     }, []);

     const addItem = useCallback(async (item: AddInventoryPayload) => {
          const response = await axiosInstance.post("/api/inventory", item);
          return response.data;
     }, []);

     const updateItem = useCallback(
          async (id: string, item: UpdateInventoryPayload) => {
               const cleanedItem = {
                    ...item,
                    expiration_date:
                         item.expiration_date && item.expiration_date.trim() !== ""
                              ? item.expiration_date
                              : null,
               };

               const response = await axiosInstance.put(`/api/inventory/${id}`, cleanedItem);
               return response.data;
          },
          []
     );

     const deleteItem = useCallback(async (id: string | number) => {
          const response = await axiosInstance.delete(`/api/inventory/${id}`);
          return response.data;
     }, []);

     const listItems = useCallback(async () => {
          try {
               const response = await axiosInstance.get<InventoryItem[]>("/api/inventory");
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
          const response = await axiosInstance.get<InventoryItem>(`/api/inventory-today/${id}`);
          return response.data;
     }, []);

     const addTodayItem = useCallback(async (item: AddInventoryPayload) => {
          const response = await axiosInstance.post("/api/inventory-today", item);
          return response.data;
     }, []);

     const updateTodayItem = useCallback(
          async (id: string, item: UpdateInventoryPayload) => {
               const cleanedItem = {
                    ...item,
                    expiration_date:
                         item.expiration_date && item.expiration_date.trim() !== ""
                              ? item.expiration_date
                              : null,
               };

               const response = await axiosInstance.put(`/api/inventory-today/${id}`, cleanedItem);
               return response.data;
          },
          []
     );

     const deleteTodayItem = async (id: number) => {
          await axiosInstance.delete(`/api/inventory-today/${id}`);
     };

     const listTodayItems = useCallback(async () => {
          try {
               const response = await axiosInstance.get<InventoryItem[]>("/api/inventory-today");
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
     const getSurplusItem = useCallback(async (id: string) => {
          const response = await axiosInstance.get<InventoryItem>(`/api/inventory-surplus/${id}`);
          return response.data;
     }, []);

     const addSurplusItem = useCallback(async (item: AddInventoryPayload) => {
          const response = await axiosInstance.post("/api/inventory-surplus", item);
          return response.data;
     }, []);

     const updateSurplusItem = useCallback(
          async (id: string, item: UpdateInventoryPayload) => {
               const cleanedItem = {
                    ...item,
                    expiration_date:
                         item.expiration_date && item.expiration_date.trim() !== ""
                              ? item.expiration_date
                              : null,
               };

               const response = await axiosInstance.put(`/api/inventory-surplus/${id}`, cleanedItem);
               return response.data;
          },
          []
     );

     const deleteSurplusItem = async (id: number) => {
          await axiosInstance.delete(`/inventory-surplus/${id}`);
     };

     const listSurplusItems = useCallback(async () => {
          try {
               const response = await axiosInstance.get<InventoryItem[]>("/inventory-surplus");
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
          async (id: string, quantity: number) => {
               try {
                    const response = await axiosInstance.post(`/api/inventory/${id}/transfer-to-today`, { quantity });
                    return response.data;
               } catch (error: any) {
                    console.error("transferToToday API error:", error.response?.data || error.message);
                    throw error;
               }
          },
          []
     );


     const transferToSurplus = useCallback(
          async (id: string) => {
               try {
                    const response = await axiosInstance.post(`/api/inventory-today/${id}/transfer-to-surplus`);
                    return response.data;
               } catch (error: any) {
                    console.error("transferToSurplus API error:", error.response?.data || error.message);
                    throw error;
               }
          },
          []
     );


     const transferSurplusToToday = useCallback(
          async (id: string) => {
               try {
                    const response = await axiosInstance.post(`/api/transfer-to-surplus/${id}/inventory-today`);
                    return response.data;
               } catch (error: any) {
                    console.error("transferSurplusToToday API error:", error.response?.data || error.message);
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
