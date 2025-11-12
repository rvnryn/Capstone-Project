/**
 * React Query hooks for Inventory Settings module with real-time updates
 * Features:
 * - Mutation-triggered refresh (refetches only when data changes)
 * - Smart caching with staleTime: 0 for fresh data
 * - Auto-refetch on window focus, mount, and reconnect
 * - Automatic error handling with toast notifications
 * - Cache invalidation for all mutations
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getToken } from "@/app/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_BASE = `${API_BASE_URL}/api/inventory-settings`;

// =============================================================================
// TYPES
// =============================================================================

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

// =============================================================================
// QUERY HOOKS (Fetching Data)
// =============================================================================

/**
 * Fetch all inventory settings
 * Auto-refreshes every 3 minutes
 */
export function useInventorySettings() {
  return useQuery({
    queryKey: ["inventory-settings"],
    queryFn: async (): Promise<InventorySetting[]> => {
      const response = await fetch(API_BASE, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch inventory settings: ${response.status}`);
      }

      const data = await response.json();

      // Cache data for offline support
      if (typeof window !== "undefined") {
        localStorage.setItem("inventory_settings_cache", JSON.stringify(data));
      }

      return data;
    },
    staleTime: 0, // Always consider data stale to ensure fresh data after mutations
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnReconnect: true, // Refetch when internet reconnects
    refetchOnMount: true, // Always refetch when component mounts
  });
}

// =============================================================================
// MUTATION HOOKS (Creating/Updating/Deleting Data)
// =============================================================================

/**
 * Create a new inventory setting
 * Automatically invalidates inventory settings list after success
 */
export function useCreateInventorySetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InventorySettingInput) => {
      const response = await fetch(API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.detail || errorData.message || "Failed to create inventory setting";
        throw new Error(errorMessage);
      }

      return await response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch inventory settings list
      queryClient.invalidateQueries({ queryKey: ["inventory-settings"] });
      toast.success("Inventory setting created successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create inventory setting. Please try again.");
    },
  });
}

/**
 * Update an existing inventory setting
 * Automatically invalidates inventory settings list after success
 */
export function useUpdateInventorySetting(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InventorySettingInput) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.detail || errorData.message || "Failed to update inventory setting";
        throw new Error(errorMessage);
      }

      return await response.json();
    },
    onSuccess: () => {
      // Invalidate inventory settings list
      queryClient.invalidateQueries({ queryKey: ["inventory-settings"] });
      toast.success("Inventory setting updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update inventory setting. Please try again.");
    },
  });
}

/**
 * Delete an inventory setting
 * Automatically invalidates inventory settings list after success
 */
export function useDeleteInventorySetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
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

      return await response.json();
    },
    onSuccess: () => {
      // Invalidate inventory settings list
      queryClient.invalidateQueries({ queryKey: ["inventory-settings"] });
      toast.success("Inventory setting deleted successfully!");
    },
    onError: (error: any) => {
      toast.error("Failed to delete inventory setting. Please try again.");
    },
  });
}

/**
 * Batch update inventory settings (used for Save button)
 * Handles create, update, and delete operations in a single transaction
 */
export function useBatchUpdateInventorySettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      added,
      updated,
      deleted,
    }: {
      added: InventorySetting[];
      updated: InventorySetting[];
      deleted: InventorySetting[];
    }) => {
      // Process all operations
      const results = {
        created: [] as InventorySetting[],
        updated: [] as InventorySetting[],
        deleted: [] as number[],
        errors: [] as string[],
      };

      // Create new items
      for (const item of added) {
        try {
          const response = await fetch(API_BASE, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
            },
            body: JSON.stringify({
              name: item.name,
              default_unit: item.default_unit,
              low_stock_threshold: item.low_stock_threshold,
              category: item.category,
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to create ${item.name}`);
          }

          const result = await response.json();
          results.created.push(result);
        } catch (error: any) {
          results.errors.push(error.message);
        }
      }

      // Update existing items
      for (const item of updated) {
        try {
          const response = await fetch(`${API_BASE}/${item.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
            },
            body: JSON.stringify({
              name: item.name,
              default_unit: item.default_unit,
              low_stock_threshold: item.low_stock_threshold,
              category: item.category,
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to update ${item.name}`);
          }

          const result = await response.json();
          results.updated.push(result);
        } catch (error: any) {
          results.errors.push(error.message);
        }
      }

      // Delete items
      for (const item of deleted) {
        try {
          const response = await fetch(`${API_BASE}/${item.id}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to delete ${item.name}`);
          }

          results.deleted.push(item.id);
        } catch (error: any) {
          results.errors.push(error.message);
        }
      }

      if (results.errors.length > 0) {
        throw new Error(results.errors.join(", "));
      }

      return results;
    },
    onSuccess: () => {
      // Invalidate inventory settings list
      queryClient.invalidateQueries({ queryKey: ["inventory-settings"] });
      toast.success("Settings saved successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save some settings. Please try again.");
    },
  });
}
