/**
 * React Query hooks for User Management module with real-time updates
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
const API_BASE = `${API_BASE_URL}/api/users`;

// =============================================================================
// TYPES
// =============================================================================

export interface User {
  password?: any;
  user_id?: number | string; // App PK (int)
  auth_id?: string; // Supabase Auth UUID
  name: string;
  username: string;
  email: string;
  user_role: string;
  status?: string;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
}

export type CreateUserPayload = Omit<
  User,
  "user_id" | "created_at" | "updated_at"
>;
export type UpdateUserPayload = Partial<CreateUserPayload>;

// =============================================================================
// QUERY HOOKS (Fetching Data)
// =============================================================================

/**
 * Fetch all users
 * Auto-refreshes every 3 minutes
 */
export function useUserList() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async (): Promise<User[]> => {
      const response = await fetch(`${API_BASE}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }

      const data = await response.json();

      // Process users and cache for offline support
      const processedUsers = Array.isArray(data)
        ? data.map((user: User) => ({
            ...user,
            last_login: user.last_login ?? "",
          }))
        : [];

      if (typeof window !== "undefined") {
        localStorage.setItem("cached_users", JSON.stringify(processedUsers));
      }

      return processedUsers;
    },
    staleTime: 0, // Always consider data stale to ensure fresh data after mutations
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnReconnect: true, // Refetch when internet reconnects
    refetchOnMount: true, // Always refetch when component mounts
  });
}

/**
 * Fetch a single user by ID
 * Auto-refreshes every 3 minutes
 */
export function useUser(user_id: number | string | null) {
  return useQuery({
    queryKey: ["users", user_id],
    queryFn: async (): Promise<User> => {
      if (!user_id) {
        throw new Error("User ID is required");
      }

      const response = await fetch(`${API_BASE}/${user_id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user ${user_id}`);
      }

      return await response.json();
    },
    enabled: !!user_id, // Only run query if user_id exists
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
 * Create a new user
 * Automatically invalidates user list after success
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserPayload) => {
      const response = await fetch(`${API_BASE}`, {
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
          errorData.detail || errorData.message || "Failed to create user";
        throw new Error(errorMessage);
      }

      return await response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch user list
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User created successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create user. Please try again.");
    },
  });
}

/**
 * Update an existing user
 * Automatically invalidates user list and specific user after success
 */
export function useUpdateUser(user_id: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: UpdateUserPayload) => {
      const response = await fetch(`${API_BASE}/${user_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
        body: JSON.stringify(user),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.detail || errorData.message || "Failed to update user";
        throw new Error(errorMessage);
      }

      return await response.json();
    },
    onSuccess: () => {
      // Invalidate both user list and specific user
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", user_id] });
      toast.success("User updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update user. Please try again.");
    },
  });
}

/**
 * Delete a user
 * Automatically invalidates user list after success
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user_id: number | string) => {
      const response = await fetch(`${API_BASE}/${user_id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      return await response.json();
    },
    onSuccess: () => {
      // Invalidate user list
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted successfully!");
    },
    onError: (error: any) => {
      toast.error("Failed to delete user. Please try again.");
    },
  });
}

/**
 * Change user password (admin/owner only)
 * Requires admin password confirmation
 */
export function useChangeUserPassword() {
  return useMutation({
    mutationFn: async ({
      auth_id,
      new_password,
      admin_password,
    }: {
      auth_id: string;
      new_password: string;
      admin_password: string;
    }) => {
      const response = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
        body: JSON.stringify({ auth_id, new_password, admin_password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail ||
            errorData.error ||
            "Failed to change user password"
        );
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Password changed successfully!");
    },
    onError: (error: any) => {
      toast.error(
        error.message || "Failed to change password. Please try again."
      );
    },
  });
}
