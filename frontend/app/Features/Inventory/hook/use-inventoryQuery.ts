"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

// =============================================================================
// MASTER INVENTORY QUERIES
// =============================================================================

export function useInventoryList() {
  return useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/inventory`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    },
    staleTime: 0, // Always consider data stale to ensure fresh data after mutations
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnReconnect: true, // Refetch when internet reconnects
    refetchOnMount: true, // Always refetch when component mounts
  });
}

export function useInventoryItem(id: string | number | null) {
  return useQuery({
    queryKey: ["inventory", id],
    queryFn: async () => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/inventory/${id}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
  });
}

export function useAddInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/inventory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(item),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "low-stock"] });
      queryClient.invalidateQueries({
        queryKey: ["dashboard", "out-of-stock"],
      });
      toast.success("Inventory item added successfully!");
    },
    onError: (error: any) => {
      toast.error(`Failed to add item: ${error.message}`);
    },
  });
}

export function useUpdateInventory(id: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const token = getToken();
      const cleanedItem = {
        ...item,
        expiration_date: item.expiration_date?.trim() || null,
      };
      const response = await fetch(`${API_BASE_URL}/api/inventory/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(cleanedItem),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Inventory item updated successfully!");
    },
    onError: (error: any) => {
      toast.error(`Failed to update item: ${error.message}`);
    },
  });
}

export function useDeleteInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | number) => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/inventory/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Inventory item deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete item: ${error.message}`);
    },
  });
}

// =============================================================================
// TODAY INVENTORY QUERIES
// =============================================================================

export function useTodayInventoryList() {
  return useQuery({
    queryKey: ["inventory-today"],
    queryFn: async () => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/inventory-today`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    },
    staleTime: 0, // Always consider data stale to ensure fresh data after mutations
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnReconnect: true, // Refetch when internet reconnects
    refetchOnMount: true, // Always refetch when component mounts
  });
}

export function useTodayInventoryItem(
  id: string | number | null,
  batch_date?: string | null
) {
  return useQuery({
    queryKey: ["inventory-today", id, batch_date],
    queryFn: async () => {
      const token = getToken();
      const url = batch_date
        ? `${API_BASE_URL}/api/inventory-today/${id}/${batch_date}`
        : `${API_BASE_URL}/api/inventory-today/${id}`;

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
  });
}

export function useAddTodayInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/inventory-today`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(item),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-today"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "expiring"] });
      toast.success("Today inventory added successfully!");
    },
    onError: (error: any) => {
      toast.error(`Failed to add item: ${error.message}`);
    },
  });
}

export function useUpdateTodayInventory(
  id: string | number,
  batch_date: string
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const token = getToken();
      const response = await fetch(
        `${API_BASE_URL}/api/inventory-today/${id}/${batch_date}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(item),
        }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-today"] });
      queryClient.invalidateQueries({
        queryKey: ["inventory-today", id, batch_date],
      });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Today inventory updated successfully!");
    },
    onError: (error: any) => {
      toast.error(`Failed to update item: ${error.message}`);
    },
  });
}

export function useDeleteTodayInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      batch_date,
    }: {
      id: string | number;
      batch_date: string;
    }) => {
      const token = getToken();
      const response = await fetch(
        `${API_BASE_URL}/api/inventory-today/${id}/${batch_date}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-today"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Today inventory deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete item: ${error.message}`);
    },
  });
}

export function useTransferToToday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { item_id: number; quantity: number }) => {
      const token = getToken();
      const response = await fetch(
        `${API_BASE_URL}/api/inventory-today/transfer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate both master and today inventory
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-today"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Item transferred to today's inventory!");
    },
    onError: (error: any) => {
      toast.error(`Failed to transfer item: ${error.message}`);
    },
  });
}

// =============================================================================
// SURPLUS INVENTORY QUERIES
// =============================================================================

export function useSurplusInventoryList() {
  return useQuery({
    queryKey: ["inventory-surplus"],
    queryFn: async () => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/inventory-surplus`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    },
    staleTime: 0, // Always consider data stale to ensure fresh data after mutations
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnReconnect: true, // Refetch when internet reconnects
    refetchOnMount: true, // Always refetch when component mounts
  });
}

export function useSurplusInventoryItem(id: string | number | null) {
  return useQuery({
    queryKey: ["inventory-surplus", id],
    queryFn: async () => {
      const token = getToken();
      const response = await fetch(
        `${API_BASE_URL}/api/inventory-surplus/${id}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useAddSurplusInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/inventory-surplus`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(item),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-surplus"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "surplus"] });
      toast.success("Surplus inventory added successfully!");
    },
    onError: (error: any) => {
      toast.error(`Failed to add surplus item: ${error.message}`);
    },
  });
}

export function useUpdateSurplusInventory(id: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const token = getToken();
      const response = await fetch(
        `${API_BASE_URL}/api/inventory-surplus/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(item),
        }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-surplus"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-surplus", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Surplus inventory updated successfully!");
    },
    onError: (error: any) => {
      toast.error(`Failed to update surplus item: ${error.message}`);
    },
  });
}

export function useDeleteSurplusInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | number) => {
      const token = getToken();
      const response = await fetch(
        `${API_BASE_URL}/api/inventory-surplus/${id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-surplus"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Surplus inventory deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete surplus item: ${error.message}`);
    },
  });
}

export function useTransferToSurplus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      item_id: number;
      quantity: number;
      reason?: string;
    }) => {
      const token = getToken();
      const response = await fetch(
        `${API_BASE_URL}/api/inventory-surplus/transfer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-today"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-surplus"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Item transferred to surplus inventory!");
    },
    onError: (error: any) => {
      toast.error(`Failed to transfer to surplus: ${error.message}`);
    },
  });
}

// =============================================================================
// SPOILAGE QUERIES
// =============================================================================

export function useSpoilageList() {
  return useQuery({
    queryKey: ["inventory-spoilage"],
    queryFn: async () => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/inventory-spoilage`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    },
    staleTime: 0, // Always consider data stale to ensure fresh data after mutations
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnReconnect: true, // Refetch when internet reconnects
    refetchOnMount: true, // Always refetch when component mounts
  });
}

export function useSpoilageItem(id: string | number | null) {
  return useQuery({
    queryKey: ["inventory-spoilage", id],
    queryFn: async () => {
      const token = getToken();
      const response = await fetch(
        `${API_BASE_URL}/api/inventory-spoilage/${id}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useTransferToSpoilage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      item_id: number;
      quantity: number;
      reason?: string;
    }) => {
      const token = getToken();
      const response = await fetch(
        `${API_BASE_URL}/api/inventory-spoilage/transfer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-today"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-spoilage"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "spoilage"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "expired"] });
      toast.success("Item transferred to spoilage!");
    },
    onError: (error: any) => {
      toast.error(`Failed to transfer to spoilage: ${error.message}`);
    },
  });
}

export function useDeleteSpoilage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | number) => {
      const token = getToken();
      const response = await fetch(
        `${API_BASE_URL}/api/inventory-spoilage/${id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-spoilage"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Spoilage record deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete spoilage record: ${error.message}`);
    },
  });
}
