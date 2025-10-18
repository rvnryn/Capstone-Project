import { useCallback, useEffect } from "react";
import { useOfflineSync } from "@/app/hooks/useOfflineCRUD";
import { toast } from "react-toastify";

export function useGlobalOfflineSync() {
  const { syncPendingActions } = useOfflineSync();

  // Get total pending actions across all modules
  const getTotalPendingActions = useCallback(() => {
    try {
      const actions = JSON.parse(
        localStorage.getItem("offline_actions") || "[]"
      );
      return actions.filter((action: any) => action.status === "pending")
        .length;
    } catch {
      return 0;
    }
  }, []);

  // Sync all pending actions
  const syncAll = useCallback(async () => {
    if (!navigator.onLine) {
      toast.warning("Cannot sync while offline");
      return;
    }

    const pendingCount = getTotalPendingActions();
    if (pendingCount === 0) {
      toast.info("No pending changes to sync");
      return;
    }

    toast.info(`Syncing ${pendingCount} pending changes...`);
    await syncPendingActions();
  }, [syncPendingActions, getTotalPendingActions]);

  // Auto-sync when coming back online
  useEffect(() => {
    const handleOnline = () => {
      const pendingCount = getTotalPendingActions();
      if (pendingCount > 0) {
        setTimeout(() => {
          toast.info(`Back online! Syncing ${pendingCount} pending changes...`);
          syncPendingActions();
        }, 2000); // Wait 2 seconds after coming online
      }
    };

    const handleOffline = () => {
      toast.warning(
        "You are now offline. Changes will be saved locally and synced when back online."
      );
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncPendingActions, getTotalPendingActions]);

  // Clear synced actions (cleanup)
  const clearSyncedActions = useCallback(() => {
    try {
      const actions = JSON.parse(
        localStorage.getItem("offline_actions") || "[]"
      );
      const pendingActions = actions.filter(
        (action: any) => action.status === "pending"
      );
      localStorage.setItem("offline_actions", JSON.stringify(pendingActions));

      // Also clear old cached data (older than 7 days)
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      [
        "cached_users",
        "cached_inventory",
        "cached_menu",
        "cached_suppliers",
        "cached_master_inventory",
        "cached_today_inventory",
        "cached_surplus_inventory",
        "cached_spoilage_inventory",
        "cached_notification_settings",
      ].forEach((key) => {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const data = JSON.parse(cached);
            if (Array.isArray(data)) {
              const freshData = data.filter((item: any) => {
                const timestamp = new Date(
                  item.created_at || item.updated_at || Date.now()
                ).getTime();
                return timestamp > weekAgo;
              });
              localStorage.setItem(key, JSON.stringify(freshData));
            }
          }
        } catch (error) {
          console.error(`Error cleaning cache for ${key}:`, error);
        }
      });
    } catch (error) {
      console.error("Error clearing synced actions:", error);
    }
  }, []);

  // Get sync status for all modules
  const getSyncStatus = useCallback(() => {
    try {
      const actions = JSON.parse(
        localStorage.getItem("offline_actions") || "[]"
      );
      const moduleStats: Record<
        string,
        { pending: number; synced: number; failed: number }
      > = {};

      actions.forEach((action: any) => {
        const entityName = action.entityName;
        if (!moduleStats[entityName]) {
          moduleStats[entityName] = { pending: 0, synced: 0, failed: 0 };
        }
        moduleStats[entityName][action.status as "pending" | "synced" | "failed"]++;
      });

      return moduleStats;
    } catch {
      return {};
    }
  }, []);

  return {
    syncAll,
    getTotalPendingActions,
    clearSyncedActions,
    getSyncStatus,
    isOnline: navigator.onLine,
  };
}
