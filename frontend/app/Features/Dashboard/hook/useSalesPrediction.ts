import { useCallback, useState } from "react";
import axiosInstance from "@/app/lib/axios";

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
        const res = await axiosInstance.get(
          `/api/predict_top_sales?timeframe=${timeframe}&top_n=${top_n}`
        );
        setData(res.data);
      } catch (err: any) {
        console.error("Sales history fetch error:", err);
        setError(
          err?.response?.data?.detail ||
            err.message ||
            "Failed to fetch sales history"
        );
        setData([]);
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
      const res = await axiosInstance.get(
        `/api/historical_analysis?days=${days}`
      );
      setData(res.data);
    } catch (err: any) {
      console.error("Historical analysis fetch error:", err);
      setError(
        err?.response?.data?.detail ||
          err.message ||
          "Failed to fetch historical analysis"
      );
      setData(null);
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
