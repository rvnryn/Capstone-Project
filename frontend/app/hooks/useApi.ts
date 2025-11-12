/**
 * Custom hooks for API calls with automatic cache invalidation
 * This ensures data updates in real-time without manual refresh!
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Helper to get auth token
const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

// Helper for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// MENU HOOKS
// ============================================================================

export function useMenu() {
  return useQuery({
    queryKey: ["menu"],
    queryFn: () => apiCall("/api/menu"),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useMenuItem(menuId: number | null) {
  return useQuery({
    queryKey: ["menu", menuId],
    queryFn: () => apiCall(`/api/menu/${menuId}`),
    enabled: !!menuId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FormData) =>
      fetch(`${API_BASE_URL}/api/menu/create-with-image-and-ingredients`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        body: data,
      }).then((res) => res.json()),
    onSuccess: () => {
      // Automatically refresh menu list
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      toast.success("Menu item created successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create menu: ${error.message}`);
    },
  });
}

export function useUpdateMenu(menuId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FormData) =>
      fetch(`${API_BASE_URL}/api/menu/${menuId}/update-with-image-and-ingredients`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        body: data,
      }).then((res) => res.json()),
    onSuccess: () => {
      // Refresh both menu list and specific item
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      queryClient.invalidateQueries({ queryKey: ["menu", menuId] });
      toast.success("Menu item updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update menu: ${error.message}`);
    },
  });
}

export function useDeleteMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (menuId: number) =>
      apiCall(`/api/menu/${menuId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      toast.success("Menu item deleted successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete menu: ${error.message}`);
    },
  });
}

// ============================================================================
// INVENTORY HOOKS
// ============================================================================

export function useInventory(params?: { category?: string; limit?: number; offset?: number }) {
  const queryParams = new URLSearchParams();
  if (params?.category) queryParams.append("category", params.category);
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.offset) queryParams.append("offset", params.offset.toString());

  return useQuery({
    queryKey: ["inventory", params],
    queryFn: () => apiCall(`/api/inventory?${queryParams}`),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useInventoryToday() {
  return useQuery({
    queryKey: ["inventory-today"],
    queryFn: () => apiCall("/api/inventory-today"),
    staleTime: 1 * 60 * 1000,
  });
}

export function useInventorySurplus() {
  return useQuery({
    queryKey: ["inventory-surplus"],
    queryFn: () => apiCall("/api/inventory-surplus"),
    staleTime: 1 * 60 * 1000,
  });
}

export function useCreateInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) =>
      apiCall("/api/inventory", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-today"] });
      toast.success("Inventory item added successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to add inventory: ${error.message}`);
    },
  });
}

export function useUpdateInventory(itemId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) =>
      apiCall(`/api/inventory/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-today"] });
      toast.success("Inventory updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update inventory: ${error.message}`);
    },
  });
}

export function useDeleteInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: number) =>
      apiCall(`/api/inventory/${itemId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-today"] });
      toast.success("Inventory item deleted successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete inventory: ${error.message}`);
    },
  });
}

// ============================================================================
// SALES REPORT HOOKS
// ============================================================================

export function useSalesReport(params?: { startDate?: string; endDate?: string }) {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append("start_date", params.startDate);
  if (params?.endDate) queryParams.append("end_date", params.endDate);

  return useQuery({
    queryKey: ["sales-report", params],
    queryFn: () => apiCall(`/api/sales-report?${queryParams}`),
    staleTime: 2 * 60 * 1000,
  });
}

export function useImportSales() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) =>
      apiCall("/api/import-sales", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-report"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] }); // Sales affect inventory
      toast.success("Sales data imported successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to import sales: ${error.message}`);
    },
  });
}

// ============================================================================
// DASHBOARD HOOKS
// ============================================================================

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiCall("/api/dashboard/stats"),
    staleTime: 30 * 1000, // 30 seconds (refresh frequently)
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });
}

// ============================================================================
// SUPPLIER HOOKS
// ============================================================================

export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: () => apiCall("/api/suppliers"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) =>
      apiCall("/api/suppliers", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier added successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to add supplier: ${error.message}`);
    },
  });
}

export function useUpdateSupplier(supplierId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) =>
      apiCall(`/api/suppliers/${supplierId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update supplier: ${error.message}`);
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (supplierId: number) =>
      apiCall(`/api/suppliers/${supplierId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier deleted successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete supplier: ${error.message}`);
    },
  });
}

// ============================================================================
// USER ACTIVITY HOOKS
// ============================================================================

export function useUserActivity(params?: { userId?: number; limit?: number }) {
  const queryParams = new URLSearchParams();
  if (params?.userId) queryParams.append("user_id", params.userId.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());

  return useQuery({
    queryKey: ["user-activity", params],
    queryFn: () => apiCall(`/api/user-activity?${queryParams}`),
    staleTime: 1 * 60 * 1000,
  });
}
