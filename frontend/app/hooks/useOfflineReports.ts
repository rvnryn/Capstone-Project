/**
 * Offline Reports Hook
 * Provides caching for read-only report data with automatic offline support
 */

import { useState, useEffect, useCallback } from "react";
import { dbManager, STORES } from "../utils/indexedDB";
import { toast } from "react-toastify";

export interface UseOfflineReportOptions {
  reportType: "sales" | "inventory" | "user_activity";
  cacheKey: string;
  cacheDuration?: number; // in milliseconds (default: 1 hour)
  enableToasts?: boolean;
}

export interface OfflineReportData<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
  isFromCache: boolean;
  lastFetched: number | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for offline report data caching
 * Reports are read-only, so we just cache and display
 */
export function useOfflineReport<T = any>(
  fetchFunction: () => Promise<T>,
  options: UseOfflineReportOptions
): OfflineReportData<T> {
  const {
    reportType,
    cacheKey,
    cacheDuration = 60 * 60 * 1000, // 1 hour default
    enableToasts = true,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  // Load data from cache or API
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to get from cache first
      const cached = await dbManager.getCachedData(cacheKey);

      if (cached && cached.data) {
        const age = Date.now() - cached.timestamp;
        const isExpired = age > cacheDuration;

        // Use cache if valid or if offline
        if (!isExpired || !isOnline) {
          setData(cached.data);
          setIsFromCache(true);
          setLastFetched(cached.timestamp);
          setLoading(false);

          if (enableToasts && !isOnline) {
            toast.info(`📊 Viewing cached ${reportType} report (offline mode)`);
          }

          // If online and cache is old, refresh in background
          if (isOnline && isExpired) {
            fetchAndCache();
          }

          return;
        }
      }

      // No valid cache and online - fetch from API
      if (isOnline) {
        await fetchAndCache();
      } else {
        // Offline with no cache
        setError("No cached data available offline");
        setData(null);
        setIsFromCache(false);

        if (enableToasts) {
          toast.warning("⚠️ No cached report data available offline");
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load data";
      setError(message);

      if (enableToasts) {
        toast.error(`Failed to load ${reportType} report`);
      }
    } finally {
      setLoading(false);
    }
  }, [cacheKey, cacheDuration, isOnline, reportType, enableToasts]);

  // Fetch from API and cache
  const fetchAndCache = useCallback(async () => {
    try {
      const freshData = await fetchFunction();
      const timestamp = Date.now();

      // Cache the data
      await dbManager.cacheData(cacheKey, freshData, cacheDuration / (60 * 60 * 1000)); // Convert ms to hours

      setData(freshData);
      setIsFromCache(false);
      setLastFetched(timestamp);
      setError(null);

      if (enableToasts) {
        toast.success(`✅ ${reportType} report loaded`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch data";
      setError(message);
      throw err;
    }
  }, [fetchFunction, cacheKey, cacheDuration, reportType, enableToasts]);

  // Refetch function
  const refetch = useCallback(async () => {
    if (!isOnline) {
      if (enableToasts) {
        toast.warning("⚠️ Cannot refresh while offline");
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await fetchAndCache();
    } catch (err) {
      console.error("Refetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [isOnline, fetchAndCache, enableToasts]);

  // Auto-load on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refetch when coming back online
  useEffect(() => {
    if (isOnline && isFromCache) {
      // Give it a second before refreshing
      const timer = setTimeout(() => {
        refetch();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isOnline, isFromCache, refetch]);

  return {
    data,
    loading,
    error,
    isFromCache,
    lastFetched,
    refetch,
  };
}

/**
 * Pre-configured hooks for specific report types
 */

export const useSalesReportOffline = <T = any>(
  fetchFunction: () => Promise<T>,
  cacheKey: string = "sales_report"
) =>
  useOfflineReport(fetchFunction, {
    reportType: "sales",
    cacheKey,
    cacheDuration: 30 * 60 * 1000, // 30 minutes
  });

export const useInventoryReportOffline = <T = any>(
  fetchFunction: () => Promise<T>,
  cacheKey: string = "inventory_report"
) =>
  useOfflineReport(fetchFunction, {
    reportType: "inventory",
    cacheKey,
    cacheDuration: 60 * 60 * 1000, // 1 hour
  });

export const useUserActivityReportOffline = <T = any>(
  fetchFunction: () => Promise<T>,
  cacheKey: string = "user_activity_report"
) =>
  useOfflineReport(fetchFunction, {
    reportType: "user_activity",
    cacheKey,
    cacheDuration: 15 * 60 * 1000, // 15 minutes (more frequent for activity logs)
  });

/**
 * Utility to clear all report caches
 */
export const clearAllReportCaches = async () => {
  const reportKeys = [
    "sales_report",
    "inventory_report",
    "user_activity_report",
    "sales_forecast",
    "inventory_logs",
  ];

  for (const key of reportKeys) {
    await dbManager.delete(STORES.CACHED_DATA, key);
  }

  toast.success("✅ All report caches cleared");
};

/**
 * Get cache age in human-readable format
 */
export const getCacheAge = (timestamp: number | null): string => {
  if (!timestamp) return "Never";

  const age = Date.now() - timestamp;
  const seconds = Math.floor(age / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return `${seconds} second${seconds > 1 ? "s" : ""} ago`;
};
