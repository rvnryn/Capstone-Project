import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";

export function useDashboardQuery() {
  const queryClient = useQueryClient();
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  console.log("API_BASE_URL (runtime):", API_BASE_URL);
  // Low Stock
  const lowStock = useQuery({
    queryKey: ["dashboard", "low-stock"],
    queryFn: async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/dashboard/low-stock`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        localStorage.setItem("cached_low_stock", JSON.stringify(data));
        return data;
      } catch (error) {
        console.log("Low stock API failed - using cached data");
        const cached = localStorage.getItem("cached_low_stock");
        return cached ? JSON.parse(cached) : [];
      }
    },
  refetchInterval: false,
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  });

  // Expiring
  const expiring = useQuery({
    queryKey: ["dashboard", "expiring"],
    queryFn: async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/dashboard/expiring-ingredients`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        localStorage.setItem("cached_expiring", JSON.stringify(data));
        return data;
      } catch (error) {
        console.log("Expiring ingredients API failed - using cached data");
        const cached = localStorage.getItem("cached_expiring");
        return cached ? JSON.parse(cached) : [];
      }
    },
    refetchInterval: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Surplus
  const surplus = useQuery({
    queryKey: ["dashboard", "surplus"],
    queryFn: async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/dashboard/surplus-ingredients`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        localStorage.setItem("cached_surplus", JSON.stringify(data));
        return data;
      } catch (error) {
        console.log("Surplus ingredients API failed - using cached data");
        const cached = localStorage.getItem("cached_surplus");
        return cached ? JSON.parse(cached) : [];
      }
    },
    refetchInterval: false,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  }); // <-- Add closing brace and comma for surplus query

  // Expired
  const expired = useQuery({
    queryKey: ["dashboard", "expired"],
    queryFn: async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/dashboard/expired-ingredients?skip=0&limit=50`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        const formatted = Array.isArray(data)
          ? data.map((item) => ({
              id: item.id ?? null,
              item_id: item.item_id ?? null,
              item_name: item.item_name || "N/A",
              category: item.category || "N/A",
              stock: item.stock ?? 0,
              batch_date: item.batch_date || "N/A",
              quantity_spoiled: item.quantity_spoiled ?? item.quantity ?? 0,
              expiration_date: item.expiration_date || "N/A",
              spoilage_date: item.spoilage_date || "N/A",
              updated_at: item.updated_at ?? null,
            }))
          : [];

        localStorage.setItem("cached_expired", JSON.stringify(formatted));
        return formatted;
      } catch (error) {
        console.log("Expired items API failed - using cached data");
        const cached = localStorage.getItem("cached_expired");
        return cached ? JSON.parse(cached) : [];
      }
    },
    refetchInterval: false,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Custom Holidays
  const customHolidays = useQuery({
    queryKey: ["dashboard", "custom-holidays"],
    queryFn: async () => {
      try {
  const response = await fetch(`${API_BASE_URL}/api/custom-holidays/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        localStorage.setItem("cached_custom_holidays", JSON.stringify(data));
        return data;
      } catch (error) {
        console.log("Custom holidays API failed - using cached data");
        const cached = localStorage.getItem("cached_custom_holidays");
        return cached ? JSON.parse(cached) : [];
      }
    },
    refetchInterval: false,
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // --- Mutations for custom holiday management ---
  const addHoliday = useMutation({
    mutationFn: async (data: {
      date: string;
      name: string;
      description?: string;
    }) => {
  const response = await fetch(`${API_BASE_URL}/api/custom-holidays/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["dashboard", "custom-holidays"],
      });
    },
  });

  const editHoliday = useMutation({
    mutationFn: async (data: {
      id: number;
      date: string;
      name: string;
      description?: string;
    }) => {
      const response = await fetch(
        `${API_BASE_URL}/api/custom-holidays/${data.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["dashboard", "custom-holidays"],
      });
    },
  });

  const deleteHoliday = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(
        `${API_BASE_URL}/api/custom-holidays/${id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["dashboard", "custom-holidays"],
      });
    },
  });

  const outOfStock = useQuery({
    queryKey: ["dashboard", "out-of-stock"],
    queryFn: async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/dashboard/out-of-stock`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        localStorage.setItem("cached_out_of_stock", JSON.stringify(data));
        return data;
      } catch (error) {
        console.log("Out of stock API failed - using cached data");
        const cached = localStorage.getItem("cached_out_of_stock");
        return cached ? JSON.parse(cached) : [];
      }
    },
  refetchInterval: false,
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  });

  const spoilage = useQuery({
    queryKey: ["dashboard", "spoilage"],
    queryFn: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/spoilage`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        localStorage.setItem("cached_spoilage", JSON.stringify(data));
        return data;
      } catch (error) {
        console.log("Spoilage API failed - using cached data");
        const cached = localStorage.getItem("cached_spoilage");
        return cached ? JSON.parse(cached) : [];
      }
    },
  refetchInterval: false,
  staleTime: 10 * 60 * 1000,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  });

  return {
    lowStock,
    outOfStock,
    expiring,
    surplus,
    expired,
    spoilage,
    customHolidays,
    addHoliday,
    editHoliday,
    deleteHoliday,
    queryClient,
  };
}
