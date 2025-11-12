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

export function useUsersAPI() {
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const API_BASE = `${API_BASE_URL}/api/users`;

  const listUsers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
      });
      if (!response.ok)
        throw new Error(`Failed to fetch users: ${response.status}`);
      return await response.json();
    } catch (error: any) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to fetch users. Please try again.");
      throw error;
    }
  }, [API_BASE]);

  const getUser = useCallback(
    async (id: number | string) => {
      try {
        const response = await fetch(`${API_BASE}/${id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
          },
        });
        if (!response.ok) throw new Error(`Failed to fetch user ${id}`);
        return await response.json();
      } catch (error: any) {
        console.error(`Failed to fetch user ${id}:`, error);
        toast.error(`Failed to fetch user. Please try again.`);
        throw error;
      }
    },
    [API_BASE]
  );

  const createUser = useCallback(
    async (data: CreateUserPayload) => {
      try {
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
        return response.json();
      } catch (error: any) {
        console.error("Failed to create user:", error);
        toast.error(error.message || "Failed to create user. Please try again.");
        throw error;
      }
    },
    [API_BASE]
  );

  const updateUser = useCallback(
    async (id: number | string, user: UpdateUserPayload) => {
      try {
        const response = await fetch(`${API_BASE}/${id}`, {
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
        return response.json();
      } catch (error: any) {
        console.error("Failed to update user:", error);
        toast.error(error.message || "Failed to update user. Please try again.");
        throw error;
      }
    },
    [API_BASE]
  );

  const deleteUser = useCallback(
    async (id: number | string) => {
      try {
        const response = await fetch(`${API_BASE}/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
          },
        });
        if (!response.ok) throw new Error("Failed to delete user");
        return response.json();
      } catch (error: any) {
        console.error("Failed to delete user:", error);
        toast.error("Failed to delete user. Please try again.");
        throw error;
      }
    },
    [API_BASE]
  );

  // Change another user's password (owner/admin only) using auth_id, with admin password confirmation
  const changeUserPassword = useCallback(
    async (auth_id: string, new_password: string, admin_password: string) => {
      try {
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
      } catch (error: any) {
        console.error("Failed to change user password:", error);
        toast.error(
          error.message || "Failed to change user password. Please try again."
        );
        throw error;
      }
    },
    []
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
