import { offlineAxiosRequest } from "@/app/utils/offlineAxios";
import { useCallback } from "react";

export interface InventoryLogEntry {
  item_id: number;
  remaining_stock?: number;
  action_date: string; // ISO string
  user_id: number;
  status: string;
  wastage?: number;
  item_name: string;
  batch_date: string; // ISO string
}

export function useInventoryReportAPI() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

  const fetchLogs = useCallback(
    async (start_date?: string, end_date?: string) => {
      const params: Record<string, string> = {};
      if (start_date) params.start_date = start_date;
      if (end_date) params.end_date = end_date;
      try {
        console.debug("[fetchLogs] params:", params);

        const cacheKey = `inventory-logs-${start_date || "all"}-${
          end_date || "all"
        }`;
        const response = await offlineAxiosRequest(
          {
            method: "GET",
            url: `${API_BASE_URL}/api/inventory-log`,
            params,
          },
          {
            cacheKey,
            cacheHours: 1, // Reports are time-sensitive
            showErrorToast: true,
            fallbackData: [],
          }
        );

        console.debug("[fetchLogs] response:", response.data);
        return response.data;
      } catch (err: any) {
        console.error("[fetchLogs] error:", err);
        if (err.isOfflineError) {
          // Return empty array for offline errors instead of throwing
          return [];
        }
        throw err;
      }
    },
    []
  );

  const saveLogs = useCallback(async (entries: InventoryLogEntry[]) => {
    try {
      console.debug("[saveLogs] entries:", entries);
      const res = await offlineAxiosRequest(
        {
          method: "PUT",
          url: `${API_BASE_URL}/api/inventory-log`,
          data: entries,
        },
        {
          showErrorToast: true,
        }
      );
      console.debug("[saveLogs] response:", res.data);
      return res.data;
    } catch (err: any) {
      if (err.response) {
        console.error(
          "[saveLogs] error:",
          err.response.data,
          err.response.status
        );
      } else {
        console.error("[saveLogs] error:", err);
      }
      throw err;
    }
  }, []);

  /**
   * Fetch spoilage summary (total quantity spoiled) from backend inventory API.
   * Optionally accepts start_date and end_date (YYYY-MM-DD).
   */
  const fetchSpoilageSummary = useCallback(
    async (start_date?: string, end_date?: string) => {
      const params: Record<string, string> = {};
      if (start_date) params.start_date = start_date;
      if (end_date) params.end_date = end_date;
      try {
        const response = await offlineAxiosRequest(
          {
            method: "GET",
            url: `${API_BASE_URL}/api/inventory-spoilage`,
            params,
          },
          {
            cacheKey: `spoilage-summary-${start_date || "all"}-${
              end_date || "all"
            }`,
            cacheHours: 1,
            showErrorToast: true,
            fallbackData: [],
          }
        );
        return response.data;
      } catch (err: any) {
        console.error("[fetchSpoilageSummary] error:", err);
        if (err.isOfflineError) {
          return [];
        }
        throw err;
      }
    },
    []
  );

  return {
    fetchLogs,
    saveLogs,
    fetchSpoilageSummary, // <-- add this to the returned API
  };
}
