import axiosInstance from "@/app/lib/axios";
import { useCallback } from "react";

export interface User {
  password: any;
  user_id?: number | string; // App PK (int)
  auth_id?: string;          // Supabase Auth UUID
  name: string;
  username: string;
  email: string;
  user_role: string;
  status?: string;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
}


export type CreateUserPayload = Omit<User, "user_id" | "created_at" | "updated_at">;
export type UpdateUserPayload = Partial<CreateUserPayload>;

const API_BASE = "/api/users";

export function useUsersAPI() {
  const listUsers = useCallback(async () => {
    const response = await axiosInstance.get<User[]>(`${API_BASE}`);
    return response.data;
  }, []);

  const getUser = useCallback(async (id: number | string) => {
    const response = await axiosInstance.get<User>(`${API_BASE}/${id}`);
    return response.data;
  }, []);

  const createUser = async (data: CreateUserPayload) => {
    return axiosInstance.post(`${API_BASE}`, data);
  };

  const updateUser = useCallback(async (id: number | string, user: UpdateUserPayload) => {
    const response = await axiosInstance.put<User>(`${API_BASE}/${id}`, user);
    return response.data;
  }, []);

  const deleteUser = useCallback(async (id: number | string) => {
    const response = await axiosInstance.delete(`${API_BASE}/${id}`);
    return response.data;
  }, []);

  // Change another user's password (owner/admin only) using auth_id
  const changeUserPassword = useCallback(async (auth_id: string, new_password: string) => {
    const response = await axiosInstance.post("/api/admin/change-password", {
      auth_id,
      new_password,
    });
    return response.data;
  }, []);

  return {
    listUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    changeUserPassword,
  };
}