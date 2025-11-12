import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";

export function useDashboardQuery() {
  const queryClient = useQueryClient();
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  console.log("API_BASE_URL (runtime):", API_BASE_URL);
  // Low Stock - AUTO-REFRESHES every 2 minutes for real-time updates!
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
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
    staleTime: 1 * 60 * 1000, // Consider data fresh for 1 minute
    refetchOnWindowFocus: true, // Refresh when user returns to tab
    refetchOnReconnect: true, // Refresh when internet reconnects
  });

  // Expiring - AUTO-REFRESHES every 2 minutes
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
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
    staleTime: 1 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
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
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes (less critical)
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Expired - AUTO-REFRESHES every 5 minutes
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
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Custom Holidays - Refreshes on demand
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
    staleTime: 10 * 60 * 1000, // Holidays don't change often
    refetchOnWindowFocus: false, // Don't auto-refresh holidays
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

  // Out of Stock - With table parameter for multi-batch support
  const outOfStock = useQuery({
    queryKey: ["dashboard", "out-of-stock", "inventory_today"],
    queryFn: async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/dashboard/out-of-stock?table=inventory_today`,
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
    staleTime: 0, // Always fresh data for inventory changes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
  });

  // Spoilage - AUTO-REFRESHES every 5 minutes
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
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
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
