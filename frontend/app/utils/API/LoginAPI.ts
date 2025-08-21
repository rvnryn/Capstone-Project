"use client";
import axios from "@/app/lib/axios";

export async function loginUser(email: string, password: string) {
  try {
    const response = await axios.post("/api/auth/login", {
      email,
      password,
    });
    if (response.data?.access_token) {
      localStorage.setItem("token", response.data.access_token);
    }
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || "Login failed");
  }
}

export async function logoutUser() {
  const token = localStorage.getItem("token");
  if (!token) return;
  try {
    await axios.post(
      "/api/auth/logout",
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    localStorage.removeItem("token");
  } catch (error: any) {
    // Optionally handle error
    console.error(
      "Logout failed:",
      error.response?.data?.detail || error.message
    );
  }
}
