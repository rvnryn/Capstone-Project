import { useState } from "react";
import axiosInstance from "@/app/lib/axios";
import axios from "axios";

export interface InventorySetting {
     id: number;
     name: string;
     default_unit?: string;
     low_stock_threshold?: number;
     category?: string;
     created_at?: string;
     updated_at?: string;
}

export interface InventorySettingInput {
     name: string;
     default_unit?: string;
     low_stock_threshold?: number;
     category?: string;
}

const API_BASE = "/api/inventory-settings";

export function useInventorySettingsAPI() {
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState<string | null>(null);

     const fetchSettings = async (): Promise<InventorySetting[]> => {
          setLoading(true);
          setError(null);
          try {
               const res = await axiosInstance.get(API_BASE);
               return res.data;
          } catch (err) {
               if (axios.isAxiosError(err)) {
                    setError((err.response?.data?.detail as string) || err.message);
               } else {
                    setError("Unknown error");
               }
               return [];
          } finally {
               setLoading(false);
          }
     };

     const createSetting = async (data: InventorySettingInput): Promise<InventorySetting | null> => {
          setLoading(true);
          setError(null);
          try {
               const res = await axiosInstance.post(API_BASE, data);
               return res.data;
          } catch (err) {
               if (axios.isAxiosError(err)) {
                    setError((err.response?.data?.detail as string) || err.message);
               } else {
                    setError("Unknown error");
               }
               return null;
          } finally {
               setLoading(false);
          }
     };

     const updateSetting = async (id: number, data: InventorySettingInput): Promise<InventorySetting | null> => {
          setLoading(true);
          setError(null);
          try {
               const res = await axiosInstance.put(`${API_BASE}/${id}`, data);
               return res.data;
          } catch (err) {
               if (axios.isAxiosError(err)) {
                    setError((err.response?.data?.detail as string) || err.message);
               } else {
                    setError("Unknown error");
               }
               return null;
          } finally {
               setLoading(false);
          }
     };

     const deleteSetting = async (id: number): Promise<boolean> => {
          setLoading(true);
          setError(null);
          try {
               await axiosInstance.delete(`${API_BASE}/${id}`);
               return true;
          } catch (err) {
               if (axios.isAxiosError(err)) {
                    setError((err.response?.data?.detail as string) || err.message);
               } else {
                    setError("Unknown error");
               }
               return false;
          } finally {
               setLoading(false);
          }
     };

     return {
          loading,
          error,
          fetchSettings,
          createSetting,
          updateSetting,
          deleteSetting,
     };
}
