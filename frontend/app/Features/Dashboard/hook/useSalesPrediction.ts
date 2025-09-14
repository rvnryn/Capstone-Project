import { useCallback, useState } from "react";
import axiosInstance from "@/app/lib/axios";
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

export function useSalesHistory() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SalesPrediction[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchSalesHistory = useCallback(
    async (timeframe: string = "weekly", top_n: number = 3) => {
      setLoading(true);
      setError(null);
      try {
        const response = await offlineAxiosRequest(
          {
            method: "GET",
            url: `/api/predict_top_sales?timeframe=${timeframe}&top_n=${top_n}`,
          },
          {
            cacheKey: `sales-history-${timeframe}-${top_n}`,
            cacheHours: 6, // Sales data can be cached for 6 hours
            showErrorToast: true,
            fallbackData: [], // Return empty array as fallback
          }
        );
        setData(response.data);
      } catch (err: any) {
        console.error("Sales history fetch error:", err);
        if (err.isOfflineError) {
          setError("Sales history not available offline");
          setData([]); // Set empty data for offline
        } else {
          setError(
            err?.response?.data?.detail ||
              err.message ||
              "Failed to fetch sales history"
          );
          setData([]);
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { data, loading, error, fetchSalesHistory };
}

export function useHistoricalAnalysis() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<HistoricalAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchHistoricalAnalysis = useCallback(async (days: number = 90) => {
    setLoading(true);
    setError(null);
    try {
      const response = await offlineAxiosRequest(
        {
          method: "GET",
          url: `/api/historical_analysis?days=${days}`,
        },
        {
          cacheKey: `historical-analysis-${days}`,
          cacheHours: 12, // Historical analysis can be cached for 12 hours
          showErrorToast: true,
          fallbackData: null, // Return null as fallback
        }
      );
      setData(response.data);
    } catch (err: any) {
      console.error("Historical analysis fetch error:", err);
      if (err.isOfflineError) {
        setError("Historical analysis not available offline");
        setData(null); // Set null data for offline
      } else {
        setError(
          err?.response?.data?.detail ||
            err.message ||
            "Failed to fetch historical analysis"
        );
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchHistoricalAnalysis };
}

export function useSalesPrediction() {
  return useSalesHistory();
}

export function useSalesAnalytics() {
  const salesHistory = useSalesHistory();
  const historical = useHistoricalAnalysis();

  const fetchAll = useCallback(
    async (
      timeframe: string = "weekly",
      top_n: number = 3,
      days: number = 90
    ) => {
      await Promise.all([
        salesHistory.fetchSalesHistory(timeframe, top_n),
        historical.fetchHistoricalAnalysis(days),
      ]);
    },
    [salesHistory.fetchSalesHistory, historical.fetchHistoricalAnalysis]
  );

  return {
    prediction: salesHistory, // Keep the same name for backward compatibility
    historical,
    loading: salesHistory.loading || historical.loading,
    error: salesHistory.error || historical.error,
    fetchAll,
  };
}
