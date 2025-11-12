import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
  top_n: number,
  startDate?: string,
  endDate?: string
) {
  const {
    data = [],
    isLoading: loading,
    error,
    refetch: fetchSalesHistory,
  } = useQuery({
    queryKey: ["sales-history", timeframe, top_n, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        timeframe,
        top_n: top_n.toString(),
      });
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);

      const response = await fetch(
        `${API_BASE_URL}/api/predict_top_sales?${params.toString()}`,
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
      return data;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    staleTime: 10000,
  });
  return { data, loading, error, fetchSalesHistory };
}

export function useHistoricalAnalysis(
  days: number = 90,
  startDate?: string,
  endDate?: string
) {
  const {
    data = null,
    isLoading: loading,
    error,
    refetch: fetchHistoricalAnalysis,
  } = useQuery({
    queryKey: ["historical-analysis", days, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        days: days.toString(),
      });
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);

      const response = await fetch(
        `${API_BASE_URL}/api/historical_analysis?${params.toString()}`,
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
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
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
  top_n: number,
  days?: number,
  startDate?: string,
  endDate?: string
) {
  const salesHistory = useSalesHistory(timeframe, top_n, startDate, endDate);
  const historical = useHistoricalAnalysis(days, startDate, endDate);
  return {
    prediction: salesHistory,
    historical,
    loading: salesHistory.loading || historical.loading,
    error: salesHistory.error || historical.error,
  };
}
