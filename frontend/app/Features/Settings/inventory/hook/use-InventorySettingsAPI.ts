"use client";
import { useState } from "react";
import { useOfflineQueue } from "@/app/hooks/usePWA";
import { useCallback } from "react";
import { toast } from "react-toastify";
import { getToken } from "@/app/lib/auth";

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
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const API_BASE = `${API_BASE_URL}/api/inventory-settings`;

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
      const response = await fetch(API_BASE, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch inventory settings");
      }

      return response.json();
    } catch (err: any) {
      setError(err.message || "Unknown error");
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
        async () => {
          const response = await fetch(API_BASE, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
            },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            throw new Error("Failed to create inventory setting");
          }

          return response.json();
        },
        {
          action: "create-inventory-setting",
          endpoint: API_BASE,
          method: "POST",
          payload: data,
        }
      );
      return result.queued ? null : result;
    } catch (err: any) {
      setError(err.message || "Unknown error");
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
        async () => {
          const response = await fetch(`${API_BASE}/${id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
            },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            throw new Error("Failed to update inventory setting");
          }

          return response.json();
        },
        {
          action: "update-inventory-setting",
          endpoint: `${API_BASE}/${id}`,
          method: "PUT",
          payload: data,
        }
      );
      return result.queued ? null : result;
    } catch (err: any) {
      setError(err.message || "Unknown error");
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
        async () => {
          const response = await fetch(`${API_BASE}/${id}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
            },
          });

          if (!response.ok) {
            throw new Error("Failed to delete inventory setting");
          }

          return response.json();
        },
        {
          action: "delete-inventory-setting",
          endpoint: `${API_BASE}/${id}`,
          method: "DELETE",
          payload: { id },
        }
      );
      return !result.queued;
    } catch (err: any) {
      setError(err.message || "Unknown error");
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
