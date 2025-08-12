/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosInstance from "@/app/lib/axios";
import { useCallback } from "react";

export interface InventoryLogEntry {
     item_id: number;
     remaining_stock?: number;
     action_date: string; // ISO string
     user_id: number;
     status: string;
     wastage?: number;
}

export function useInventoryReportAPI() {
     // Fetch logs (optionally by date or range)
     const fetchLogs = useCallback(async (start_date?: string, end_date?: string) => {
          const params: Record<string, string> = {};
          if (start_date) params.start_date = start_date;
          if (end_date) params.end_date = end_date;
          try {
               console.debug("[fetchLogs] params:", params);
               const res = await axiosInstance.get<InventoryLogEntry[]>("/api/inventory-log", { params });
               console.debug("[fetchLogs] response:", res.data);
               return res.data;
          } catch (err: any) {
               if (err.response) {
                    console.error("[fetchLogs] error:", err.response.data, err.response.status);
               } else {
                    console.error("[fetchLogs] error:", err);
               }
               throw err;
          }
     }, []);

     const saveLogs = useCallback(async (entries: InventoryLogEntry[]) => {
          try {
               console.debug("[saveLogs] entries:", entries);
               const res = await axiosInstance.put("/api/inventory-log", entries);
               console.debug("[saveLogs] response:", res.data);
               return res.data;
          } catch (err: any) {
               if (err.response) {
                    console.error("[saveLogs] error:", err.response.data, err.response.status);
               } else {
                    console.error("[saveLogs] error:", err);
               }
               throw err;
          }
     }, []);

     return {
          fetchLogs,
          saveLogs,
     };
}
