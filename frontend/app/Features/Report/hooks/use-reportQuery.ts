/**
 * React Query hooks for Report module with real-time updates
 * Features:
 * - Mutation-triggered refresh (refetches only when data changes)
 * - Smart caching with staleTime: 0 for fresh data
 * - Auto-refetch on window focus, mount, and reconnect
 * - Automatic error handling with toast notifications
 * - Cache invalidation for all mutations
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Helper function to get auth token
const getToken = () => {
  if (typeof window !== "undefined") {
    return (
      localStorage.getItem("token") || localStorage.getItem("access_token")
    );
  }
  return null;
};

// =============================================================================
// USER ACTIVITY REPORTS
// =============================================================================

/**
 * Fetch user activity logs with optional filters
 * Auto-refreshes every 5 minutes
 */
export function useUserActivityLogs(params?: {
  user_id?: number;
  action_type?: string;
  role?: string;
  start_date?: string;
  end_date?: string;
  report_date?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["user-activity-logs", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
      }

      const url = `${API_BASE_URL}/api/user-activity${
        searchParams.toString() ? `?${searchParams.toString()}` : ""
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

      // Cache data for offline support
      if (typeof window !== "undefined") {
        localStorage.setItem("cached_user_activity_logs", JSON.stringify(data));
      }

      return data || [];
    },
    staleTime: 0, // Always consider data stale to ensure fresh data after mutations
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnReconnect: true, // Refetch when internet reconnects
    refetchOnMount: true, // Always refetch when component mounts
  });
}

/**
 * Create a new user activity log entry
 */
export function useCreateUserActivityLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: {
      user_id: number;
      action_type: string;
      description?: string;
      username?: string;
      role?: string;
    }) => {
      const response = await fetch(`${API_BASE_URL}/api/user-activity`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(log),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    },
    onSuccess: () => {
      // Invalidate all user activity queries to refresh the lists
      queryClient.invalidateQueries({ queryKey: ["user-activity-logs"] });
      toast.success("Activity logged successfully!");
    },
    onError: (error: any) => {
      toast.error(`Failed to log activity: ${error.message}`);
    },
  });
}

// =============================================================================
// SALES REPORTS
// =============================================================================

/**
 * Fetch sales summary data
 * Auto-refreshes every 5 minutes
 */
export function useSalesSummary(params?: {
  start_date?: string;
  end_date?: string;
}) {
  return useQuery({
    queryKey: ["sales-summary", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.start_date)
        searchParams.append("start_date", params.start_date);
      if (params?.end_date) searchParams.append("end_date", params.end_date);

      const token = getToken();
      const response = await fetch(
        `${API_BASE_URL}/api/sales-summary?${searchParams.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Cache data for offline support
      if (typeof window !== "undefined") {
        localStorage.setItem("cached_sales_summary", JSON.stringify(data));
      }

      return data;
    },
    staleTime: 0, // Always consider data stale to ensure fresh data after mutations
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnReconnect: true, // Refetch when internet reconnects
    refetchOnMount: true, // Always refetch when component mounts
  });
}

/**
 * Fetch detailed sales data
 * Auto-refreshes every 5 minutes
 */
export function useSalesDetailed(params?: {
  start_date?: string;
  end_date?: string;
}) {
  return useQuery({
    queryKey: ["sales-detailed", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.start_date)
        searchParams.append("start_date", params.start_date);
      if (params?.end_date) searchParams.append("end_date", params.end_date);

      const token = getToken();
      const response = await fetch(
        `${API_BASE_URL}/api/sales-detailed?${searchParams.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Cache data for offline support
      if (typeof window !== "undefined") {
        localStorage.setItem("cached_sales_detailed", JSON.stringify(data));
      }

      return data;
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

/**
 * Fetch sales data grouped by date
 * Auto-refreshes every 5 minutes
 */
export function useSalesByDate(params?: {
  start_date?: string;
  end_date?: string;
  grouping?: "daily" | "weekly" | "monthly";
}) {
  return useQuery({
    queryKey: ["sales-by-date", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.start_date)
        searchParams.append("start_date", params.start_date);
      if (params?.end_date) searchParams.append("end_date", params.end_date);
      if (params?.grouping) searchParams.append("grouping", params.grouping);

      const token = getToken();
      const response = await fetch(
        `${API_BASE_URL}/api/sales-by-date?${searchParams.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Cache data for offline support
      if (typeof window !== "undefined") {
        localStorage.setItem("cached_sales_dates", JSON.stringify(data));
      }

      return data;
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

/**
 * Fetch weekly sales forecast
 * Auto-refreshes every 5 minutes
 */
export function useWeeklySalesForecast(params?: {
  item_name?: string;
  category?: string;
}) {
  return useQuery({
    queryKey: ["weekly-sales-forecast", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.item_name) searchParams.append("item_name", params.item_name);
      if (params?.category) searchParams.append("category", params.category);

      const token = getToken();
      const response = await fetch(
        `${API_BASE_URL}/api/weekly-sales-forecast${
          searchParams.toString() ? `?${searchParams.toString()}` : ""
        }`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Cache data for offline support
      if (typeof window !== "undefined") {
        localStorage.setItem("cached_forecast", JSON.stringify(data));
      }

      return data;
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

/**
 * Import sales data from external source
 */
export function useImportSalesData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { rows: any[]; auto_deduct?: boolean }) => {
      const token = getToken();

      if (!token) {
        throw new Error("Authentication required. Please log in again.");
      }

      const requestBody = {
        rows: params.rows,
        auto_deduct: params.auto_deduct || false,
      };

      console.log("[DEBUG] Sending import request:", {
        rowCount: params.rows.length,
        auto_deduct: requestBody.auto_deduct,
        firstRow: params.rows[0],
      });

      const response = await fetch(`${API_BASE_URL}/api/import-sales`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Session expired. Please log in again.");
        }
        throw new Error(`Import failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("[DEBUG] Import response:", result);
      return result;
    },
    onSuccess: (data) => {
      console.log("[DEBUG] Import successful:", data);
      // Invalidate all sales queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["sales-summary"] });
      queryClient.invalidateQueries({ queryKey: ["sales-detailed"] });
      queryClient.invalidateQueries({ queryKey: ["sales-by-date"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-sales-forecast"] });

      // Show message with auto-deduction info if available
      if (data.inventory_deduction) {
        toast.success(`Sales imported! ${data.message || ""}`);
      } else {
        toast.success("Sales data imported successfully!");
      }
    },
    onError: (error: any) => {
      toast.error(`Failed to import sales data: ${error.message}`);
    },
  });
}

// =============================================================================
// INVENTORY REPORTS
// =============================================================================

/**
 * Fetch inventory analytics/report data
 * Auto-refreshes every 5 minutes
 */
export function useInventoryReport(params?: {
  start_date?: string;
  end_date?: string;
  category?: string;
  item_name?: string;
}) {
  return useQuery({
    queryKey: ["inventory-report", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.start_date)
        searchParams.append("start_date", params.start_date);
      if (params?.end_date) searchParams.append("end_date", params.end_date);
      if (params?.category) searchParams.append("category", params.category);
      if (params?.item_name) searchParams.append("item_name", params.item_name);

      const token = getToken();
      const response = await fetch(
        `${API_BASE_URL}/api/inventory-report?${searchParams.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Cache data for offline support
      if (typeof window !== "undefined") {
        localStorage.setItem("cached_inventory_report", JSON.stringify(data));
      }

      return data;
    },
    staleTime: 0, // Always consider data stale to ensure fresh data after mutations
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnReconnect: true, // Refetch when internet reconnects
    refetchOnMount: true, // Always refetch when component mounts
  });
}

// =============================================================================
// COMPREHENSIVE SALES ANALYTICS
// =============================================================================

/**
 * Fetch comprehensive sales report data (all data at once)
 * This combines multiple endpoints for efficiency
 * Auto-refreshes every 5 minutes
 */
export function useComprehensiveSalesReport(params?: {
  start_date?: string;
  end_date?: string;
  item_name?: string;
  category?: string;
}) {
  return useQuery({
    queryKey: ["comprehensive-sales-report", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.start_date)
        searchParams.append("start_date", params.start_date);
      if (params?.end_date) searchParams.append("end_date", params.end_date);

      const forecastParams = new URLSearchParams();
      if (params?.item_name)
        forecastParams.append("item_name", params.item_name);
      if (params?.category) forecastParams.append("category", params.category);

      const token = getToken();
      const authHeader: Record<string, string> = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      // Fetch all data in parallel
      const [summaryRes, itemsRes, dateRes, forecastRes] =
        await Promise.allSettled([
          fetch(
            `${API_BASE_URL}/api/sales-summary?${searchParams.toString()}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                ...authHeader,
              },
            }
          ).then(async (res) => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return await res.json();
          }),
          fetch(
            `${API_BASE_URL}/api/sales-detailed?${searchParams.toString()}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                ...authHeader,
              },
            }
          ).then(async (res) => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return await res.json();
          }),
          fetch(
            `${API_BASE_URL}/api/sales-by-date?${searchParams.toString()}&grouping=daily`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                ...authHeader,
              },
            }
          ).then(async (res) => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return await res.json();
          }),
          fetch(
            `${API_BASE_URL}/api/weekly-sales-forecast${
              forecastParams.toString() ? `?${forecastParams.toString()}` : ""
            }`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                ...authHeader,
              },
            }
          ).then(async (res) => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return await res.json();
          }),
        ]);

      // Extract data with fallbacks
      const summary =
        summaryRes.status === "fulfilled"
          ? summaryRes.value
          : {
              total_revenue: 0,
              total_orders: 0,
              total_items_sold: 0,
              avg_order_value: 0,
            };
      const salesDetailed =
        itemsRes.status === "fulfilled" ? itemsRes.value : { sales: [] };
      const dates =
        dateRes.status === "fulfilled" ? dateRes.value : { data: [] };
      const forecast =
        forecastRes.status === "fulfilled"
          ? forecastRes.value
          : { forecast: [], historical_predictions: [] };

      // Combine into single data structure
      const reportData = {
        totalRevenue: summary.total_revenue,
        totalOrders: summary.total_orders,
        totalItems: summary.total_items_sold,
        avgOrderValue: summary.avg_order_value,
        topItems: salesDetailed.sales,
        dailySales: dates.data,
        forecast: forecast.forecast || [],
        historicalPredictions: forecast.historical_predictions || [],
      };

      // Cache combined data
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "cached_comprehensive_sales_report",
          JSON.stringify(reportData)
        );
      }

      return reportData;
    },
    staleTime: 0, // Always consider data stale to ensure fresh data after mutations
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnReconnect: true, // Refetch when internet reconnects
    refetchOnMount: true, // Always refetch when component mounts
  });
}

// =============================================================================
// EXPORT LOGGING
// =============================================================================

/**
 * Log report export activity
 */
export function useLogExport() {
  return useMutation({
    mutationFn: async (exportData: {
      report_type: string;
      record_count: number;
    }) => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/log-export`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(exportData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    },
    onError: (error: any) => {
      console.log("Failed to log export activity:", error);
      // Don't show error to user, just log it
    },
  });
}
