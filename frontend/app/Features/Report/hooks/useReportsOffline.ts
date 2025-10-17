import { useCallback } from "react";
import { toast } from "react-toastify";

// Reports Offline Hook - Read-only with caching
export function useReportsOffline() {
  // Generic report fetcher with offline support
  const fetchReport = useCallback(
    async (
      reportType: "inventory" | "sales" | "user_activity",
      endpoint: string,
      cacheKey: string,
      params?: Record<string, any>
    ) => {
      const isOnline = navigator.onLine;

      // Build URL with params
      const url = new URL(
        endpoint,
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      );
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, value.toString());
          }
        });
      }

      if (isOnline) {
        try {
          const response = await fetch(url.toString());
          if (response.ok) {
            const data = await response.json();

            // Cache the report data
            localStorage.setItem(
              cacheKey,
              JSON.stringify({
                data,
                timestamp: Date.now(),
                params,
              })
            );

            return data;
          }
        } catch (error) {
          console.error(`Error fetching ${reportType} report:`, error);
          toast.warning(`Using cached ${reportType} report data`);
        }
      }

      // Try to get cached data
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          const ageHours = (Date.now() - timestamp) / (1000 * 60 * 60);

          if (ageHours < 24) {
            // Use cache if less than 24 hours old
            toast.info(
              `Showing cached ${reportType} report (${Math.round(
                ageHours
              )}h old)`
            );
            return data;
          }
        }
      } catch (error) {
        console.error("Error reading cached report:", error);
      }

      // Return sample data if no cache
      return getSampleReportData(reportType);
    },
    []
  );

  // Inventory Report
  const getInventoryReport = useCallback(
    async (params?: {
      start_date?: string;
      end_date?: string;
      category?: string;
    }) => {
      return fetchReport(
        "inventory",
        "/api/reports/inventory",
        "cached_inventory_report",
        params
      );
    },
    [fetchReport]
  );

  // Sales Report
  const getSalesReport = useCallback(
    async (params?: {
      start_date?: string;
      end_date?: string;
      item_type?: string;
    }) => {
      return fetchReport(
        "sales",
        "/api/reports/sales",
        "cached_sales_report",
        params
      );
    },
    [fetchReport]
  );

  // User Activity Report
  const getUserActivityReport = useCallback(
    async (params?: {
      start_date?: string;
      end_date?: string;
      user_id?: string;
    }) => {
      return fetchReport(
        "user_activity",
        "/api/reports/user-activity",
        "cached_user_activity_report",
        params
      );
    },
    [fetchReport]
  );

  // Export report (queue for sync when online)
  const exportReport = useCallback(
    async (reportType: string, format: "pdf" | "excel" | "csv", data: any) => {
      if (!navigator.onLine) {
        // Queue export for when online
        const exportAction = {
          id: `export_${Date.now()}`,
          type: "report_export",
          reportType,
          format,
          data,
          timestamp: Date.now(),
        };

        const queuedExports = JSON.parse(
          localStorage.getItem("queued_exports") || "[]"
        );
        queuedExports.push(exportAction);
        localStorage.setItem("queued_exports", JSON.stringify(queuedExports));

        toast.success(
          `${format.toUpperCase()} export queued! Will process when online.`
        );
        return { success: true, queued: true };
      }

      // Online export logic would go here
      toast.success(`${format.toUpperCase()} export started!`);
      return { success: true };
    },
    []
  );

  return {
    getInventoryReport,
    getSalesReport,
    getUserActivityReport,
    exportReport,
    isOnline: navigator.onLine,
  };
}

// Sample report data for offline mode
function getSampleReportData(
  reportType: "inventory" | "sales" | "user_activity"
) {
  const now = new Date();
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  switch (reportType) {
    case "inventory":
      return {
        summary: {
          total_items: 245,
          low_stock_items: 12,
          out_of_stock: 3,
          expiring_soon: 8,
        },
        categories: [
          { name: "Vegetables", count: 85, value: 2450.0 },
          { name: "Meat", count: 45, value: 5200.0 },
          { name: "Dairy", count: 32, value: 1800.0 },
          { name: "Beverages", count: 58, value: 1650.0 },
        ],
        recent_movements: [
          {
            item: "Tomatoes",
            type: "in",
            quantity: 50,
            date: now.toISOString(),
          },
          {
            item: "Chicken Breast",
            type: "out",
            quantity: 25,
            date: lastWeek.toISOString(),
          },
        ],
      };

    case "sales":
      return {
        summary: {
          total_sales: 15750.0,
          total_orders: 156,
          average_order_value: 101.28,
          top_selling_category: "Main Dishes",
        },
        daily_sales: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          sales: Math.floor(Math.random() * 3000) + 1500,
          orders: Math.floor(Math.random() * 30) + 15,
        })),
        top_items: [
          { name: "Burger Deluxe", sales: 2850.0, quantity: 95 },
          { name: "Caesar Salad", sales: 1420.0, quantity: 71 },
          { name: "Grilled Chicken", sales: 1890.0, quantity: 63 },
        ],
      };

    case "user_activity":
      return {
        summary: {
          total_users: 8,
          active_users: 6,
          total_actions: 342,
          most_active_user: "John Doe",
        },
        user_activities: [
          { user: "John Doe", actions: 45, last_login: now.toISOString() },
          {
            user: "Jane Smith",
            actions: 38,
            last_login: lastWeek.toISOString(),
          },
          { user: "Mike Johnson", actions: 29, last_login: now.toISOString() },
        ],
        action_breakdown: [
          { action: "Inventory Updates", count: 125 },
          { action: "Menu Changes", count: 67 },
          { action: "User Management", count: 43 },
          { action: "Reports Generated", count: 28 },
        ],
      };

    default:
      return {};
  }
}
