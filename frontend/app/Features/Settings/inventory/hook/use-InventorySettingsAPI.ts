"use client";
import { useState, useCallback } from "react";
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

  const fetchSettings = useCallback(async (): Promise<InventorySetting[]> => {
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
      const errorMessage = err.message || "Unknown error";
      setError(errorMessage);
      toast.error(`Error fetching settings: ${errorMessage}`, {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createSetting = useCallback(
    async (data: InventorySettingInput): Promise<InventorySetting | null> => {
      setLoading(true);
      setError(null);
      try {
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

        const result = await response.json();
        toast.success("Inventory setting created successfully!", {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        });
        return result;
      } catch (err: any) {
        const errorMessage = err.message || "Unknown error";
        setError(errorMessage);
        toast.error(`Error creating setting: ${errorMessage}`, {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateSetting = useCallback(
    async (
      id: number,
      data: InventorySettingInput
    ): Promise<InventorySetting | null> => {
      setLoading(true);
      setError(null);
      try {
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

        const result = await response.json();
        toast.success("Inventory setting updated successfully!", {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        });
        return result;
      } catch (err: any) {
        const errorMessage = err.message || "Unknown error";
        setError(errorMessage);
        toast.error(`Error updating setting: ${errorMessage}`, {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteSetting = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
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

      await response.json();
      toast.success("Inventory setting deleted successfully!", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
      return true;
    } catch (err: any) {
      const errorMessage = err.message || "Unknown error";
      setError(errorMessage);
      toast.error(`Error deleting setting: ${errorMessage}`, {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fetchSettings,
    createSetting,
    updateSetting,
    deleteSetting,
  };
}
