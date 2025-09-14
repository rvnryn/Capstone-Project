import { useState } from "react";
import axiosInstance from "@/app/lib/axios";
import { offlineAxiosRequest } from "@/app/utils/offlineAxios";
import { useOfflineQueue } from "@/app/hooks/usePWA";
import { useCallback } from "react";
import { toast } from "react-toastify";
import axios from "axios";

export interface InventorySetting {
  id: number;
  name: string;
  default_unit?: string;
  low_stock_threshold?: number;
  category?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InventorySettingInput {
  name: string;
  default_unit?: string;
  low_stock_threshold?: number;
  category?: string;
}

const API_BASE = "/api/inventory-settings";

export function useInventorySettingsAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get offline queue functions
  const { addOfflineAction, isOnline } = useOfflineQueue();

  // Helper function to handle offline write operations
  const handleOfflineWriteOperation = useCallback(
    async (
      operation: () => Promise<any>,
      offlineAction: {
        action: string;
        endpoint: string;
        method: string;
        payload: any;
      }
    ) => {
      if (isOnline) {
        // Online: Execute the operation immediately
        return await operation();
      } else {
        // Offline: Queue the action and show user feedback
        addOfflineAction(offlineAction.action, {
          endpoint: offlineAction.endpoint,
          method: offlineAction.method,
          payload: offlineAction.payload,
        });
        toast.info("📱 Action queued for when you're back online!", {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        });
        // Return a mock response to keep UI working
        return { success: true, queued: true };
      }
    },
    [isOnline, addOfflineAction]
  );
  const fetchSettings = async (): Promise<InventorySetting[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await offlineAxiosRequest(
        {
          method: "GET",
          url: API_BASE,
        },
        {
          cacheKey: "inventory-settings",
          cacheHours: 2, // Settings can be cached longer
          showErrorToast: true,
          fallbackData: [],
        }
      );
      return response.data;
    } catch (err) {
      if (err && typeof err === "object" && "isOfflineError" in err) {
        setError("Settings not available offline");
        return [];
      } else if (axios.isAxiosError(err)) {
        setError((err.response?.data?.detail as string) || err.message);
      } else {
        setError("Unknown error");
      }
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createSetting = async (
    data: InventorySettingInput
  ): Promise<InventorySetting | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await handleOfflineWriteOperation(
        () =>
          offlineAxiosRequest(
            {
              method: "POST",
              url: API_BASE,
              data,
            },
            {
              showErrorToast: true,
            }
          ),
        {
          action: "create-inventory-setting",
          endpoint: API_BASE,
          method: "POST",
          payload: data,
        }
      );
      return result.queued ? null : result.data;
    } catch (err) {
      if (err && typeof err === "object" && "isOfflineError" in err) {
        setError("Action queued for sync");
      } else if (axios.isAxiosError(err)) {
        setError((err.response?.data?.detail as string) || err.message);
      } else {
        setError("Unknown error");
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (
    id: number,
    data: InventorySettingInput
  ): Promise<InventorySetting | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await handleOfflineWriteOperation(
        () =>
          offlineAxiosRequest(
            {
              method: "PUT",
              url: `${API_BASE}/${id}`,
              data,
            },
            {
              showErrorToast: true,
            }
          ),
        {
          action: "update-inventory-setting",
          endpoint: `${API_BASE}/${id}`,
          method: "PUT",
          payload: data,
        }
      );
      return result.queued ? null : result.data;
    } catch (err) {
      if (err && typeof err === "object" && "isOfflineError" in err) {
        setError("Action queued for sync");
      } else if (axios.isAxiosError(err)) {
        setError((err.response?.data?.detail as string) || err.message);
      } else {
        setError("Unknown error");
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteSetting = async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const result = await handleOfflineWriteOperation(
        () =>
          offlineAxiosRequest(
            {
              method: "DELETE",
              url: `${API_BASE}/${id}`,
            },
            {
              showErrorToast: true,
            }
          ),
        {
          action: "delete-inventory-setting",
          endpoint: `${API_BASE}/${id}`,
          method: "DELETE",
          payload: { id },
        }
      );
      return !result.queued;
    } catch (err) {
      if (err && typeof err === "object" && "isOfflineError" in err) {
        setError("Action queued for sync");
      } else if (axios.isAxiosError(err)) {
        setError((err.response?.data?.detail as string) || err.message);
      } else {
        setError("Unknown error");
      }
      return false;
    } finally {
      setLoading(false);
    }
  };
  return {
    loading,
    error,
    fetchSettings,
    createSetting,
    updateSetting,
    deleteSetting,
  };
}
