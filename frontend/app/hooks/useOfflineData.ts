/**
 * Custom hook for offline-first data fetching
 * Automatically caches API responses to IndexedDB for offline viewing
 */

import { useState, useEffect, useCallback } from "react";
import { useOffline } from "@/app/context/OfflineContext";
import { dbManager, STORES, StoreName } from "@/app/utils/indexedDB";

interface UseOfflineDataOptions {
  storeName: StoreName;
  endpoint: string;
  cacheKey?: string;
  cacheHours?: number;
  autoFetch?: boolean;
  dependencies?: any[];
}

interface UseOfflineDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  isFromCache: boolean;
  refetch: () => Promise<void>;
  clearCache: () => Promise<void>;
}

/**
 * Hook for offline-first data fetching
 *
 * Usage:
 * ```tsx
 * const { data, loading, error, isFromCache } = useOfflineData<InventoryItem[]>({
 *   storeName: STORES.INVENTORY,
 *   endpoint: '/api/inventory',
 *   cacheKey: 'all-inventory',
 *   autoFetch: true
 * });
 * ```
 */
export function useOfflineData<T = any>(
  options: UseOfflineDataOptions
): UseOfflineDataReturn<T> {
  const {
    storeName,
    endpoint,
    cacheKey = endpoint,
    cacheHours = 24,
    autoFetch = true,
    dependencies = [],
  } = options;

  const { isOnline } = useOffline();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // First, try to get data from IndexedDB (for instant offline support)
      const cachedData = await dbManager.getAll<T>(storeName);

      if (cachedData && (cachedData as any).length > 0) {
        console.log(`📦 [useOfflineData] Loaded ${(cachedData as any).length} items from IndexedDB for ${storeName}`);
        setData(cachedData as any);
        setIsFromCache(true);
        setLoading(false);
      }

      // If online, fetch fresh data from API
      if (isOnline) {
        try {
          console.log(`🌐 [useOfflineData] Fetching fresh data from ${endpoint}`);
          const response = await fetch(endpoint);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const freshData = await response.json();

          // Update state with fresh data
          setData(freshData);
          setIsFromCache(false);

          // Save to IndexedDB for offline use
          if (Array.isArray(freshData)) {
            await dbManager.bulkPut(storeName, freshData);
            console.log(`💾 [useOfflineData] Saved ${freshData.length} items to IndexedDB`);
          } else if (freshData) {
            await dbManager.put(storeName, freshData);
            console.log(`💾 [useOfflineData] Saved item to IndexedDB`);
          }

        } catch (fetchError) {
          console.error(`❌ [useOfflineData] Fetch failed:`, fetchError);

          // If fetch fails but we have cached data, use that
          if (cachedData && (cachedData as any).length > 0) {
            console.log(`📦 [useOfflineData] Using cached data after fetch failure`);
            setIsFromCache(true);
          } else {
            setError(fetchError as Error);
          }
        }
      } else {
        console.log(`📴 [useOfflineData] Offline - using cached data for ${storeName}`);

        // If offline and no cached data, set error
        if (!cachedData || (cachedData as any).length === 0) {
          setError(new Error("No cached data available offline"));
        }
      }
    } catch (err) {
      console.error(`❌ [useOfflineData] Error:`, err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [storeName, endpoint, isOnline, cacheKey]);

  const clearCache = useCallback(async () => {
    try {
      await dbManager.clear(storeName);
      setData(null);
      setIsFromCache(false);
      console.log(`🗑️ [useOfflineData] Cleared cache for ${storeName}`);
    } catch (err) {
      console.error(`❌ [useOfflineData] Error clearing cache:`, err);
    }
  }, [storeName]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, ...dependencies]);

  return {
    data,
    loading,
    error,
    isFromCache,
    refetch: fetchData,
    clearCache,
  };
}

/**
 * Hook for offline-first single item fetching
 */
export function useOfflineItem<T = any>(
  storeName: StoreName,
  itemId: string | number,
  endpoint?: string
): UseOfflineDataReturn<T> {
  const { isOnline } = useOffline();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);

  const fetchItem = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // First, try IndexedDB
      const cachedItem = await dbManager.getById<T>(storeName, itemId);

      if (cachedItem) {
        console.log(`📦 [useOfflineItem] Found item ${itemId} in IndexedDB`);
        setData(cachedItem);
        setIsFromCache(true);
        setLoading(false);
      }

      // If online and endpoint provided, fetch fresh data
      if (isOnline && endpoint) {
        try {
          const response = await fetch(endpoint);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const freshData = await response.json();
          setData(freshData);
          setIsFromCache(false);

          // Update IndexedDB
          await dbManager.put(storeName, freshData);
          console.log(`💾 [useOfflineItem] Updated item ${itemId} in IndexedDB`);

        } catch (fetchError) {
          console.error(`❌ [useOfflineItem] Fetch failed:`, fetchError);

          if (cachedItem) {
            setIsFromCache(true);
          } else {
            setError(fetchError as Error);
          }
        }
      } else if (!cachedItem) {
        setError(new Error("Item not found in cache"));
      }

    } catch (err) {
      console.error(`❌ [useOfflineItem] Error:`, err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [storeName, itemId, endpoint, isOnline]);

  const clearCache = useCallback(async () => {
    try {
      await dbManager.delete(storeName, itemId);
      setData(null);
      setIsFromCache(false);
    } catch (err) {
      console.error(`❌ [useOfflineItem] Error clearing item:`, err);
    }
  }, [storeName, itemId]);

  useEffect(() => {
    if (itemId) {
      fetchItem();
    }
  }, [itemId]);

  return {
    data,
    loading,
    error,
    isFromCache,
    refetch: fetchItem,
    clearCache,
  };
}

/**
 * Hook for getting offline database statistics
 */
export function useOfflineStats() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const dbStats = await dbManager.getStats();
        setStats(dbStats);
      } catch (error) {
        console.error("Error fetching offline stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading };
}
