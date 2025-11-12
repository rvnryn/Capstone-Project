/**
 * React Query hooks for Menu module with real-time updates
 * Features:
 * - Mutation-triggered refresh (refetches only when data changes)
 * - Smart caching with staleTime: 0 for fresh data
 * - Auto-refetch on window focus, mount, and reconnect
 * - Automatic error handling with toast notifications
 * - Cache invalidation for all mutations
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Helper function to get auth token
const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

// =============================================================================
// TYPES
// =============================================================================

export interface MenuItem {
  menu_id: number;
  itemcode: string;
  dish_name: string;
  image_url: string;
  category: string;
  price: number;
  description?: string;
  stock_status?: string;
  created_at?: string;
  updated_at?: string;
  ingredients?: MenuIngredient[];
}

export interface MenuIngredient {
  menu_id?: number;
  ingredient_id?: number;
  name?: string;
  ingredient_name?: string;
  quantity?: string;
  is_unavailable?: boolean;
  stock_quantity?: number;
}

// =============================================================================
// QUERY HOOKS (Fetching Data)
// =============================================================================

/**
 * Fetch all menu items
 * Auto-refreshes every 3 minutes
 */
export function useMenuList() {
  return useQuery({
    queryKey: ["menu"],
    queryFn: async (): Promise<MenuItem[]> => {
      const response = await fetch(`${API_BASE_URL}/api/menu`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Cache data for offline support
      if (typeof window !== "undefined") {
        localStorage.setItem("menuCache", JSON.stringify(data));
      }

      return data;
    },
    staleTime: 0, // Always consider data stale to ensure fresh data after mutations
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnReconnect: true, // Refetch when internet reconnects
    refetchOnMount: true, // Always refetch when component mounts
  });
}

/**
 * Fetch a single menu item by ID
 * Auto-refreshes every 3 minutes
 */
export function useMenuItem(menu_id: number | null) {
  return useQuery({
    queryKey: ["menu", menu_id],
    queryFn: async (): Promise<MenuItem> => {
      if (!menu_id) {
        throw new Error("Menu ID is required");
      }

      const response = await fetch(`${API_BASE_URL}/api/menu/${menu_id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    },
    enabled: !!menu_id, // Only run query if menu_id exists
    refetchInterval: 3 * 60 * 1000,
    staleTime: 1 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

// =============================================================================
// MUTATION HOOKS (Creating/Updating/Deleting Data)
// =============================================================================

/**
 * Add a new menu item with image and ingredients
 * Automatically invalidates menu list after success
 */
export function useAddMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (form: FormData) => {
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(
        `${API_BASE_URL}/api/menu/create-with-image-and-ingredients`,
        {
          method: "POST",
          headers,
          body: form,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch menu list
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      toast.success("Menu item added successfully!");
    },
    onError: (error: any) => {
      toast.error(`Failed to add menu: ${error.message}`);
    },
  });
}

/**
 * Update menu item (JSON, no image)
 * Automatically invalidates menu list and specific item after success
 */
export function useUpdateMenu(menu_id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<MenuItem> & { ingredients?: MenuIngredient[] }) => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/menu/${menu_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    },
    onSuccess: () => {
      // Invalidate both menu list and specific item
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      queryClient.invalidateQueries({ queryKey: ["menu", menu_id] });
      toast.success("Menu item updated successfully!");
    },
    onError: (error: any) => {
      toast.error(`Failed to update menu: ${error.message}`);
    },
  });
}

/**
 * Update menu item with image and ingredients
 * Automatically invalidates menu list and specific item after success
 */
export function useUpdateMenuWithImage(menu_id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (form: FormData) => {
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(
        `${API_BASE_URL}/api/menu/${menu_id}/update-with-image-and-ingredients`,
        {
          method: "PATCH",
          headers,
          body: form,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    },
    onSuccess: () => {
      // Invalidate both menu list and specific item
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      queryClient.invalidateQueries({ queryKey: ["menu", menu_id] });
      toast.success("Menu item updated successfully!");
    },
    onError: (error: any) => {
      toast.error(`Failed to update menu: ${error.message}`);
    },
  });
}

/**
 * Delete a menu item
 * Automatically invalidates menu list after success
 */
export function useDeleteMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (menu_id: number) => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/menu/${menu_id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    },
    onSuccess: () => {
      // Invalidate menu list
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      toast.success("Menu item deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete menu: ${error.message}`);
    },
  });
}

/**
 * Delete an ingredient from a menu item
 * Automatically invalidates menu list and specific item after success
 */
export function useDeleteIngredient(menu_id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ingredient_id: string) => {
      const token = getToken();
      const response = await fetch(
        `${API_BASE_URL}/api/menu/${menu_id}/ingredient/${ingredient_id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    },
    onSuccess: () => {
      // Invalidate both menu list and specific item
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      queryClient.invalidateQueries({ queryKey: ["menu", menu_id] });
      toast.success("Ingredient deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete ingredient: ${error.message}`);
    },
  });
}

/**
 * Recalculate stock status for all menu items
 * Automatically invalidates menu list after success
 */
export function useRecalculateStockStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/menu/recalc`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    },
    onSuccess: () => {
      // Invalidate menu list to show updated stock status
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      toast.success("Stock status recalculated successfully!");
    },
    onError: (error: any) => {
      toast.error(`Failed to recalculate stock status: ${error.message}`);
    },
  });
}
