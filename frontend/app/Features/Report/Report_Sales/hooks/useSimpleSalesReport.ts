import { useState, useCallback } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface WeeklyForecast {
  week_start: string;
  predicted_sales: number;
  is_holiday_week: number;
  holiday_type?: "official" | "custom" | null;
}
interface HistoricalPrediction {
  week_start: string;
  predicted_sales: number;
  actual_sales: number;
  is_holiday_week: number;
  holiday_type?: "official" | "custom" | null;
}
interface SalesReportData {
  totalRevenue: number;
  totalOrders: number;
  totalItems: number;
  avgOrderValue: number;
  topItems: Array<{
    name: string;
    category?: string;
    revenue: number;
    quantity: number;
    orders: number;
  }>;
  dailySales: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  forecast?: WeeklyForecast[];
  historicalPredictions?: HistoricalPrediction[];
}

export function useSimpleSalesReport() {
  const [data, setData] = useState<SalesReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReportData = useCallback(
    async (
      startDate?: string,
      endDate?: string,
      options?: { item_name?: string; category?: string }
    ) => {
      try {
        setLoading(true);
        setError(null);

        // Build query parameters
        const params = new URLSearchParams();
        if (startDate) params.append("start_date", startDate);
        if (endDate) params.append("end_date", endDate);

        // Build forecast params
        const forecastParams = new URLSearchParams();
        if (options?.item_name)
          forecastParams.append("item_name", options.item_name);
        if (options?.category)
          forecastParams.append("category", options.category);

        // Fetch all required data in parallel using fetch
        const [summaryRes, itemsRes, dateRes, forecastRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/sales-summary?${params.toString()}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }).then(async (res) => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return { data: await res.json() };
          }),
          fetch(`${API_BASE_URL}/api/sales-by-item?${params.toString()}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }).then(async (res) => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return { data: await res.json() };
          }),
          fetch(
            `${API_BASE_URL}/api/sales-by-date?${params.toString()}&grouping=daily`,
            {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            }
          ).then(async (res) => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return { data: await res.json() };
          }),
          fetch(
            `${API_BASE_URL}/api/weekly-sales-forecast${
              forecastParams.toString() ? `?${forecastParams.toString()}` : ""
            }`,
            {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            }
          ).then(async (res) => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return { data: await res.json() };
          }),
        ]);

        const summary = summaryRes.data;
        const items = itemsRes.data;
        const dates = dateRes.data;
        const forecast = forecastRes.data;

        const reportData: SalesReportData = {
          totalRevenue: summary.total_revenue,
          totalOrders: summary.total_orders,
          totalItems: summary.total_items_sold,
          avgOrderValue: summary.avg_order_value,
          topItems: items.items.map((item: any) => ({
            name: item.item_name,
            category: item.category,
            revenue: item.total_revenue,
            quantity: item.total_quantity,
            orders: item.orders_count,
          })),
          dailySales: dates.data.map((day: any) => ({
            date: day.period,
            revenue: day.total_revenue,
            orders: day.orders_count,
          })),
          forecast: Array.isArray(forecast.forecast)
            ? forecast.forecast.map((f: any) => ({
                ...f,
                holiday_type: f.holiday_type ?? null,
              }))
            : [],
          historicalPredictions: Array.isArray(forecast.historical_predictions)
            ? forecast.historical_predictions.map((h: any) => ({
                ...h,
                holiday_type: h.holiday_type ?? null,
              }))
            : [],
        };

        // Debug: Log final reportData
        console.log("[useSimpleSalesReport] reportData", reportData);

        setData(reportData);
        return reportData;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.detail ||
          err.message ||
          "Failed to fetch report data";
        setError(errorMessage);
        console.error("[useSimpleSalesReport] Sales report error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchTodayReport = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0];
    return fetchReportData(today, today);
  }, [fetchReportData]);

  const fetchWeekReport = useCallback(async () => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    return fetchReportData(
      weekAgo.toISOString().split("T")[0],
      today.toISOString().split("T")[0]
    );
  }, [fetchReportData]);

  const fetchMonthReport = useCallback(async () => {
    const today = new Date();
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);

    return fetchReportData(
      monthAgo.toISOString().split("T")[0],
      today.toISOString().split("T")[0]
    );
  }, [fetchReportData]);

  const clearData = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    fetchReportData,
    fetchTodayReport,
    fetchWeekReport,
    fetchMonthReport,
    clearData,
  };
}

export default useSimpleSalesReport;
