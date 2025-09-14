"uimport { useOffline, useOfflineAxios } from '@/app/context/OfflineContext';e client";

import { useOffline, useOfflineAPI } from "@/app/context/OfflineContext";
import { useCallback, useEffect, useState } from "react";

// Data structure interfaces for restaurant management
interface InventoryItem {
  id: number;
  item_name: string;
  current_stock: number;
  min_threshold: number;
  max_threshold: number;
  unit: string;
  category: string;
  last_updated: string;
  batch_date?: string;
}

interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  category: string;
  availability: boolean;
  ingredients?: string[];
  image_url?: string;
}

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  department?: string;
}

interface SalesData {
  id: number;
  date: string;
  total_amount: number;
  items_sold: number;
  menu_item_id: number;
  menu_item_name: string;
  quantity: number;
}

interface DashboardStats {
  total_inventory_items: number;
  low_stock_items: number;
  total_menu_items: number;
  active_users: number;
  today_sales: number;
  pending_orders: number;
  last_updated: string;
}

// Cache keys for different data types
const CACHE_KEYS = {
  INVENTORY: "inventory-data",
  MENU: "menu-data",
  USERS: "user-data",
  SALES: "sales-data",
  DASHBOARD: "dashboard-stats",
  SUPPLIERS: "supplier-data",
  NOTIFICATIONS: "notification-data",
} as const;

// Cache expiry times (in hours)
const CACHE_EXPIRY = {
  INVENTORY: 2, // 2 hours - frequently changing
  MENU: 24, // 24 hours - less frequent changes
  USERS: 12, // 12 hours - moderate changes
  SALES: 1, // 1 hour - frequently changing
  DASHBOARD: 0.5, // 30 minutes - real-time data
  SUPPLIERS: 48, // 48 hours - rarely changes
  NOTIFICATIONS: 1, // 1 hour - frequently changing
} as const;

export const useOfflineDataManager = () => {
  const { getCachedData, setCachedData, isOnline, isOfflineMode } =
    useOffline();
  const { offlineReadyFetch } = useOfflineAPI();

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  // Initialize last sync time
  useEffect(() => {
    const savedLastSync = localStorage.getItem("cardiac-delights-last-sync");
    if (savedLastSync) {
      setLastSyncTime(parseInt(savedLastSync));
    }
  }, []);

  // Update last sync time
  const updateLastSync = useCallback(() => {
    const now = Date.now();
    setLastSyncTime(now);
    localStorage.setItem("cardiac-delights-last-sync", now.toString());
  }, []);

  // Generic fetch function with offline support using fetch
  const fetchWithOfflineSupport = useCallback(
    async <T>(
      endpoint: string,
      cacheKey: string,
      cacheHours: number
    ): Promise<{ data: T | null; fromCache: boolean; error?: string }> => {
      setIsLoading(true);

      try {
        const response = await offlineReadyFetch(
          endpoint,
          { method: "GET" },
          cacheKey,
          cacheHours
        );

        // If response is a native fetch Response object
        if (response instanceof Response) {
          if (response.ok) {
            const data = await response.json();
            updateLastSync();
            return {
              data,
              fromCache: false,
            };
          } else {
            // Try to get cached data if API fails
            const cachedData = getCachedData(cacheKey);
            if (cachedData) {
              return {
                data: cachedData,
                fromCache: true,
              };
            }

            return {
              data: null,
              fromCache: false,
              error: `API Error: ${response.status}`,
            };
          }
        } else {
          // Custom offlineReadyFetch response (from cache or queue)
          const extendedResponse = response as any;
          if (!extendedResponse.fromCache && !extendedResponse.queued) {
            updateLastSync();
          }

          return {
            data: extendedResponse.data,
            fromCache: !!extendedResponse.fromCache,
          };
        }
      } catch (error: any) {
        // Handle offline errors gracefully
        if (error.isOfflineError) {
          const cachedData = getCachedData(cacheKey);
          if (cachedData) {
            return {
              data: cachedData,
              fromCache: true,
            };
          }

          return {
            data: null,
            fromCache: false,
            error: "No cached data available offline",
          };
        }

        // Try to get cached data for other network fails
        const cachedData = getCachedData(cacheKey);
        if (cachedData) {
          return {
            data: cachedData,
            fromCache: true,
          };
        }

        return {
          data: null,
          fromCache: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      } finally {
        setIsLoading(false);
      }
    },
    [offlineReadyFetch, getCachedData, updateLastSync]
  );

  // Inventory data management
  const getInventoryData = useCallback(async () => {
    return fetchWithOfflineSupport<InventoryItem[]>(
      "/api/inventory",
      CACHE_KEYS.INVENTORY,
      CACHE_EXPIRY.INVENTORY
    );
  }, [fetchWithOfflineSupport]);

  // Menu data management
  const getMenuData = useCallback(async () => {
    return fetchWithOfflineSupport<MenuItem[]>(
      "/api/menu",
      CACHE_KEYS.MENU,
      CACHE_EXPIRY.MENU
    );
  }, [fetchWithOfflineSupport]);

  // User data management
  const getUserData = useCallback(async () => {
    return fetchWithOfflineSupport<UserData[]>(
      "/api/users",
      CACHE_KEYS.USERS,
      CACHE_EXPIRY.USERS
    );
  }, [fetchWithOfflineSupport]);

  // Sales data management
  const getSalesData = useCallback(
    async (dateRange?: { start: string; end: string }) => {
      const endpoint = dateRange
        ? `/api/sales?start=${dateRange.start}&end=${dateRange.end}`
        : "/api/sales";

      const cacheKey = dateRange
        ? `${CACHE_KEYS.SALES}-${dateRange.start}-${dateRange.end}`
        : CACHE_KEYS.SALES;

      return fetchWithOfflineSupport<SalesData[]>(
        endpoint,
        cacheKey,
        CACHE_EXPIRY.SALES
      );
    },
    [fetchWithOfflineSupport]
  );

  // Dashboard stats management
  const getDashboardStats = useCallback(async () => {
    return fetchWithOfflineSupport<DashboardStats>(
      "/api/dashboard/stats",
      CACHE_KEYS.DASHBOARD,
      CACHE_EXPIRY.DASHBOARD
    );
  }, [fetchWithOfflineSupport]);

  // Supplier data management
  const getSupplierData = useCallback(async () => {
    return fetchWithOfflineSupport<any[]>(
      "/api/suppliers",
      CACHE_KEYS.SUPPLIERS,
      CACHE_EXPIRY.SUPPLIERS
    );
  }, [fetchWithOfflineSupport]);

  // Notification data management
  const getNotificationData = useCallback(
    async (userId: number) => {
      return fetchWithOfflineSupport<any[]>(
        `/api/notifications?user_id=${userId}`,
        `${CACHE_KEYS.NOTIFICATIONS}-${userId}`,
        CACHE_EXPIRY.NOTIFICATIONS
      );
    },
    [fetchWithOfflineSupport]
  );

  // Batch data fetching for critical app data
  const syncCriticalData = useCallback(async () => {
    if (!isOnline && isOfflineMode) {
      console.log("Skipping sync - app is in offline mode");
      return;
    }

    setIsLoading(true);
    const syncPromises = [
      getInventoryData(),
      getMenuData(),
      getDashboardStats(),
    ];

    try {
      await Promise.allSettled(syncPromises);
      console.log("Critical data sync completed");
    } catch (error) {
      console.error("Critical data sync failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    isOnline,
    isOfflineMode,
    getInventoryData,
    getMenuData,
    getDashboardStats,
  ]);

  // Get offline data summary
  const getOfflineDataSummary = useCallback(() => {
    const summary = {
      inventory: !!getCachedData(CACHE_KEYS.INVENTORY),
      menu: !!getCachedData(CACHE_KEYS.MENU),
      users: !!getCachedData(CACHE_KEYS.USERS),
      sales: !!getCachedData(CACHE_KEYS.SALES),
      dashboard: !!getCachedData(CACHE_KEYS.DASHBOARD),
      suppliers: !!getCachedData(CACHE_KEYS.SUPPLIERS),
      lastSync: lastSyncTime,
    };

    const availableDataCount = Object.values(summary).filter(
      (value, index) => index < 6 && value === true
    ).length;

    return {
      ...summary,
      totalAvailable: availableDataCount,
      totalPossible: 6,
      completionPercentage: (availableDataCount / 6) * 100,
    };
  }, [getCachedData, lastSyncTime]);

  // Smart data refresh based on cache age
  const smartRefresh = useCallback(
    async (forceRefresh = false) => {
      if (!isOnline && !forceRefresh) return;

      const now = Date.now();
      const refreshPromises: Promise<any>[] = [];

      // Check each cache and refresh if expired or close to expiry
      Object.entries(CACHE_KEYS).forEach(([key, cacheKey]) => {
        const cached = getCachedData(cacheKey);
        if (!cached) return;

        const expiryHours = CACHE_EXPIRY[key as keyof typeof CACHE_EXPIRY];
        const expiryTime = cached.timestamp + expiryHours * 60 * 60 * 1000;
        const timeUntilExpiry = expiryTime - now;
        const refreshThreshold = expiryHours * 60 * 60 * 1000 * 0.25; // Refresh when 25% time remaining

        if (forceRefresh || timeUntilExpiry < refreshThreshold) {
          switch (key) {
            case "INVENTORY":
              refreshPromises.push(getInventoryData());
              break;
            case "MENU":
              refreshPromises.push(getMenuData());
              break;
            case "DASHBOARD":
              refreshPromises.push(getDashboardStats());
              break;
            // Add other data types as needed
          }
        }
      });

      if (refreshPromises.length > 0) {
        console.log(
          `Smart refresh: updating ${refreshPromises.length} data sources`
        );
        await Promise.allSettled(refreshPromises);
      }
    },
    [isOnline, getCachedData, getInventoryData, getMenuData, getDashboardStats]
  );

  return {
    // Data fetching methods
    getInventoryData,
    getMenuData,
    getUserData,
    getSalesData,
    getDashboardStats,
    getSupplierData,
    getNotificationData,

    // Batch operations
    syncCriticalData,
    smartRefresh,

    // Status and utilities
    isLoading,
    lastSyncTime,
    getOfflineDataSummary,

    // Cache information
    CACHE_KEYS,
    CACHE_EXPIRY,
  };
};

export default useOfflineDataManager;
