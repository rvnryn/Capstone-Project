/**
 * Offline-aware axios utility
 * This provides a simple way to make axios requests that work offline
 */

import { toast } from "react-toastify";

// Define the return type for offline-aware requests
interface OfflineAxiosResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  fromCache?: boolean;
  isOfflineError?: boolean;
}

// Enhanced offline detection
const isActuallyOffline = (): boolean => {
  if (typeof window === "undefined") return false;

  // Check navigator.onLine first
  if (!navigator.onLine) return true;

  // Additional checks could be added here
  // For now, rely on navigator.onLine
  return false;
};

// Define the return type for offline-aware requests
interface OfflineAxiosResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  fromCache?: boolean;
  isOfflineError?: boolean;
}

// Enhanced error handling for axios requests
const handleAxiosError = (error: any, showToast = true): never => {
  // Check if this is an offline error
  if (error?.isOfflineError || error?.message === "NETWORK_OFFLINE") {
    // No toast: rely on global offline banner
    throw {
      isOfflineError: true,
      message: "Application is offline",
      status: 503,
    };
  }

  // Check if network is offline
  if (isActuallyOffline()) {
    if (showToast) {
      toast.warning("🌐 No internet connection detected.", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
    }
    throw {
      isOfflineError: true,
      message: "No internet connection",
      status: 503,
    };
  }

  // Handle other axios errors
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const message = error.response.data?.message || `HTTP ${status} Error`;

    if (showToast && status >= 500) {
      toast.error(`💥 Server error: ${message}`, {
        position: "top-right",
        autoClose: 4000,
        theme: "colored",
      });
    }

    throw {
      status,
      message,
      data: error.response.data,
    };
  } else if (error.request) {
    // Request was made but no response received
    if (showToast) {
      toast.error("🌐 No response from server. Check your connection.", {
        position: "top-right",
        autoClose: 4000,
        theme: "colored",
      });
    }

    throw {
      isOfflineError: true,
      message: "Network request failed",
      status: 503,
    };
  } else {
    // Something else happened
    if (showToast) {
      toast.error(`⚙️ Request error: ${error.message}`, {
        position: "top-right",
        autoClose: 4000,
        theme: "colored",
      });
    }

    throw {
      message: error.message || "Unknown error",
      status: 500,
    };
  }
};

// Main offline-aware axios function
export const offlineAxiosRequest = async <T = any>(
  config: any,
  options: {
    cacheKey?: string;
    cacheHours?: number;
    showErrorToast?: boolean;
    fallbackData?: T;
  } = {}
): Promise<OfflineAxiosResponse<T>> => {
  const {
    cacheKey,
    cacheHours = 2,
    showErrorToast = true,
    fallbackData,
  } = options;

  // Check if we're offline first
  if (isActuallyOffline()) {
    console.log("Offline detected, attempting to use cached data");

    // Try to get cached data first when offline
    if (cacheKey) {
      const cachedData = getCachedDataLocally(cacheKey);
      if (cachedData) {
        console.log("Using cached data for offline request");
        // No toast: rely on global offline banner
        return {
          data: cachedData,
          status: 200,
          statusText: "OK",
          fromCache: true,
        };
      }
    }

    // No cached data available, use fallback
    if (fallbackData !== undefined) {
      console.log("Using fallback data for offline request");
      // No toast: rely on global offline banner
      return {
        data: fallbackData,
        status: 200,
        statusText: "OK",
        fromCache: true,
      };
    }

    // No cache or fallback available
    throw {
      isOfflineError: true,
      message: "No cached data available offline",
      status: 503,
    };
  }

  try {
    // Import and use regular axios
    const axiosInstance = (await import("@/app/lib/axios")).default;
    const response = await axiosInstance(config);

    // Cache successful responses if cacheKey provided
    if (cacheKey && response.status >= 200 && response.status < 300) {
      cacheDataLocally(cacheKey, response.data, cacheHours);
    }

    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
    };
  } catch (error: any) {
    // Check if we have cached data or fallback
    if (fallbackData !== undefined) {
      console.log("Using fallback data due to error:", error.message);
      // No toast: rely on global offline banner
      return {
        data: fallbackData,
        status: 200,
        statusText: "OK",
        fromCache: true,
      };
    }

    // Try to get cached data from localStorage as fallback
    if (cacheKey && typeof window !== "undefined") {
      const cachedData = getCachedDataLocally(cacheKey);
      if (cachedData) {
        console.log("Using localStorage cached data due to error");
        // No toast: rely on global offline banner
        return {
          data: cachedData,
          status: 200,
          statusText: "OK",
          fromCache: true,
        };
      }
    }

    // Handle the error (this will always throw)
    handleAxiosError(error, showErrorToast);
    throw error; // Ensure function never returns undefined
  }
};

// Helper function to cache data in localStorage
export const cacheDataLocally = (key: string, data: any, hours: number = 2) => {
  if (typeof window === "undefined") return;

  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + hours * 60 * 60 * 1000,
    };

    localStorage.setItem(`offline-cache-${key}`, JSON.stringify(cacheData));
  } catch (error) {
    console.error("Failed to cache data:", error);
  }
};

// Helper function to get cached data from localStorage
export const getCachedDataLocally = (key: string): any | null => {
  if (typeof window === "undefined") return null;

  try {
    const cachedDataStr = localStorage.getItem(`offline-cache-${key}`);
    if (!cachedDataStr) return null;

    const cachedData = JSON.parse(cachedDataStr);
    const isExpired = cachedData.expiry && Date.now() > cachedData.expiry;

    if (isExpired) {
      localStorage.removeItem(`offline-cache-${key}`);
      return null;
    }

    return cachedData.data;
  } catch (error) {
    console.error("Failed to get cached data:", error);
    return null;
  }
};

// Simple wrapper that matches the original axios interface
export const createOfflineAxios = () => {
  return {
    get: <T = any>(url: string, config: any = {}, options: any = {}) =>
      offlineAxiosRequest<T>({ ...config, method: "GET", url }, options),

    post: <T = any>(
      url: string,
      data: any = {},
      config: any = {},
      options: any = {}
    ) =>
      offlineAxiosRequest<T>({ ...config, method: "POST", url, data }, options),

    put: <T = any>(
      url: string,
      data: any = {},
      config: any = {},
      options: any = {}
    ) =>
      offlineAxiosRequest<T>({ ...config, method: "PUT", url, data }, options),

    delete: <T = any>(url: string, config: any = {}, options: any = {}) =>
      offlineAxiosRequest<T>({ ...config, method: "DELETE", url }, options),

    request: <T = any>(config: any, options: any = {}) =>
      offlineAxiosRequest<T>(config, options),
  };
};

export default createOfflineAxios();
