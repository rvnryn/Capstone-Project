"use client";

import { useEffect, useState } from "react";
import { useOffline } from "@/app/context/OfflineContext";

/**
 * PagePreloader Component
 * Automatically fetches and caches ALL pages for offline access
 * Works in the background without blocking UI
 */
export function PagePreloader() {
  const { isOnline } = useOffline();
  const [preloadStatus, setPreloadStatus] = useState<{
    loading: boolean;
    completed: boolean;
    progress: number;
  }>({ loading: false, completed: false, progress: 0 });

  useEffect(() => {
    console.log("📄 [PagePreloader] Component mounted", { isOnline, completed: preloadStatus.completed });

    // Only preload if online and not already completed
    if (!isOnline) {
      console.log("⚠️ [PagePreloader] Skipping - user is offline");
      return;
    }

    if (preloadStatus.completed) {
      console.log("✅ [PagePreloader] Already completed");
      return;
    }

    const preloadPages = async () => {
      setPreloadStatus({ loading: true, completed: false, progress: 0 });
      console.log("🚀 [PagePreloader] Starting automatic page preload...");

      // Get the current origin (e.g., http://localhost:3000)
      const origin = window.location.origin;

      // All pages that need to be cached for offline access (based on actual app structure)
      const pages = [
        // Main pages
        "/",
        "/privacy-policy",
        "/pwa-debug",

        // Dashboard
        "/Features/Dashboard",

        // Inventory module (all pages)
        "/Features/Inventory",
        "/Features/Inventory/Master_Inventory",
        "/Features/Inventory/Master_Inventory/View_Inventory",
        "/Features/Inventory/Master_Inventory/Add_Inventory",
        "/Features/Inventory/Master_Inventory/Update_Inventory",
        "/Features/Inventory/Today_Inventory",
        "/Features/Inventory/Today_Inventory/View_Today_Inventory",
        "/Features/Inventory/Today_Inventory/Update_Today_Inventory",
        "/Features/Inventory/Surplus_Inventory",
        "/Features/Inventory/Surplus_Inventory/View_Surplus_Inventory",
        "/Features/Inventory/Spoilage_Inventory",
        "/Features/Inventory/Spoilage_Inventory/View_Spoilage_Inventory",

        // Menu module (all pages)
        "/Features/Menu",
        "/Features/Menu/View_Menu",
        "/Features/Menu/Add_Menu",
        "/Features/Menu/Update_Menu",

        // Supplier module (all pages)
        "/Features/Supplier",
        "/Features/Supplier/View_Supplier",
        "/Features/Supplier/Add_Supplier",
        "/Features/Supplier/Update_Supplier",

        // Reports module (all pages)
        "/Features/Report",
        "/Features/Report/Report_Inventory",
        "/Features/Report/Report_Sales",
        "/Features/Report/Report_UserActivity",

        // Settings module (all pages)
        "/Features/Settings",
        "/Features/Settings/userManagement",
        "/Features/Settings/userManagement/View_Users",
        "/Features/Settings/userManagement/Add_Users",
        "/Features/Settings/userManagement/Update_Users",
        "/Features/Settings/inventory",
        "/Features/Settings/notification",
        "/Features/Settings/backup_restore",
      ];

      let completed = 0;
      let successful = 0;
      const total = pages.length;

      console.log(`📄 [PagePreloader] Fetching ${total} pages from ${origin}...`);

      for (const page of pages) {
        try {
          // Use full URL with origin
          const fullUrl = `${origin}${page}`;

          // Fetch the page to trigger service worker caching
          const response = await fetch(fullUrl, {
            method: "GET",
            headers: {
              "Accept": "text/html",
            },
            mode: "same-origin",
            credentials: "include",
          });

          if (response.ok) {
            console.log(`✅ [PagePreloader] Cached: ${page}`);
            successful++;
          } else {
            console.warn(`⚠️ [PagePreloader] Failed to cache: ${page} (${response.status})`);
          }

          completed++;
          setPreloadStatus({
            loading: true,
            completed: false,
            progress: (completed / total) * 100,
          });
        } catch (error) {
          console.error(`❌ [PagePreloader] Error caching ${page}:`, error);
          completed++;
        }

        // Small delay to avoid overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      setPreloadStatus({ loading: false, completed: true, progress: 100 });
      console.log(`✅ [PagePreloader] Page preload complete! Successfully cached ${successful}/${total} pages`);
    };

    // Start preloading after data preloader finishes (delay to avoid conflict)
    const timer = setTimeout(preloadPages, 5000);

    return () => clearTimeout(timer);
  }, [isOnline, preloadStatus.completed]);

  // Don't render anything visible - this component works in the background
  return null;
}
