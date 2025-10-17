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
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchLogs = useCallback(
    async (start_date?: string, end_date?: string) => {
      const params = new URLSearchParams();
      if (start_date) params.append("start_date", start_date);
      if (end_date) params.append("end_date", end_date);

      try {
        console.debug("[fetchLogs] params:", params.toString());

        const url = `${API_BASE_URL}/api/inventory-log${
          params.toString() ? `?${params.toString()}` : ""
        }`;

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.debug("[fetchLogs] response:", data);
        return data;
      } catch (err: any) {
        console.error("[fetchLogs] error:", err);
        // Return empty array for errors instead of throwing
        return [];
      }
    },
    []
  );

  const saveLogs = useCallback(async (entries: InventoryLogEntry[]) => {
    try {
      console.debug("[saveLogs] entries:", entries);

      const response = await fetch(`${API_BASE_URL}/api/inventory-log`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(entries),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.debug("[saveLogs] response:", data);
      return data;
    } catch (err: any) {
      console.error("[saveLogs] error:", err);
      throw err;
    }
  }, []);

  /**
   * Fetch spoilage summary (total quantity spoiled) from backend inventory API.
   * Optionally accepts start_date and end_date (YYYY-MM-DD).
   */
  const fetchSpoilageSummary = useCallback(
    async (start_date?: string, end_date?: string) => {
      const params = new URLSearchParams();
      if (start_date) params.append("start_date", start_date);
      if (end_date) params.append("end_date", end_date);

      try {
        const url = `${API_BASE_URL}/api/inventory-spoilage${
          params.toString() ? `?${params.toString()}` : ""
        }`;

        // Get token from localStorage if available
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      } catch (err: any) {
        console.error("[fetchSpoilageSummary] error:", err);
        return [];
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
