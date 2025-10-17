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
    // Only preload if online and not already completed
    if (!isOnline || preloadStatus.completed) return;

    const preloadData = async () => {
      setPreloadStatus({ loading: true, completed: false, progress: 0 });
      console.log("🚀 [DataPreloader] Starting automatic data preload...");

      const endpoints = [
        { url: "/api/inventory", store: STORES.INVENTORY, name: "Inventory" },
        { url: "/api/menu", store: STORES.MENU, name: "Menu" },
        { url: "/api/suppliers", store: STORES.SUPPLIERS, name: "Suppliers" },
        { url: "/api/users", store: STORES.USERS, name: "Users" },
      ];

      let completed = 0;

      for (const endpoint of endpoints) {
        try {
          // Check if data already exists in IndexedDB
          const existingData = await dbManager.getAll(endpoint.store);

          if (existingData && existingData.length > 0) {
            console.log(
              `✅ [DataPreloader] ${endpoint.name} already cached (${existingData.length} items)`
            );
            completed++;
            setPreloadStatus({
              loading: true,
              completed: false,
              progress: (completed / endpoints.length) * 100,
            });
            continue;
          }

          // Fetch data from API
          console.log(`📡 [DataPreloader] Fetching ${endpoint.name}...`);
          const response = await fetch(endpoint.url);

          if (!response.ok) {
            console.warn(
              `⚠️ [DataPreloader] Failed to fetch ${endpoint.name}: ${response.status}`
            );
            completed++;
            continue;
          }

          const data = await response.json();

          // Save to IndexedDB
          if (Array.isArray(data) && data.length > 0) {
            // Ensure each item has an ID
            const dataWithIds = data.map((item, index) => ({
              ...item,
              id: item.id || item._id || `temp-${Date.now()}-${index}`,
            }));

            await dbManager.bulkPut(endpoint.store, dataWithIds);
            console.log(
              `✅ [DataPreloader] Cached ${dataWithIds.length} ${endpoint.name} items`
            );
          } else if (data && !Array.isArray(data)) {
            // Ensure single item has an ID
            const itemWithId = {
              ...data,
              id: data.id || data._id || `temp-${Date.now()}`,
            };
            await dbManager.put(endpoint.store, itemWithId);
            console.log(`✅ [DataPreloader] Cached ${endpoint.name} data`);
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
