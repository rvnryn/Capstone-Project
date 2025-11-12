/**
 * React Query hooks for Supplier module with real-time updates
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

export interface Supplier {
  supplier_id: number;
  supplier_name: string;
  contact_person?: string;
  supplies?: string;
  phone_number?: string;
  email?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
}

export type AddSupplierPayload = {
  supplier_name: string;
  contact_person?: string;
  phone_number?: string;
  email?: string;
  address?: string;
  supplies?: string;
};

export type UpdateSupplierPayload = Partial<AddSupplierPayload>;

// =============================================================================
// QUERY HOOKS (Fetching Data)
// =============================================================================

/**
 * Fetch all suppliers
 * Auto-refreshes every 3 minutes
 */
export function useSupplierList() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: async (): Promise<Supplier[]> => {
      const response = await fetch(`${API_BASE_URL}/api/suppliers`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Cache data for offline support
      if (typeof window !== "undefined") {
        localStorage.setItem("suppliersCache", JSON.stringify(data));
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
 * Fetch a single supplier by ID
 * Auto-refreshes every 3 minutes
 */
export function useSupplier(supplier_id: number | string | null) {
  return useQuery({
    queryKey: ["suppliers", supplier_id],
    queryFn: async (): Promise<Supplier> => {
      if (!supplier_id) {
        throw new Error("Supplier ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/api/suppliers/${supplier_id}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    },
    enabled: !!supplier_id, // Only run query if supplier_id exists
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
 * Add a new supplier
 * Automatically invalidates supplier list after success
 */
export function useAddSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (supplier: AddSupplierPayload) => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/suppliers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(supplier),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch supplier list
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier added successfully!");
    },
    onError: (error: any) => {
      toast.error(`Failed to add supplier: ${error.message}`);
    },
  });
}

/**
 * Update an existing supplier
 * Automatically invalidates supplier list and specific supplier after success
 */
export function useUpdateSupplier(supplier_id: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (supplier: UpdateSupplierPayload) => {
      const token = getToken();
      const response = await fetch(
        `${API_BASE_URL}/api/suppliers/${supplier_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(supplier),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    },
    onSuccess: () => {
      // Invalidate both supplier list and specific supplier
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers", supplier_id] });
      toast.success("Supplier updated successfully!");
    },
    onError: (error: any) => {
      toast.error(`Failed to update supplier: ${error.message}`);
    },
  });
}

/**
 * Delete a supplier
 * Automatically invalidates supplier list after success
 */
export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (supplier_id: number | string) => {
      const token = getToken();
      const response = await fetch(
        `${API_BASE_URL}/api/suppliers/${supplier_id}`,
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
      // Invalidate supplier list
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete supplier: ${error.message}`);
    },
  });
}
