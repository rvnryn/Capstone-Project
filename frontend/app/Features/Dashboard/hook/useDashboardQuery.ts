import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";

export function useDashboardQuery() {
  const queryClient = useQueryClient();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  console.log("API_BASE_URL (runtime):", API_BASE_URL);
  // Low Stock
  const lowStock = useQuery({
    queryKey: ["dashboard", "low-stock"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/low-stock`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    },
    // Only refetch on window focus or manual
    refetchInterval: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Expiring
  const expiring = useQuery({
    queryKey: ["dashboard", "expiring"],
    queryFn: async () => {
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

      return await response.json();
    },
    refetchInterval: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Surplus
  const surplus = useQuery({
    queryKey: ["dashboard", "surplus"],
    queryFn: async () => {
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

      return await response.json();
    },
    refetchInterval: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Expired
  const expired = useQuery({
    queryKey: ["dashboard", "expired"],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/dashboard/expired-ingredients`,
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

      return await response.json();
    },
    refetchInterval: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Custom Holidays
  const customHolidays = useQuery({
    queryKey: ["dashboard", "custom-holidays"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/custom-holidays`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    },
    refetchInterval: false,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // --- Mutations for custom holiday management ---
  const addHoliday = useMutation({
    mutationFn: async (data: {
      date: string;
      name: string;
      description?: string;
    }) => {
      const response = await fetch(`${API_BASE_URL}/api/custom-holidays`, {
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

      return await response.json();
    },
    refetchInterval: false,
    staleTime: 5 * 60 * 1000,
  });

  const spoilage = useQuery({
    queryKey: ["dashboard", "spoilage"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/spoilage`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    },
    refetchInterval: false,
    staleTime: 10 * 60 * 1000,
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
