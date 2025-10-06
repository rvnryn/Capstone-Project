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
        throw new Error("Failed to fetch users");
      }

      return response.json();
    } catch (error: any) {
      console.error("Failed to fetch users:", error);
      return [];
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

  // Change another user's password (owner/admin only) using auth_id
  const changeUserPassword = useCallback(
    async (auth_id: string, new_password: string) => {
      return handleOfflineWriteOperation(
        async () => {
          const response = await fetch("/api/admin/change-password", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
            },
            body: JSON.stringify({ auth_id, new_password }),
          });

          if (!response.ok) {
            throw new Error("Failed to change user password");
          }

          return response.json();
        },
        {
          action: "change-user-password",
          endpoint: "/api/admin/change-password",
          method: "POST",
          payload: { auth_id, new_password },
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
