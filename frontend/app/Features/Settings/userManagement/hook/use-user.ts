import { useOfflineQueue } from "@/app/hooks/usePWA";
import { useCallback } from "react";
import { toast } from "react-toastify";
import { getToken } from "@/app/lib/auth";

export interface User {
  password: any;
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_BASE = `${API_BASE_URL}/api/users`;

export function useUsersAPI() {
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
          data: offlineAction.payload,
        });

        // Store the action in localStorage for immediate UI feedback
        const tempId = Date.now();
        const localKey = `offline_${offlineAction.action}_${tempId}`;

        if (offlineAction.method === "POST") {
          // For create operations, store with temporary ID
          const newUser = {
            ...offlineAction.payload,
            user_id: tempId,
            status: "pending_sync",
            created_at: new Date().toISOString(),
          };
          localStorage.setItem(localKey, JSON.stringify(newUser));
          toast.success(`User created offline! Will sync when online.`);
          return newUser;
        } else if (offlineAction.method === "PUT") {
          // For update operations, update cached data
          const existingUsers = JSON.parse(
            localStorage.getItem("cached_users") || "[]"
          );
          const updatedUsers = existingUsers.map((user: User) =>
            user.user_id === offlineAction.payload.user_id
              ? { ...user, ...offlineAction.payload, status: "pending_sync" }
              : user
          );
          localStorage.setItem("cached_users", JSON.stringify(updatedUsers));
          toast.success(`User updated offline! Will sync when online.`);
          return { ...offlineAction.payload, status: "pending_sync" };
        } else if (offlineAction.method === "DELETE") {
          // For delete operations, mark as deleted locally
          const existingUsers = JSON.parse(
            localStorage.getItem("cached_users") || "[]"
          );
          const updatedUsers = existingUsers.map((user: User) =>
            user.user_id === offlineAction.payload.user_id
              ? { ...user, status: "pending_delete" }
              : user
          );
          localStorage.setItem("cached_users", JSON.stringify(updatedUsers));
          toast.success(`User marked for deletion! Will sync when online.`);
          return { success: true, offline: true };
        }

        toast.success(`Action queued for sync when online!`);
        return { success: true, offline: true, queued: true };
      }
    },
    [isOnline, addOfflineAction]
  );

  const listUsers = useCallback(async () => {
    try {
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

      // Cache successful response
      localStorage.setItem("cached_users", JSON.stringify(data));

      return data;
    } catch (error: any) {
      console.log(
        "Failed to fetch users - trying cached data or sample data:",
        error
      );

      // Try to load from cache first
      const cached = localStorage.getItem("cached_users");
      if (cached) {
        try {
          const cachedData = JSON.parse(cached);
          console.log("Using cached users data");
          return cachedData;
        } catch (cacheError) {
          console.error("Failed to parse cached users:", cacheError);
        }
      }

      // Return sample data if no cache available (for testing offline functionality)
      console.log("No cached users available, using sample data for testing");

      const sampleUsers = [
        {
          user_id: 1,
          auth_id: "sample-auth-1",
          name: "Admin User",
          username: "admin",
          email: "admin@cardiacdelights.com",
          user_role: "Owner",
          status: "active",
          last_login: "2024-10-11T10:00:00Z",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-10-11T10:00:00Z",
        },
        {
          user_id: 2,
          auth_id: "sample-auth-2",
          name: "Manager User",
          username: "manager",
          email: "manager@cardiacdelights.com",
          user_role: "Manager",
          status: "active",
          last_login: "2024-10-11T09:30:00Z",
          created_at: "2024-02-01T00:00:00Z",
          updated_at: "2024-10-11T09:30:00Z",
        },
        {
          user_id: 3,
          auth_id: "sample-auth-3",
          name: "Staff User",
          username: "staff",
          email: "staff@cardiacdelights.com",
          user_role: "Staff",
          status: "active",
          last_login: "2024-10-11T08:00:00Z",
          created_at: "2024-03-01T00:00:00Z",
          updated_at: "2024-10-11T08:00:00Z",
        },
      ];

      return sampleUsers;
    }
  }, []);

  const getUser = useCallback(async (id: number | string) => {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user ${id}`);
      }

      return response.json();
    } catch (error: any) {
      console.error(`Failed to fetch user ${id}:`, error);
      throw error;
    }
  }, []);
  const createUser = async (data: CreateUserPayload) => {
    return handleOfflineWriteOperation(
      async () => {
        const response = await fetch(`${API_BASE}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error("Failed to create user");
        }

        return response.json();
      },
      {
        action: "create-user",
        endpoint: `${API_BASE}`,
        method: "POST",
        payload: data,
      }
    );
  };

  const updateUser = useCallback(
    async (id: number | string, user: UpdateUserPayload) => {
      return handleOfflineWriteOperation(
        async () => {
          const response = await fetch(`${API_BASE}/${id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
            },
            body: JSON.stringify(user),
          });

          if (!response.ok) {
            throw new Error("Failed to update user");
          }

          return response.json();
        },
        {
          action: "update-user",
          endpoint: `${API_BASE}/${id}`,
          method: "PUT",
          payload: user,
        }
      );
    },
    [handleOfflineWriteOperation]
  );

  const deleteUser = useCallback(
    async (id: number | string) => {
      return handleOfflineWriteOperation(
        async () => {
          const response = await fetch(`${API_BASE}/${id}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
            },
          });

          if (!response.ok) {
            throw new Error("Failed to delete user");
          }

          return response.json();
        },
        {
          action: "delete-user",
          endpoint: `${API_BASE}/${id}`,
          method: "DELETE",
          payload: { id },
        }
      );
    },
    [handleOfflineWriteOperation]
  );


  // Change another user's password (owner/admin only) using auth_id, with admin password confirmation
  const changeUserPassword = useCallback(
    async (auth_id: string, new_password: string, admin_password: string) => {
      return handleOfflineWriteOperation(
        async () => {
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
            throw new Error(errorData.detail || errorData.error || "Failed to change user password");
          }

          return response.json();
        },
        {
          action: "change-user-password",
          endpoint: "/api/admin/change-password",
          method: "POST",
          payload: { auth_id, new_password, admin_password },
        }
      );
    },
    [handleOfflineWriteOperation]
  );

  return {
    listUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    changeUserPassword,
  };
}
