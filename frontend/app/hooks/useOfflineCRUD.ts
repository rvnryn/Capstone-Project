import { useCallback } from "react";
import { toast } from "react-toastify";
import { getToken } from "@/app/lib/auth";

export interface OfflineCRUDOptions {
  entityName: string; // 'users', 'inventory', 'menu', 'suppliers', etc.
  apiEndpoint: string; // '/api/users', '/api/inventory', etc.
  cacheKey: string; // 'cached_users', 'cached_inventory', etc.
}

export interface OfflineAction {
  id: string;
  entityName: string;
  operation: "CREATE" | "UPDATE" | "DELETE";
  endpoint: string;
  method: "POST" | "PUT" | "DELETE";
  payload: any;
  timestamp: number;
  status: "pending" | "synced" | "failed";
}

export function useOfflineCRUD(options: OfflineCRUDOptions) {
  const { entityName, apiEndpoint, cacheKey } = options;

  // Check if online
  const isOnline = () => navigator.onLine;

  // Get cached data
  const getCachedData = useCallback(() => {
    try {
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error(`Error reading cached ${entityName}:`, error);
      return [];
    }
  }, [cacheKey, entityName]);

  // Update cached data
  const updateCachedData = useCallback(
    (data: any[]) => {
      try {
        localStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (error) {
        console.error(`Error updating cached ${entityName}:`, error);
      }
    },
    [cacheKey, entityName]
  );

  // Add offline action to queue
  const queueOfflineAction = useCallback(
    (action: Omit<OfflineAction, "id" | "timestamp" | "status">) => {
      const offlineAction: OfflineAction = {
        ...action,
        id: `${entityName}_${Date.now()}_${Math.random()}`,
        timestamp: Date.now(),
        status: "pending",
      };

      try {
        const existingActions = JSON.parse(
          localStorage.getItem("offline_actions") || "[]"
        );
        existingActions.push(offlineAction);
        localStorage.setItem(
          "offline_actions",
          JSON.stringify(existingActions)
        );
        console.log(
          `[Offline] Queued ${action.operation} for ${entityName}:`,
          offlineAction.id
        );
      } catch (error) {
        console.error("Error queueing offline action:", error);
      }

      return offlineAction.id;
    },
    [entityName]
  );

  // Generic API call with offline support
  const apiCall = useCallback(
    async (
      endpoint: string,
      method: "GET" | "POST" | "PUT" | "DELETE",
      payload?: any
    ) => {
      const token = await getToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const config: RequestInit = {
        method,
        headers,
      };

      if (payload && (method === "POST" || method === "PUT")) {
        config.body = JSON.stringify(payload);
      }

      const response = await fetch(endpoint, config);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
    []
  );

  // CREATE operation with offline support
  const createItem = useCallback(
    async (itemData: any) => {
      if (isOnline()) {
        try {
          const result = await apiCall(apiEndpoint, "POST", itemData);

          // Update cache with new item
          const cached = getCachedData();
          cached.push(result);
          updateCachedData(cached);

          toast.success(`${entityName} created successfully!`);
          return result;
        } catch (error) {
          console.error(`Error creating ${entityName}:`, error);
          toast.error(`Failed to create ${entityName}. Saving offline...`);
          // Fall through to offline handling
        }
      }

      // Offline handling
      const tempId = `temp_${Date.now()}`;
      const newItem = {
        ...itemData,
        id: tempId,
        created_at: new Date().toISOString(),
        status: "pending_sync",
        offline_created: true,
      };

      // Add to cache
      const cached = getCachedData();
      cached.push(newItem);
      updateCachedData(cached);

      // Queue for sync
      queueOfflineAction({
        entityName,
        operation: "CREATE",
        endpoint: apiEndpoint,
        method: "POST",
        payload: itemData,
      });

      toast.success(`${entityName} created offline! Will sync when online.`);
      return newItem;
    },
    [
      isOnline,
      apiCall,
      apiEndpoint,
      entityName,
      getCachedData,
      updateCachedData,
      queueOfflineAction,
    ]
  );

  // READ operation with offline support
  const readItems = useCallback(async () => {
    if (isOnline()) {
      try {
        const result = await apiCall(apiEndpoint, "GET");

        // Update cache
        updateCachedData(result);

        return result;
      } catch (error) {
        console.error(`Error fetching ${entityName}:`, error);
        toast.warning(`Using cached ${entityName} data (offline)`);
      }
    }

    // Return cached data
    const cached = getCachedData();
    if (cached.length === 0) {
      // Return sample data if no cache
      return getSampleData();
    }
    return cached;
  }, [
    isOnline,
    apiCall,
    apiEndpoint,
    entityName,
    getCachedData,
    updateCachedData,
  ]);

  // UPDATE operation with offline support
  const updateItem = useCallback(
    async (itemId: string | number, updateData: any) => {
      if (isOnline()) {
        try {
          const result = await apiCall(
            `${apiEndpoint}/${itemId}`,
            "PUT",
            updateData
          );

          // Update cache
          const cached = getCachedData();
          const updatedCache = cached.map((item: any) =>
            item.id === itemId ? { ...item, ...result } : item
          );
          updateCachedData(updatedCache);

          toast.success(`${entityName} updated successfully!`);
          return result;
        } catch (error) {
          console.error(`Error updating ${entityName}:`, error);
          toast.error(`Failed to update ${entityName}. Saving offline...`);
          // Fall through to offline handling
        }
      }

      // Offline handling
      const cached = getCachedData();
      const updatedCache = cached.map((item: any) =>
        item.id === itemId
          ? {
              ...item,
              ...updateData,
              updated_at: new Date().toISOString(),
              status: "pending_sync",
              offline_updated: true,
            }
          : item
      );
      updateCachedData(updatedCache);

      // Queue for sync
      queueOfflineAction({
        entityName,
        operation: "UPDATE",
        endpoint: `${apiEndpoint}/${itemId}`,
        method: "PUT",
        payload: { id: itemId, ...updateData },
      });

      toast.success(`${entityName} updated offline! Will sync when online.`);
      return { id: itemId, ...updateData, status: "pending_sync" };
    },
    [
      isOnline,
      apiCall,
      apiEndpoint,
      entityName,
      getCachedData,
      updateCachedData,
      queueOfflineAction,
    ]
  );

  // DELETE operation with offline support
  const deleteItem = useCallback(
    async (itemId: string | number) => {
      if (isOnline()) {
        try {
          await apiCall(`${apiEndpoint}/${itemId}`, "DELETE");

          // Remove from cache
          const cached = getCachedData();
          const updatedCache = cached.filter((item: any) => item.id !== itemId);
          updateCachedData(updatedCache);

          toast.success(`${entityName} deleted successfully!`);
          return { success: true };
        } catch (error) {
          console.error(`Error deleting ${entityName}:`, error);
          toast.error(
            `Failed to delete ${entityName}. Marking for deletion...`
          );
          // Fall through to offline handling
        }
      }

      // Offline handling - mark for deletion
      const cached = getCachedData();
      const updatedCache = cached.map((item: any) =>
        item.id === itemId
          ? {
              ...item,
              status: "pending_delete",
              deleted_at: new Date().toISOString(),
              offline_deleted: true,
            }
          : item
      );
      updateCachedData(updatedCache);

      // Queue for sync
      queueOfflineAction({
        entityName,
        operation: "DELETE",
        endpoint: `${apiEndpoint}/${itemId}`,
        method: "DELETE",
        payload: { id: itemId },
      });

      toast.success(
        `${entityName} marked for deletion! Will sync when online.`
      );
      return { success: true, offline: true };
    },
    [
      isOnline,
      apiCall,
      apiEndpoint,
      entityName,
      getCachedData,
      updateCachedData,
      queueOfflineAction,
    ]
  );

  // Get sample data for different entities
  const getSampleData = useCallback(() => {
    const sampleData: Record<string, any[]> = {
      users: [
        {
          id: "sample_1",
          name: "John Doe",
          email: "john@example.com",
          role: "admin",
          status: "active",
        },
        {
          id: "sample_2",
          name: "Jane Smith",
          email: "jane@example.com",
          role: "manager",
          status: "active",
        },
      ],
      inventory: [
        {
          id: "sample_1",
          name: "Tomatoes",
          quantity: 50,
          unit: "kg",
          category: "vegetables",
        },
        {
          id: "sample_2",
          name: "Chicken Breast",
          quantity: 25,
          unit: "kg",
          category: "meat",
        },
      ],
      menu: [
        {
          id: "sample_1",
          name: "Burger Deluxe",
          price: 12.99,
          category: "main",
          available: true,
        },
        {
          id: "sample_2",
          name: "Caesar Salad",
          price: 8.99,
          category: "salad",
          available: true,
        },
      ],
      suppliers: [
        {
          id: "sample_1",
          name: "Fresh Foods Co.",
          contact: "john@freshfoods.com",
          category: "produce",
        },
        {
          id: "sample_2",
          name: "Meat Masters",
          contact: "orders@meatmasters.com",
          category: "meat",
        },
      ],
    };

    return sampleData[entityName] || [];
  }, [entityName]);

  // Get pending sync count
  const getPendingSyncCount = useCallback(() => {
    try {
      const actions = JSON.parse(
        localStorage.getItem("offline_actions") || "[]"
      );
      return actions.filter(
        (action: OfflineAction) =>
          action.entityName === entityName && action.status === "pending"
      ).length;
    } catch (error) {
      return 0;
    }
  }, [entityName]);

  return {
    createItem,
    readItems,
    updateItem,
    deleteItem,
    getCachedData,
    isOnline: isOnline(),
    getPendingSyncCount,
  };
}

// Hook for background sync management
export function useOfflineSync() {
  const syncPendingActions = useCallback(async () => {
    if (!navigator.onLine) {
      console.log("[Sync] Still offline, skipping sync");
      return;
    }

    try {
      const actions: OfflineAction[] = JSON.parse(
        localStorage.getItem("offline_actions") || "[]"
      );
      const pendingActions = actions.filter(
        (action) => action.status === "pending"
      );

      if (pendingActions.length === 0) {
        console.log("[Sync] No pending actions to sync");
        return;
      }

      console.log(`[Sync] Syncing ${pendingActions.length} pending actions`);
      let syncedCount = 0;
      let failedCount = 0;

      for (const action of pendingActions) {
        try {
          const token = await getToken();
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          };

          if (token) {
            headers["Authorization"] = `Bearer ${token}`;
          }

          const config: RequestInit = {
            method: action.method,
            headers,
          };

          if (
            action.payload &&
            (action.method === "POST" || action.method === "PUT")
          ) {
            config.body = JSON.stringify(action.payload);
          }

          const response = await fetch(action.endpoint, config);

          if (response.ok) {
            // Mark as synced
            action.status = "synced";
            syncedCount++;
            console.log(`[Sync] Successfully synced: ${action.id}`);
          } else {
            action.status = "failed";
            failedCount++;
            console.error(
              `[Sync] Failed to sync: ${action.id}`,
              response.status
            );
          }
        } catch (error) {
          action.status = "failed";
          failedCount++;
          console.error(`[Sync] Error syncing: ${action.id}`, error);
        }
      }

      // Update actions in storage
      localStorage.setItem("offline_actions", JSON.stringify(actions));

      // Show sync results
      if (syncedCount > 0) {
        toast.success(`Synced ${syncedCount} offline changes!`);
      }
      if (failedCount > 0) {
        toast.warning(
          `Failed to sync ${failedCount} changes. Will retry later.`
        );
      }
    } catch (error) {
      console.error("[Sync] Error during sync process:", error);
    }
  }, []);

  return { syncPendingActions };
}
