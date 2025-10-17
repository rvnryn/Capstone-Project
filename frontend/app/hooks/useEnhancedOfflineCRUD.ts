/**
 * Enhanced Offline CRUD Hook
 * Universal hook for offline-first data management
 */

import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { OfflineStorage } from "../utils/offlineStorage";
import { StoreName } from "../utils/indexedDB";
import { syncManager } from "../utils/offlineSync";

export interface UseOfflineCRUDOptions {
  storeName: StoreName;
  apiEndpoint: string;
  autoLoad?: boolean;
  enableToasts?: boolean;
}

export function useEnhancedOfflineCRUD<T extends { id: string | number }>(
  options: UseOfflineCRUDOptions
) {
  const { storeName, apiEndpoint, autoLoad = true, enableToasts = true } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  const storage = new OfflineStorage<T>(storeName, apiEndpoint);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Update pending sync count
  const updatePendingCount = useCallback(async () => {
    const count = await storage.getPendingSyncCount();
    setPendingSyncCount(count);
  }, [storage]);

  // Load all data
  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const items = await storage.getAll();
      setData(items);
      await updatePendingCount();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load data";
      setError(message);
      if (enableToasts) {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  }, [storage, enableToasts, updatePendingCount]);

  // Create item
  const create = useCallback(
    async (item: Omit<T, "id">): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const newItem = await storage.create(item);
        setData((prev) => [...prev, newItem]);
        await updatePendingCount();

        if (enableToasts) {
          if (isOnline) {
            toast.success("✅ Item created successfully!");
          } else {
            toast.info("📝 Item created offline. Will sync when online.");
          }
        }

        return newItem;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create item";
        setError(message);
        if (enableToasts) {
          toast.error(message);
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [storage, isOnline, enableToasts, updatePendingCount]
  );

  // Update item
  const update = useCallback(
    async (id: string | number, updates: Partial<T>): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const updatedItem = await storage.update(id, updates);
        setData((prev) =>
          prev.map((item) => (item.id === id ? updatedItem : item))
        );
        await updatePendingCount();

        if (enableToasts) {
          if (isOnline) {
            toast.success("✅ Item updated successfully!");
          } else {
            toast.info("📝 Item updated offline. Will sync when online.");
          }
        }

        return updatedItem;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update item";
        setError(message);
        if (enableToasts) {
          toast.error(message);
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [storage, isOnline, enableToasts, updatePendingCount]
  );

  // Delete item
  const remove = useCallback(
    async (id: string | number): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const success = await storage.delete(id);
        if (success) {
          setData((prev) => prev.filter((item) => item.id !== id));
          await updatePendingCount();

          if (enableToasts) {
            if (isOnline) {
              toast.success("✅ Item deleted successfully!");
            } else {
              toast.info("📝 Item deleted offline. Will sync when online.");
            }
          }
        }
        return success;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete item";
        setError(message);
        if (enableToasts) {
          toast.error(message);
        }
        return false;
      } finally {
        setLoading(false);
      }
    },
    [storage, isOnline, enableToasts, updatePendingCount]
  );

  // Get single item by ID
  const getById = useCallback(
    async (id: string | number): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const item = await storage.getById(id);
        return item || null;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to get item";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [storage]
  );

  // Search/filter items
  const search = useCallback(
    async (predicate: (item: T) => boolean): Promise<T[]> => {
      setLoading(true);
      setError(null);

      try {
        const results = await storage.search(predicate);
        return results;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to search";
        setError(message);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [storage]
  );

  // Sync pending changes
  const sync = useCallback(async () => {
    if (!isOnline) {
      if (enableToasts) {
        toast.warning("⚠️ Cannot sync while offline");
      }
      return false;
    }

    setLoading(true);

    try {
      const result = await syncManager.syncAllActions();

      if (result.success) {
        // Reload data after successful sync
        await loadAll();
        return true;
      }

      return false;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sync failed";
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isOnline, enableToasts, loadAll]);

  // Auto-load data on mount
  useEffect(() => {
    if (autoLoad) {
      loadAll();
    }
  }, [autoLoad, loadAll]);

  // Listen for sync completion
  useEffect(() => {
    const handleSyncComplete = async () => {
      await loadAll();
      await updatePendingCount();
    };

    syncManager.addSyncListener(handleSyncComplete);

    return () => {
      syncManager.removeSyncListener(handleSyncComplete);
    };
  }, [loadAll, updatePendingCount]);

  return {
    // Data
    data,
    loading,
    error,
    isOnline,
    pendingSyncCount,

    // Methods
    create,
    update,
    remove,
    getById,
    search,
    loadAll,
    sync,

    // Utilities
    refresh: loadAll,
  };
}

// Convenience hooks for specific entities
export const useMenuOffline = () =>
  useEnhancedOfflineCRUD({
    storeName: "menu" as StoreName,
    apiEndpoint: "/api/menu",
  });

export const useInventoryOffline = () =>
  useEnhancedOfflineCRUD({
    storeName: "inventory" as StoreName,
    apiEndpoint: "/api/inventory",
  });

export const useSuppliersOffline = () =>
  useEnhancedOfflineCRUD({
    storeName: "suppliers" as StoreName,
    apiEndpoint: "/api/suppliers",
  });

export const useUsersOffline = () =>
  useEnhancedOfflineCRUD({
    storeName: "users" as StoreName,
    apiEndpoint: "/api/users",
  });
