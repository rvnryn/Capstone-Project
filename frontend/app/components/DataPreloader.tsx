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

    // Only run once on first login or app load
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
        { url: "/api/inventory", store: STORES.INVENTORY, name: "Inventory", type: "array" },
        { url: "/api/menu", store: STORES.MENU, name: "Menu", type: "array" },
        { url: "/api/suppliers", store: STORES.SUPPLIERS, name: "Suppliers", type: "array" },
        { url: "/api/users", store: STORES.USERS, name: "Users", type: "array" },
        { url: "/api/dashboard/low-stock", store: STORES.CACHED_DATA, name: "Low Stock Items", type: "cached", cacheKey: "cached_low_stock" },
        { url: "/api/dashboard/expiring-ingredients", store: STORES.CACHED_DATA, name: "Expiring Ingredients", type: "cached", cacheKey: "cached_expiring" },
        { url: "/api/dashboard/out-of-stock", store: STORES.CACHED_DATA, name: "Out of Stock Items", type: "cached", cacheKey: "cached_out_of_stock" },
        { url: "/api/dashboard/surplus-ingredients", store: STORES.CACHED_DATA, name: "Surplus Ingredients", type: "cached", cacheKey: "cached_surplus" },
        { url: "/api/dashboard/expired-ingredients?skip=0&limit=50", store: STORES.CACHED_DATA, name: "Expired Ingredients", type: "cached", cacheKey: "cached_expired" },
        { url: "/api/dashboard/spoilage", store: STORES.CACHED_DATA, name: "Spoilage Data", type: "cached", cacheKey: "cached_spoilage" },
        { url: "/api/custom-holidays", store: STORES.CACHED_DATA, name: "Custom Holidays", type: "cached", cacheKey: "cached_custom_holidays" },
        { url: "/api/predict_top_sales?timeframe=daily&top_n=5", store: STORES.REPORTS, name: "Daily Sales Prediction", type: "report", reportId: "predict-top-sales-daily" },
        { url: "/api/predict_top_sales?timeframe=weekly&top_n=5", store: STORES.REPORTS, name: "Weekly Sales Prediction", type: "report", reportId: "predict-top-sales-weekly" },
        { url: "/api/historical_analysis?days=90", store: STORES.REPORTS, name: "Historical Analysis", type: "report", reportId: "historical-analysis-90" },
        { url: "/api/user-activity", store: STORES.CACHED_DATA, name: "User Activity", type: "cached", cacheKey: "user-activity" },
        ...(userId ? [{ url: `/api/notifications?user_id=${userId}`, store: STORES.CACHED_DATA, name: "Notifications", type: "cached", cacheKey: "notifications" }] : []),
      ];

      let completed = 0;

      for (const endpoint of endpoints) {
        try {
          let data;
          if (isOnline) {
            // Fetch data from API with timeout
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

              const response = await fetch(endpoint.url, {
                signal: controller.signal
              });
              clearTimeout(timeoutId);

              if (!response.ok) {
                console.warn(`⚠️ [DataPreloader] Failed to fetch ${endpoint.name}: ${response.status}`);
                completed++;
                setPreloadStatus({ loading: true, completed: false, progress: (completed / endpoints.length) * 100 });
                continue;
              }
              data = await response.json();
            } catch (fetchError) {
              console.warn(`⚠️ [DataPreloader] Network error fetching ${endpoint.name}, will try cache`);
              // If fetch failed, try loading from cache
            }
          }

          // If we don't have data (either offline or fetch failed), try loading from IndexedDB
          if (!data) {
            if (endpoint.type === "array") {
              data = await dbManager.getAll(endpoint.store);
            } else if (endpoint.type === "report") {
              if (endpoint.reportId) {
                data = await dbManager.getById(endpoint.store, endpoint.reportId);
              }
            } else if (endpoint.type === "cached") {
              if (endpoint.cacheKey) {
                data = await dbManager.getCachedData(endpoint.cacheKey);
              }
            }
          }

          // Save to IndexedDB based on type (only if online)
          if (isOnline && data) {
            if (endpoint.type === "array") {
              if (Array.isArray(data) && data.length > 0) {
                const dataWithIds = data.map((item, index) => ({
                  ...item,
                  id: item.id || item._id || `temp-${Date.now()}-${index}`,
                }));
                await dbManager.bulkPut(endpoint.store, dataWithIds);
                console.log(`✅ [DataPreloader] Cached ${dataWithIds.length} ${endpoint.name} items`);
              } else {
                console.log(`⚠️ [DataPreloader] No ${endpoint.name} data to cache`);
              }
            } else if (endpoint.type === "report") {
              if (endpoint.reportId) {
                const reportItem = {
                  id: endpoint.reportId,
                  type: endpoint.reportId,
                  data: data,
                  generated_at: new Date().toISOString(),
                };
                await dbManager.put(endpoint.store, reportItem);
                console.log(`✅ [DataPreloader] Cached ${endpoint.name}`);
              } else {
                console.warn(`⚠️ [DataPreloader] No reportId for ${endpoint.name}`);
              }
            } else if (endpoint.type === "cached") {
              if (endpoint.cacheKey) {
                await dbManager.cacheData(endpoint.cacheKey, data, 24);
                console.log(`✅ [DataPreloader] Cached ${endpoint.name}`);
              } else {
                console.warn(`⚠️ [DataPreloader] No cacheKey for ${endpoint.name}`);
              }
            }
          }

          completed++;
          setPreloadStatus({ loading: true, completed: false, progress: (completed / endpoints.length) * 100 });
        } catch (error) {
          console.error(`❌ [DataPreloader] Error loading ${endpoint.name}:`, error);
          completed++;
        }
      }

      setPreloadStatus({ loading: false, completed: true, progress: 100 });
      console.log("✅ [DataPreloader] Data preload complete!");

      const stats = await dbManager.getStats();
      console.log("📊 [DataPreloader] Offline storage stats:", stats);
    };

    const timer = setTimeout(preloadData, 2000);
    return () => clearTimeout(timer);
  }, [isOnline, preloadStatus.completed]);

  // Don't render anything visible - this component works in the background
  return null;
}
