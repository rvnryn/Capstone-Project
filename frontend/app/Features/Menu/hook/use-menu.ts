import axiosInstance from "@/app/lib/axios";

export interface MenuItem {
     menu_id: number;
     dish_name: string;
     image_url: string;
     category: string;
     price: number;
     stock_status?: string;
     ingredients?: MenuIngredient[];
}

export interface MenuIngredient {
     menu_id?: number;
     ingredient_id?: number;
     name?: string; // for new/edited ingredients
     ingredient_name?: string; // for compatibility
     quantity?: string;
}

export function useMenuAPI() {
     // Menu endpoints
     const fetchMenu = async (): Promise<MenuItem[]> => {
          const res = await axiosInstance.get("/api/menu");
          return res.data;
     };

     // PATCH menu (JSON, no image)
     const updateMenu = async (
          menu_id: number,
          data: Partial<MenuItem> & { ingredients?: MenuIngredient[] }
     ) => {
          const res = await axiosInstance.patch(`/api/menu/${menu_id}`, data);
          return res.data;
     };

     // PATCH menu with image and ingredients (FormData)
     const updateMenuWithImageAndIngredients = async (
          menu_id: number,
          form: FormData
     ) => {
          const res = await axiosInstance.patch(
               `/api/menu/${menu_id}/update-with-image-and-ingredients`,
               form,
               {
                    headers: { "Content-Type": "multipart/form-data" },
               }
          );
          return res.data;
     };

     const deleteMenu = async (menu_id: number) => {
          const res = await axiosInstance.delete(`/api/menu/${menu_id}`);
          return res.data;
     };

     // Add menu with image and ingredients (FormData)
     const addMenuWithImageAndIngredients = async (form: FormData) => {
          const res = await axiosInstance.post("/api/menu/create-with-image-and-ingredients", form, {
               headers: { "Content-Type": "multipart/form-data" },
          });
          return res.data;
     };

     const fetchMenuById = async (menu_id: number) => {
          const res = await axiosInstance.get(`/api/menu/${menu_id}`);
          return res.data;
     };

     return {
          fetchMenu,
          addMenuWithImageAndIngredients,
          updateMenu,
          updateMenuWithImageAndIngredients,
          fetchMenuById,
          deleteMenu,
     };
}
