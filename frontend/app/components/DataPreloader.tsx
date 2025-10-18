"use client";

import { useEffect, useState } from "react";
import { useOffline } from "@/app/context/OfflineContext";
import { dbManager, STORES } from "@/app/utils/indexedDB";

/**
 * DataPreloader Component
 * Automatically pre-loads and caches all critical data when online
 * This ensures data is available for offline viewing
 */
export function DataPreloader() {
  const { isOnline } = useOffline();
  const [preloadStatus, setPreloadStatus] = useState<{
    loading: boolean;
    completed: boolean;
    progress: number;
  }>({ loading: false, completed: false, progress: 0 });

  useEffect(() => {
    console.log("📦 [DataPreloader] Component mounted", { isOnline, completed: preloadStatus.completed });

    // Only preload if online and not already completed
    if (!isOnline) {
      console.log("⚠️ [DataPreloader] Skipping - user is offline");
      return;
    }

    if (preloadStatus.completed) {
      console.log("✅ [DataPreloader] Already completed");
      return;
    }

    const preloadData = async () => {
      setPreloadStatus({ loading: true, completed: false, progress: 0 });
      console.log("🚀 [DataPreloader] Starting automatic data preload...");

      // Get user ID for notifications
      const userId = localStorage.getItem("user_id") || "";

      // All endpoints that ACTUALLY EXIST in your backend ✅
      const endpoints = [
        // Core data (array endpoints)
        { url: "/api/inventory", store: STORES.INVENTORY, name: "Inventory", type: "array" },
        { url: "/api/menu", store: STORES.MENU, name: "Menu", type: "array" },
        { url: "/api/suppliers", store: STORES.SUPPLIERS, name: "Suppliers", type: "array" },
        { url: "/api/users", store: STORES.USERS, name: "Users", type: "array" },

        // Dashboard inventory metrics (all from useDashboardQuery.ts)
        { url: "/api/dashboard/low-stock", store: STORES.CACHED_DATA, name: "Low Stock Items", type: "cached", cacheKey: "cached_low_stock" },
        { url: "/api/dashboard/expiring-ingredients", store: STORES.CACHED_DATA, name: "Expiring Ingredients", type: "cached", cacheKey: "cached_expiring" },
        { url: "/api/dashboard/out-of-stock", store: STORES.CACHED_DATA, name: "Out of Stock Items", type: "cached", cacheKey: "cached_out_of_stock" },
        { url: "/api/dashboard/surplus-ingredients", store: STORES.CACHED_DATA, name: "Surplus Ingredients", type: "cached", cacheKey: "cached_surplus" },
        { url: "/api/dashboard/expired-ingredients?skip=0&limit=50", store: STORES.CACHED_DATA, name: "Expired Ingredients", type: "cached", cacheKey: "cached_expired" },
        { url: "/api/dashboard/spoilage", store: STORES.CACHED_DATA, name: "Spoilage Data", type: "cached", cacheKey: "cached_spoilage" },

        // Custom holidays (from useDashboardQuery.ts)
        { url: "/api/custom-holidays", store: STORES.CACHED_DATA, name: "Custom Holidays", type: "cached", cacheKey: "cached_custom_holidays" },

        // Sales prediction & analytics (from useSalesPrediction.ts)
        { url: "/api/predict_top_sales?timeframe=daily&top_n=5", store: STORES.REPORTS, name: "Daily Sales Prediction", type: "report", reportId: "predict-top-sales-daily" },
        { url: "/api/predict_top_sales?timeframe=weekly&top_n=5", store: STORES.REPORTS, name: "Weekly Sales Prediction", type: "report", reportId: "predict-top-sales-weekly" },
        { url: "/api/historical_analysis?days=90", store: STORES.REPORTS, name: "Historical Analysis", type: "report", reportId: "historical-analysis-90" },

        // Sales reports (from backend sales_report.py) - Note: These may fail if order_items table is empty
        // Removed temporarily because they cause 500 errors when no sales data exists
        // Uncomment when you have sales data in order_items table:
        // { url: "/api/sales-summary", store: STORES.REPORTS, name: "Sales Summary", type: "report", reportId: "sales-summary" },
        // { url: "/api/sales-by-item", store: STORES.REPORTS, name: "Sales by Item", type: "report", reportId: "sales-by-item" },
        // { url: "/api/top-performers", store: STORES.REPORTS, name: "Top Performers", type: "report", reportId: "top-performers" },

        // User activity data
        { url: "/api/user-activity", store: STORES.CACHED_DATA, name: "User Activity", type: "cached", cacheKey: "user-activity" },

        // Notifications (if user is logged in)
        ...(userId ? [{ url: `/api/notifications?user_id=${userId}`, store: STORES.CACHED_DATA, name: "Notifications", type: "cached", cacheKey: "notifications" }] : []),
      ];

      let completed = 0;

      for (const endpoint of endpoints) {
        try {
          // Fetch data from API
          console.log(`📡 [DataPreloader] Fetching ${endpoint.name}...`);
          const response = await fetch(endpoint.url);

          if (!response.ok) {
            console.warn(
              `⚠️ [DataPreloader] Failed to fetch ${endpoint.name}: ${response.status}`
            );
            completed++;
            setPreloadStatus({
              loading: true,
              completed: false,
              progress: (completed / endpoints.length) * 100,
            });
            continue;
          }

          const data = await response.json();

          // Save to IndexedDB based on type
          if (endpoint.type === "array") {
            // Array data (inventory, menu, suppliers, users)
            if (Array.isArray(data) && data.length > 0) {
              const dataWithIds = data.map((item, index) => ({
                ...item,
                id: item.id || item._id || `temp-${Date.now()}-${index}`,
              }));

              await dbManager.bulkPut(endpoint.store, dataWithIds);
              console.log(
                `✅ [DataPreloader] Cached ${dataWithIds.length} ${endpoint.name} items`
              );
            } else {
              console.log(`⚠️ [DataPreloader] No ${endpoint.name} data to cache`);
            }
          } else if (endpoint.type === "report") {
            // Report data (inventory report, sales report, etc.)
            const reportItem = {
              id: (endpoint as any).reportId,
              type: (endpoint as any).reportId,
              data: data,
              generated_at: new Date().toISOString(),
            };
            await dbManager.put(endpoint.store, reportItem);
            console.log(`✅ [DataPreloader] Cached ${endpoint.name}`);
          } else if (endpoint.type === "cached") {
            // Cached data (dashboard stats, notifications)
            await dbManager.cacheData((endpoint as any).cacheKey, data, 24);
            console.log(`✅ [DataPreloader] Cached ${endpoint.name}`);
          }

          completed++;
          setPreloadStatus({
            loading: true,
            completed: false,
            progress: (completed / endpoints.length) * 100,
          });
        } catch (error) {
          console.error(
            `❌ [DataPreloader] Error loading ${endpoint.name}:`,
            error
          );
          completed++;
        }
      }

      setPreloadStatus({ loading: false, completed: true, progress: 100 });
      console.log("✅ [DataPreloader] Data preload complete!");

      // Get final stats
      const stats = await dbManager.getStats();
      console.log("📊 [DataPreloader] Offline storage stats:", stats);
    };

    // Start preloading after a short delay to not block initial render
    const timer = setTimeout(preloadData, 2000);

    return () => clearTimeout(timer);
  }, [isOnline, preloadStatus.completed]);

  // Don't render anything visible - this component works in the background
  return null;
}
