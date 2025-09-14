import { useCallback } from "react";
import { offlineAxiosRequest } from "@/app/utils/offlineAxios";

export function useDashboardAPI() {
  // Fetch low stock ingredients with offline support
  const fetchLowStock = useCallback(async () => {
    try {
      const response = await offlineAxiosRequest(
        {
          method: "GET",
          url: "/api/dashboard/low-stock",
        },
        {
          cacheKey: "dashboard-low-stock",
          cacheHours: 24, // Extend cache to 24 hours for better offline experience
          showErrorToast: true,
          fallbackData: [], // Return empty array as fallback
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch low stock data:", error);
      // Always return empty array for offline scenarios
      // Don't let server-side network errors propagate
      return [];
    }
  }, []);

  // Fetch expiring ingredients with offline support
  const fetchExpiring = useCallback(async () => {
    try {
      const response = await offlineAxiosRequest(
        {
          method: "GET",
          url: "/api/dashboard/expiring-ingredients",
        },
        {
          cacheKey: "dashboard-expiring",
          cacheHours: 12, // Extend cache to 12 hours (still time-sensitive but offline-friendly)
          showErrorToast: true,
          fallbackData: [],
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch expiring ingredients:", error);
      // Always return empty array, never throw to prevent server crashes
      return [];
    }
  }, []);

  // Fetch surplus ingredients with offline support
  const fetchSurplus = useCallback(async () => {
    try {
      const response = await offlineAxiosRequest(
        {
          method: "GET",
          url: "/api/dashboard/surplus-ingredients",
        },
        {
          cacheKey: "dashboard-surplus",
          cacheHours: 48, // Extend cache to 48 hours (less time-sensitive)
          showErrorToast: true,
          fallbackData: [],
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch surplus ingredients:", error);
      // Always return empty array for robust offline handling
      return [];
    }
  }, []);

  return {
    fetchLowStock,
    fetchExpiring,
    fetchSurplus,
  };
}
