"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";

// Types for offline data management
interface OfflineData {
  timestamp: number;
  data: any;
  expiry?: number;
}

interface CachedApiResponse {
  [key: string]: OfflineData;
}

interface OfflineAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  endpoint: string;
  method: string;
}

interface OfflineContextType {
  isOnline: boolean;
  isOfflineMode: boolean;
  lastOnlineTime: number | null;

  // Data management
  getCachedData: (key: string) => any | null;
  setCachedData: (key: string, data: any, expiry?: number) => void;
  clearCachedData: (key?: string) => void;

  // Action queue management
  queueOfflineAction: (action: Omit<OfflineAction, "id" | "timestamp">) => void;
  getOfflineActions: () => OfflineAction[];
  clearOfflineActions: () => void;
  syncOfflineActions: () => Promise<void>;

  // Offline state management
  setOfflineMode: (enabled: boolean) => void;
  getOfflineStatus: () => {
    isOnline: boolean;
    isOfflineMode: boolean;
    hasOfflineData: boolean;
    hasPendingActions: boolean;
    lastSync: number | null;
  };
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

interface OfflineProviderProps {
  children: ReactNode;
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({
  children,
}) => {
  const [isOnline, setIsOnline] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [lastOnlineTime, setLastOnlineTime] = useState<number | null>(null);
  const [cachedData, setCachedDataState] = useState<CachedApiResponse>({});
  const [offlineActions, setOfflineActions] = useState<OfflineAction[]>([]);

  // Initialize from localStorage
  useEffect(() => {
    // Load cached data
    try {
      const savedData = localStorage.getItem("cardiac-delights-offline-data");
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setCachedDataState(parsed);
      }
    } catch (error) {
      console.error("Failed to load cached data:", error);
    }

    // Load offline actions
    try {
      const savedActions = localStorage.getItem(
        "cardiac-delights-offline-actions"
      );
      if (savedActions) {
        const parsed = JSON.parse(savedActions);
        setOfflineActions(parsed);
      }
    } catch (error) {
      console.error("Failed to load offline actions:", error);
    }

    // Load last online time
    const lastOnline = localStorage.getItem("cardiac-delights-last-online");
    if (lastOnline) {
      setLastOnlineTime(parseInt(lastOnline));
    }

    // Check initial online status
    setIsOnline(navigator.onLine);
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      const now = Date.now();
      setLastOnlineTime(now);
      localStorage.setItem("cardiac-delights-last-online", now.toString());

      // Auto-sync when coming back online
      if (offlineActions.length > 0) {
        syncOfflineActions();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [offlineActions.length]);

  // Save cached data to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(
        "cardiac-delights-offline-data",
        JSON.stringify(cachedData)
      );
    } catch (error) {
      console.error("Failed to save cached data:", error);
    }
  }, [cachedData]);

  // Save offline actions to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(
        "cardiac-delights-offline-actions",
        JSON.stringify(offlineActions)
      );
    } catch (error) {
      console.error("Failed to save offline actions:", error);
    }
  }, [offlineActions]);

  // Data management functions
  const getCachedData = useCallback(
    (key: string): any | null => {
      const cached = cachedData[key];
      if (!cached) return null;

      // Check if data has expired
      if (cached.expiry && Date.now() > cached.expiry) {
        // Remove expired data
        setCachedDataState((prev) => {
          const newData = { ...prev };
          delete newData[key];
          return newData;
        });
        return null;
      }

      return cached.data;
    },
    [cachedData]
  );

  const setCachedData = useCallback(
    (key: string, data: any, expiryHours?: number) => {
      const expiry = expiryHours
        ? Date.now() + expiryHours * 60 * 60 * 1000
        : undefined;

      setCachedDataState((prev) => ({
        ...prev,
        [key]: {
          timestamp: Date.now(),
          data,
          expiry,
        },
      }));
    },
    []
  );

  const clearCachedData = useCallback((key?: string) => {
    if (key) {
      setCachedDataState((prev) => {
        const newData = { ...prev };
        delete newData[key];
        return newData;
      });
    } else {
      setCachedDataState({});
      localStorage.removeItem("cardiac-delights-offline-data");
    }
  }, []);

  // Action queue management
  const queueOfflineAction = useCallback(
    (action: Omit<OfflineAction, "id" | "timestamp">) => {
      const newAction: OfflineAction = {
        ...action,
        id: `offline-action-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        timestamp: Date.now(),
      };

      setOfflineActions((prev) => [...prev, newAction]);
    },
    []
  );

  const getOfflineActions = useCallback(() => {
    return offlineActions;
  }, [offlineActions]);

  const clearOfflineActions = useCallback(() => {
    setOfflineActions([]);
    localStorage.removeItem("cardiac-delights-offline-actions");
  }, []);

  const syncOfflineActions = useCallback(async () => {
    if (!isOnline || offlineActions.length === 0) return;

    const actionsToSync = [...offlineActions];
    const syncResults = [];

    for (const action of actionsToSync) {
      try {
        const response = await fetch(action.endpoint, {
          method: action.method,
          headers: {
            "Content-Type": "application/json",
          },
          body:
            action.method !== "GET"
              ? JSON.stringify(action.payload)
              : undefined,
        });

        if (response.ok) {
          syncResults.push({ action, success: true });
        } else {
          syncResults.push({ action, success: false, error: "HTTP error" });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        syncResults.push({ action, success: false, error: errorMessage });
      }
    }

    // Remove successfully synced actions
    const successfulActionIds = syncResults
      .filter((result) => result.success)
      .map((result) => result.action.id);

    setOfflineActions((prev) =>
      prev.filter((action) => !successfulActionIds.includes(action.id))
    );

    // Log sync results
    console.log("Offline sync completed:", {
      total: actionsToSync.length,
      successful: successfulActionIds.length,
      failed: actionsToSync.length - successfulActionIds.length,
    });
  }, [isOnline, offlineActions]);

  const setOfflineMode = useCallback((enabled: boolean) => {
    setIsOfflineMode(enabled);
  }, []);

  const getOfflineStatus = useCallback(
    () => ({
      isOnline,
      isOfflineMode,
      hasOfflineData: Object.keys(cachedData).length > 0,
      hasPendingActions: offlineActions.length > 0,
      lastSync: lastOnlineTime,
    }),
    [isOnline, isOfflineMode, cachedData, offlineActions, lastOnlineTime]
  );

  const contextValue: OfflineContextType = {
    isOnline,
    isOfflineMode,
    lastOnlineTime,
    getCachedData,
    setCachedData,
    clearCachedData,
    queueOfflineAction,
    getOfflineActions,
    clearOfflineActions,
    syncOfflineActions,
    setOfflineMode,
    getOfflineStatus,
  };

  return (
    <OfflineContext.Provider value={contextValue}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error("useOffline must be used within an OfflineProvider");
  }
  return context;
};

// Hook for offline-ready API calls
export const useOfflineAPI = () => {
  const {
    isOnline,
    isOfflineMode,
    getCachedData,
    setCachedData,
    queueOfflineAction,
  } = useOffline();

  const offlineReadyFetch = useCallback(
    async (
      url: string,
      options: RequestInit = {},
      cacheKey?: string,
      cacheHours?: number
    ) => {
      // If offline or in offline mode, try to return cached data
      if ((!isOnline || isOfflineMode) && cacheKey) {
        const cached = getCachedData(cacheKey);
        if (cached) {
          return {
            ok: true,
            json: async () => cached,
            status: 200,
            fromCache: true,
          };
        }
      }

      // If offline and no cache, queue the action for later
      if (!isOnline || isOfflineMode) {
        if (options.method && options.method !== "GET") {
          queueOfflineAction({
            type: "API_CALL",
            endpoint: url,
            method: options.method,
            payload: options.body ? JSON.parse(options.body as string) : null,
          });

          return {
            ok: true,
            json: async () => ({
              message: "Action queued for sync when online",
            }),
            status: 202,
            queued: true,
          };
        }

        throw new Error("No cached data available offline");
      }

      // Normal fetch when online
      try {
        const response = await fetch(url, options);

        // Cache successful GET responses
        if (
          response.ok &&
          (!options.method || options.method === "GET") &&
          cacheKey
        ) {
          const data = await response.clone().json();
          setCachedData(cacheKey, data, cacheHours || 24);
        }

        return response;
      } catch (error) {
        // If network fails, try cache as fallback
        if (cacheKey) {
          const cached = getCachedData(cacheKey);
          if (cached) {
            return {
              ok: true,
              json: async () => cached,
              status: 200,
              fromCache: true,
            };
          }
        }
        throw error;
      }
    },
    [isOnline, isOfflineMode, getCachedData, setCachedData, queueOfflineAction]
  );

  return { offlineReadyFetch };
};

// Enhanced offline-aware axios hook
export const useOfflineAxios = () => {
  const {
    isOnline,
    isOfflineMode,
    getCachedData,
    setCachedData,
    queueOfflineAction,
  } = useOffline();

  const offlineReadyAxios = useCallback(
    async (config: any, cacheKey?: string, cacheHours?: number) => {
      // If offline or in offline mode, try to return cached data for GET requests
      if (
        (!isOnline || isOfflineMode) &&
        (!config.method || config.method.toUpperCase() === "GET") &&
        cacheKey
      ) {
        const cached = getCachedData(cacheKey);
        if (cached) {
          console.log(`[OfflineAxios] Serving cached data for ${config.url}`);
          return {
            data: cached,
            status: 200,
            statusText: "OK",
            fromCache: true,
            config,
          };
        }
      }

      // If offline and no cache for GET, return error response
      if (!isOnline || isOfflineMode) {
        if (!config.method || config.method.toUpperCase() === "GET") {
          console.log(
            `[OfflineAxios] No cached data available for ${config.url}`
          );
          throw {
            isOfflineError: true,
            message: "No cached data available offline",
            config,
          };
        }

        // For non-GET requests, queue them
        queueOfflineAction({
          type: "AXIOS_CALL",
          endpoint: config.url,
          method: config.method || "POST",
          payload: config.data || null,
        });

        console.log(
          `[OfflineAxios] Queued ${config.method} request to ${config.url}`
        );
        return {
          data: { message: "Action queued for sync when online" },
          status: 202,
          statusText: "Accepted",
          queued: true,
          config,
        };
      }

      // Normal axios request when online
      try {
        const axiosInstance = (await import("@/app/lib/axios")).default;
        const response = await axiosInstance(config);

        // Cache successful GET responses
        if (
          response.status >= 200 &&
          response.status < 300 &&
          (!config.method || config.method.toUpperCase() === "GET") &&
          cacheKey
        ) {
          console.log(`[OfflineAxios] Caching response for ${config.url}`);
          setCachedData(cacheKey, response.data, cacheHours || 24);
        }

        return response;
      } catch (error: any) {
        // If network fails, try cache as fallback for GET requests
        if (
          (!config.method || config.method.toUpperCase() === "GET") &&
          cacheKey
        ) {
          const cached = getCachedData(cacheKey);
          if (cached) {
            console.log(
              `[OfflineAxios] Network failed, serving cached data for ${config.url}`
            );
            return {
              data: cached,
              status: 200,
              statusText: "OK",
              fromCache: true,
              config,
            };
          }
        }

        // Enhanced error handling for network issues
        if (!error.response && error.request) {
          console.log(`[OfflineAxios] Network error for ${config.url}`);
          const offlineError = new Error("Network request failed") as any;
          offlineError.isOfflineError = true;
          offlineError.originalError = error;
          offlineError.config = config;
          throw offlineError;
        }

        throw error;
      }
    },
    [isOnline, isOfflineMode, getCachedData, setCachedData, queueOfflineAction]
  );

  return { offlineReadyAxios };
};

export default OfflineProvider;
