import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { offlineAxiosRequest } from "@/app/utils/offlineAxios";

export function useDashboardQuery() {
  const queryClient = useQueryClient();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
  console.log("API_BASE_URL (runtime):", API_BASE_URL);
  // Low Stock
  const lowStock = useQuery({
    queryKey: ["dashboard", "low-stock"],
    queryFn: async () => {
      const response = await offlineAxiosRequest(
        {
          method: "GET",
          url: `${API_BASE_URL}/api/dashboard/low-stock`,
        },
        {
          cacheKey: "dashboard-low-stock",
          cacheHours: 24,
          showErrorToast: true,
          fallbackData: [],
        }
      );
      return response.data;
    },
    // Only refetch on window focus or manual
    refetchInterval: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Expiring
  const expiring = useQuery({
    queryKey: ["dashboard", "expiring"],
    queryFn: async () => {
      const response = await offlineAxiosRequest(
        {
          method: "GET",
          url: `${API_BASE_URL}/api/dashboard/expiring-ingredients`,
        },
        {
          cacheKey: "dashboard-expiring",
          cacheHours: 12,
          showErrorToast: true,
          fallbackData: [],
        }
      );
      return response.data;
    },
    refetchInterval: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Surplus
  const surplus = useQuery({
    queryKey: ["dashboard", "surplus"],
    queryFn: async () => {
      const response = await offlineAxiosRequest(
        {
          method: "GET",
          url: `${API_BASE_URL}/api/dashboard/surplus-ingredients`,
        },
        {
          cacheKey: "dashboard-surplus",
          cacheHours: 48,
          showErrorToast: true,
          fallbackData: [],
        }
      );
      return response.data;
    },
    refetchInterval: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Expired
  const expired = useQuery({
    queryKey: ["dashboard", "expired"],
    queryFn: async () => {
      const response = await offlineAxiosRequest(
        {
          method: "GET",
          url: `${API_BASE_URL}/api/dashboard/expired-ingredients`,
        },
        {
          cacheKey: "dashboard-expired",
          cacheHours: 24,
          showErrorToast: true,
          fallbackData: [],
        }
      );
      return response.data;
    },
    refetchInterval: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Custom Holidays
  const customHolidays = useQuery({
    queryKey: ["dashboard", "custom-holidays"],
    queryFn: async () => {
      const response = await offlineAxiosRequest(
        {
          method: "GET",
          url: `${API_BASE_URL}/api/custom-holidays`,
        },
        {
          cacheKey: "dashboard-custom-holidays",
          cacheHours: 24,
          showErrorToast: true,
          fallbackData: [],
        }
      );
      return response.data;
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
      const response = await offlineAxiosRequest(
        {
          method: "POST",
          url: `${API_BASE_URL}/api/custom-holidays`,
          data,
        },
        { showErrorToast: true }
      );
      return response.data;
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
      const response = await offlineAxiosRequest(
        {
          method: "PUT",
          url: `${API_BASE_URL}/api/custom-holidays/${data.id}`,
          data,
        },
        { showErrorToast: true }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["dashboard", "custom-holidays"],
      });
    },
  });

  const deleteHoliday = useMutation({
    mutationFn: async (id: number) => {
      const response = await offlineAxiosRequest(
        {
          method: "DELETE",
          url: `${API_BASE_URL}/api/custom-holidays/${id}`,
        },
        { showErrorToast: true }
      );
      return response.data;
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
      const response = await offlineAxiosRequest(
        {
          method: "GET",
          url: `${API_BASE_URL}/api/dashboard/out-of-stock`,
        },
        {
          cacheKey: "dashboard-out-of-stock",
          cacheHours: 24,
          showErrorToast: true,
          fallbackData: [],
        }
      );
      return response.data;
    },
    refetchInterval: false,
    staleTime: 5 * 60 * 1000,
  });

  const spoilage = useQuery({
    queryKey: ["dashboard", "spoilage"],
    queryFn: async () => {
      const response = await offlineAxiosRequest(
        {
          method: "GET",
          url: `${API_BASE_URL}/api/dashboard/spoilage`,
        },
        {
          cacheKey: "dashboard-spoilage",
          cacheHours: 24,
          showErrorToast: true,
          fallbackData: [],
        }
      );
      return response.data;
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
