import { useCallback } from "react";
import axios from "@/app/lib/axios";

export function useDashboardAPI() {
     // Fetch low stock ingredients
     const fetchLowStock = useCallback(async () => {
          const response = await axios.get("/api/dashboard/low-stock");
          return response.data;
     }, []);

     // Fetch expiring ingredients
     const fetchExpiring = useCallback(async () => {
          const response = await axios.get("/api/dashboard/expiring-ingredients");
          return response.data;
     }, []);

     // Fetch surplus ingredients
     const fetchSurplus = useCallback(async () => {
          const response = await axios.get("/api/dashboard/surplus-ingredients");
          return response.data;
     }, []);

     return {
          fetchLowStock,
          fetchExpiring,
          fetchSurplus,
     };
}
