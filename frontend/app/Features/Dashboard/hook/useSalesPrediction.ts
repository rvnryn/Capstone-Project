import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { offlineAxiosRequest } from "@/app/utils/offlineAxios";

export interface SalesPrediction {
  name: string;
  sales: number[];
  week: string[];
  color: string;
}

export interface HistoricalAnalysis {
  overview: {
    total_sales: number;
    unique_items: number;
    date_range_days: number;
    avg_daily_sales: number;
    analysis_period: string;
  };
  top_performers: {
    by_total_sales: Array<{
      item: string;
      total_sales: number;
      avg_sales: number;
      frequency: number;
    }>;
  };
  trends: {
    items_with_trends: Array<{
      item: string;
      trend_direction: "increasing" | "decreasing" | "stable";
      change_percent: number;
      total_sales: number;
      latest_avg: number;
      earliest_avg: number;
    }>;
  };
  patterns: {
    day_of_week: Record<string, number>;
  };
  insights: string[];
}

export function useSalesHistory(
  timeframe: "daily" | "weekly" | "monthly",
  top_n: number
) {
  const {
    data = [],
    isLoading: loading,
    error,
    refetch: fetchSalesHistory,
  } = useQuery({
    queryKey: ["sales-history", timeframe, top_n],
    queryFn: async () => {
      const response = await offlineAxiosRequest(
        {
          method: "GET",
          url: `/api/predict_top_sales?timeframe=${timeframe}&top_n=${top_n}`,
        },
        {
          cacheKey: `sales-history-${timeframe}-${top_n}`,
          cacheHours: 6,
          showErrorToast: true,
          fallbackData: [],
        }
      );
      console.log(
        "[SalesHistory] API response for",
        timeframe,
        top_n,
        response.data
      );
      return response.data;
    },
    refetchInterval: 10000,
    staleTime: 10000,
  });
  console.log("[SalesHistory] Hook data for", timeframe, top_n, data);
  return { data, loading, error, fetchSalesHistory };
}

export function useHistoricalAnalysis() {
  const days = 90;
  const {
    data = null,
    isLoading: loading,
    error,
    refetch: fetchHistoricalAnalysis,
  } = useQuery({
    queryKey: ["historical-analysis", days],
    queryFn: async () => {
      const response = await offlineAxiosRequest(
        {
          method: "GET",
          url: `/api/historical_analysis?days=${days}`,
        },
        {
          cacheKey: `historical-analysis-${days}`,
          cacheHours: 12,
          showErrorToast: true,
          fallbackData: null,
        }
      );
      return response.data;
    },
    refetchInterval: 10000,
    staleTime: 10000,
  });
  return { data, loading, error, fetchHistoricalAnalysis };
}

export function useSalesPrediction(
  timeframe: "daily" | "weekly" | "monthly",
  top_n: number
) {
  return useSalesHistory(timeframe, top_n);
}

export function useSalesAnalytics(
  timeframe: "daily" | "weekly" | "monthly",
  top_n: number
) {
  const salesHistory = useSalesHistory(timeframe, top_n);
  const historical = useHistoricalAnalysis();
  return {
    prediction: salesHistory,
    historical,
    loading: salesHistory.loading || historical.loading,
    error: salesHistory.error || historical.error,
  };
}
