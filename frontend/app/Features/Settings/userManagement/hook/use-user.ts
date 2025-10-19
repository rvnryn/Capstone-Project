import { useCallback } from "react";
import { useOfflineAPI, useOffline } from "@/app/context/OfflineContext";
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

export function useUserAPI() {
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const API_BASE = `${API_BASE_URL}/api/users`;

  const { offlineReadyFetch } = useOfflineAPI();
  const { queueOfflineAction } = useOffline();

  const listUsers = useCallback(async () => {
    try {
      const response = await offlineReadyFetch(
        `${API_BASE}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
          },
        },
        "user-list",
        24
      );
      if (!response.ok)
        throw new Error(`Failed to fetch users: ${response.status}`);
      return await response.json();
    } catch (error: any) {
      console.log("Failed to fetch users - using sample data:", error);
      // Return sample data if no cache available (for testing offline functionality)
      return [
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
    }
  }, [API_BASE, offlineReadyFetch, getToken]);

  const getUser = useCallback(
    async (id: number | string) => {
      try {
        const response = await offlineReadyFetch(
          `${API_BASE}/${id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
            },
          },
          `user-${id}`,
          24
        );
        if (!response.ok) throw new Error(`Failed to fetch user ${id}`);
        return await response.json();
      } catch (error: any) {
        console.error(`Failed to fetch user ${id}:`, error);
        throw error;
      }
    },
    [API_BASE, offlineReadyFetch, getToken]
  );
  const createUser = async (data: CreateUserPayload) => {
    if (navigator.onLine) {
      const response = await fetch(`${API_BASE}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create user");
      return response.json();
    } else {
      queueOfflineAction({
        type: "create-user",
        endpoint: `${API_BASE}`,
        method: "POST",
        payload: data,
      });
      toast.success(`User created offline! Will sync when online.`);
      return { ...data, status: "pending_sync" };
    }
  };

  const updateUser = useCallback(
    async (id: number | string, user: UpdateUserPayload) => {
      if (navigator.onLine) {
        const response = await fetch(`${API_BASE}/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
          },
          body: JSON.stringify(user),
        });
        if (!response.ok) throw new Error("Failed to update user");
        return response.json();
      } else {
        queueOfflineAction({
          type: "update-user",
          endpoint: `${API_BASE}/${id}`,
          method: "PUT",
          payload: user,
        });
        toast.success(`User updated offline! Will sync when online.`);
        return { ...user, status: "pending_sync" };
      }
    },
    [API_BASE, queueOfflineAction, getToken]
  );

  const deleteUser = useCallback(
    async (id: number | string) => {
      if (navigator.onLine) {
        const response = await fetch(`${API_BASE}/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
          },
        });
        if (!response.ok) throw new Error("Failed to delete user");
        return response.json();
      } else {
        queueOfflineAction({
          type: "delete-user",
          endpoint: `${API_BASE}/${id}`,
          method: "DELETE",
          payload: { id },
        });
        toast.success(`User marked for deletion! Will sync when online.`);
        return { success: true, offline: true };
      }
    },
    [API_BASE, queueOfflineAction, getToken]
  );

  // Change another user's password (owner/admin only) using auth_id, with admin password confirmation
  const changeUserPassword = useCallback(
    async (auth_id: string, new_password: string, admin_password: string) => {
      if (navigator.onLine) {
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
        return response.json();
      } else {
        queueOfflineAction({
          type: "change-user-password",
          endpoint: "/api/admin/change-password",
          method: "POST",
          payload: { auth_id, new_password, admin_password },
        });
        toast.success(`Password change queued offline! Will sync when online.`);
        return { success: true, offline: true, queued: true };
      }
    },
    [queueOfflineAction, getToken]
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
