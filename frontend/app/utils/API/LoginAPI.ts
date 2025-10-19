"use client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function loginUser(email: string, password: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ detail: "Login failed" }));
      throw new Error(errorData.detail || "Login failed");
    }

    const data = await response.json();
    if (data?.access_token) {
      localStorage.setItem("token", data.access_token);
      // Save user and role for offline persistence
      if (data?.user) {
        // Ensure cachedUser always has an 'id' property
        const cachedUser = {
          ...data.user,
          id: data.user.id || data.user.user_id || null,
        };
        localStorage.setItem("cachedUser", JSON.stringify(cachedUser));
      }
      if (data?.role) {
        localStorage.setItem("cachedRole", data.role);
      }
    }
    return data;
  } catch (error: any) {
    throw new Error(error.message || "Login failed");
  }
}

export async function logoutUser() {
  const token = localStorage.getItem("token");
  if (!token) return;
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    // Remove token regardless of response status
    localStorage.removeItem("token");

    if (!response.ok) {
      console.error("Logout request failed, but token removed locally");
    }
  } catch (error: any) {
    // Optionally handle error
    console.error("Logout failed:", error.message || "Unknown error");
    // Still remove token even if logout request fails
    localStorage.removeItem("token");
  }
}
