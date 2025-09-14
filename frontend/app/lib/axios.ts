import axios, { AxiosError, AxiosResponse } from "axios";
import axiosRetry from "axios-retry";
import { toast } from "react-toastify";
import { loadingHandler } from "./loadingHandler";
import "react-toastify/dist/ReactToastify.css";

// Import offline context hook (will be available at runtime)
// Lazy load the offline hook to avoid circular dependencies
let useOfflineHook: any = null;
const getOfflineContext = async () => {
  if (!useOfflineHook && typeof window !== "undefined") {
    try {
      const mod = await import("@/app/context/OfflineContext");
      useOfflineHook = mod.useOffline;
    } catch (error) {
      console.warn("Offline context not available:", error);
    }
  }
  return useOfflineHook;
};

const toastConfig = {
  position: "top-right" as const,
  autoClose: 3000,
  theme: "colored" as const,
};

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  timeout: 0,
  headers: { "Content-Type": "application/json" },
});

// Enhanced retry condition that considers offline state
axiosRetry(axiosInstance, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000,
  retryCondition: (error) => {
    // Check if we're offline first
    if (typeof window !== "undefined" && !navigator.onLine) {
      return false; // Don't retry if offline
    }

    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (error.response ? error.response.status >= 500 : false)
    );
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    loadingHandler.start();
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    loadingHandler.stop();
    toast.error("❌ Request could not be sent.", toastConfig);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    loadingHandler.stop();
    return response;
  },
  (error: AxiosError) => {
    loadingHandler.stop();

    // Check if we're offline or if this is a network error
    const isOffline = typeof window !== "undefined" && !navigator.onLine;
    const isNetworkError = !error.response && error.request;

    if (isOffline || isNetworkError) {
      // Handle offline/network errors gracefully
      console.log("Network error detected, offline mode activated");

      // Don't show error toast for network errors in offline mode
      // The offline components will handle user messaging
      if (!isOffline) {
        toast.warning("🌐 Connection lost. Using cached data when available.", {
          ...toastConfig,
          autoClose: 2000,
        });
      }

      // Return a custom offline error that can be handled by offline context
      const offlineError = new Error("NETWORK_OFFLINE") as any;
      offlineError.isOfflineError = true;
      offlineError.originalError = error;
      return Promise.reject(offlineError);
    }

    if (error.response) {
      const { status, data } = error.response as { status: number; data?: any };

      switch (status) {
        case 401:
          toast.warning(
            "⚠️ Session expired. Please log in again.",
            toastConfig
          );
          if (typeof window !== "undefined") {
            localStorage.removeItem("token");
            window.location.href = "/";
          }
          break;
        case 403:
          toast.error("🚫 You don't have permission to do this.", toastConfig);
          break;
        case 404:
          toast.info("🔍 Requested resource not found.", toastConfig);
          break;
        case 500:
          toast.error("💥 Server error — retrying...", toastConfig);
          break;
        default:
          toast.error(
            `❗ ${data?.message || "Unexpected error occurred."}`,
            toastConfig
          );
      }
    } else {
      // This should rarely happen now due to offline handling above
      toast.error(`⚙️ Error: ${error.message}`, toastConfig);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

// Offline-aware axios wrapper
export const offlineAwareRequest = async (config: any) => {
  try {
    const response = await axiosInstance(config);
    return response;
  } catch (error: any) {
    // Handle offline errors gracefully
    if (error.isOfflineError || error.message === "NETWORK_OFFLINE") {
      console.log("Request failed due to offline status, handling gracefully");

      // Return a mock response that indicates offline status
      return {
        data: null,
        status: 503,
        statusText: "Service Unavailable - Offline",
        isOfflineError: true,
        fromCache: false,
        config,
      };
    }

    // Re-throw other errors
    throw error;
  }
};

// Helper to check if an error is an offline error
export const isOfflineError = (error: any): boolean => {
  return (
    error?.isOfflineError === true ||
    error?.message === "NETWORK_OFFLINE" ||
    (typeof window !== "undefined" && !navigator.onLine && !error.response)
  );
};
