import { useCallback } from "react";
import { toast } from "react-toastify";

export interface MenuItem {
  menu_id: number;
  itemcode: string;
  dish_name: string;
  image_url: string;
  category: string;
  price: number;
  description?: string;
  stock_status?: string;
  created_at?: string;
  updated_at?: string;
  ingredients?: MenuIngredient[];
}

export interface MenuIngredient {
  menu_id?: number;
  ingredient_id?: number;
  name?: string;
  ingredient_name?: string;
  quantity?: string;
  is_unavailable?: boolean;
  stock_quantity?: number;
}

export function useMenuAPI() {
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const getToken = useCallback(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  }, []);

  // Fetch all menu items
  const fetchMenu = useCallback(async (): Promise<MenuItem[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/menu`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error: any) {
      console.error("[fetchMenu] Failed to fetch menu:", error);
      toast.error(`Failed to fetch menu: ${error.message}`);
      throw error;
    }
  }, [API_BASE_URL]);

  // Add menu with image and ingredients
  const addMenuWithImageAndIngredients = useCallback(
    async (form: FormData) => {
      try {
        const token = getToken();
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch(
          `${API_BASE_URL}/api/menu/create-with-image-and-ingredients`,
          { method: "POST", headers, body: form }
        );
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
      } catch (error: any) {
        console.error("Error adding menu with image and ingredients:", error);
        toast.error(`Failed to add menu: ${error.message}`);
        throw error;
      }
    },
    [API_BASE_URL, getToken]
  );

  // Update menu (JSON, no image)
  const updateMenu = useCallback(
    async (
      menu_id: number,
      data: Partial<MenuItem> & { ingredients?: MenuIngredient[] }
    ) => {
      try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/api/menu/${menu_id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(data),
        });
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
      } catch (error: any) {
        console.error("Error updating menu:", error);
        toast.error(`Failed to update menu: ${error.message}`);
        throw error;
      }
    },
    [API_BASE_URL, getToken]
  );

  // Update menu with image and ingredients
  const updateMenuWithImageAndIngredients = useCallback(
    async (menu_id: number, form: FormData) => {
      try {
        const token = getToken();
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch(
          `${API_BASE_URL}/api/menu/${menu_id}/update-with-image-and-ingredients`,
          { method: "PATCH", headers, body: form }
        );
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
      } catch (error: any) {
        console.error("Error updating menu with image and ingredients:", error);
        toast.error(`Failed to update menu: ${error.message}`);
        throw error;
      }
    },
    [API_BASE_URL, getToken]
  );

  // Delete menu
  const deleteMenu = useCallback(
    async (menu_id: number) => {
      try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/api/menu/${menu_id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
      } catch (error: any) {
        console.error("Error deleting menu:", error);
        toast.error(`Failed to delete menu: ${error.message}`);
        throw error;
      }
    },
    [API_BASE_URL, getToken]
  );

  // Fetch menu by ID
  const fetchMenuById = useCallback(
    async (menu_id: number) => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/menu/${menu_id}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
      } catch (error: any) {
        console.error(`Failed to fetch menu item ${menu_id}:`, error);
        toast.error(`Failed to fetch menu item: ${error.message}`);
        throw error;
      }
    },
    [API_BASE_URL]
  );

  // Delete ingredient from menu
  const deleteIngredientFromMenu = useCallback(
    async (menu_id: number, ingredient_id: string) => {
      try {
        const token = getToken();
        const response = await fetch(
          `${API_BASE_URL}/api/menu/${menu_id}/ingredient/${ingredient_id}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          }
        );
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
      } catch (error: any) {
        console.error("Error deleting ingredient from menu:", error);
        toast.error(`Failed to delete ingredient: ${error.message}`);
        throw error;
      }
    },
    [API_BASE_URL, getToken]
  );

  // Recalculate stock status
  const recalculateStockStatus = useCallback(async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/menu/recalc`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error: any) {
      console.error("Error recalculating stock status:", error);
      toast.error(`Failed to recalculate stock status: ${error.message}`);
      throw error;
    }
  }, [API_BASE_URL, getToken]);

  return {
    fetchMenu,
    addMenuWithImageAndIngredients,
    updateMenu,
    updateMenuWithImageAndIngredients,
    fetchMenuById,
    recalculateStockStatus,
    deleteMenu,
    deleteIngredientFromMenu,
  };
}
