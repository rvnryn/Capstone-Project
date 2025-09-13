import { useState, useCallback } from "react";
import axios from "@/app/lib/axios";

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
}

export function useSimpleSalesReport() {
  const [data, setData] = useState<SalesReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReportData = useCallback(
    async (startDate?: string, endDate?: string) => {
      try {
        setLoading(true);
        setError(null);

        // Build query parameters
        const params = new URLSearchParams();
        if (startDate) params.append("start_date", startDate);
        if (endDate) params.append("end_date", endDate);

        // Fetch all required data in parallel using axios
        const [summaryRes, itemsRes, dateRes] = await Promise.all([
          axios.get(`/api/sales-summary?${params.toString()}`),
          axios.get(`/api/sales-by-item?${params.toString()}`),
          axios.get(`/api/sales-by-date?${params.toString()}&grouping=daily`),
        ]);

        const summary = summaryRes.data;
        const items = itemsRes.data;
        const dates = dateRes.data;

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
        };

        setData(reportData);
        return reportData;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.detail ||
          err.message ||
          "Failed to fetch report data";
        setError(errorMessage);
        console.error("Sales report error:", err);
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
