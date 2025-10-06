import { useCallback } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function useDashboardAPI() {
  // Fetch low stock ingredients with offline support
  const fetchLowStock = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/low-stock`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
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
      const response = await fetch(
        `${API_BASE_URL}/api/dashboard/expiring-ingredients`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error("Failed to fetch expiring ingredients:", error);
      // Always return empty array, never throw to prevent server crashes
      return [];
    }
  }, []);

  // Fetch surplus ingredients with offline support
  const fetchSurplus = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/dashboard/surplus-ingredients`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error("Failed to fetch surplus ingredients:", error);
      // Always return empty array for robust offline handling
      return [];
    }
  }, []);

  // Fetch expired ingredients with offline support
  const fetchExpired = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/dashboard/expired-ingredients`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error("Failed to fetch expired ingredients:", error);
      return [];
    }
  }, []);

  return {
    fetchLowStock,
    fetchExpiring,
    fetchSurplus,
    fetchExpired,
  };
}
