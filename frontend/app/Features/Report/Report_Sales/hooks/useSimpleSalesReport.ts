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
    unitPrice?: number;
    subtotal?: number;
    discount_percentage?: number;
    sale_date?: string;
    order_number?: string;
    transaction_number?: string;
    dine_type?: string;
    order_taker?: string;
    cashier?: string;
    terminal_no?: string;
    member?: string;
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

        // Get token for Authorization header
        const token = localStorage.getItem("access_token");
        const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

        // Fetch all required data in parallel using fetch with offline handling
        const [summaryRes, itemsRes, dateRes, forecastRes] =
          await Promise.allSettled([
            fetch(`${API_BASE_URL}/api/sales-summary?${params.toString()}`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            })
              .then(async (res) => {
                if (!res.ok)
                  throw new Error(`HTTP error! status: ${res.status}`);
                return { data: await res.json() };
              })
              .catch((error) => {
                console.log(
                  "Sales summary API failed - using cached data or defaults"
                );
                const cached = localStorage.getItem("cached_sales_summary");
                return {
                  data: cached
                    ? JSON.parse(cached)
                    : {
                        total_revenue: 0,
                        total_orders: 0,
                        total_items_sold: 0,
                        avg_order_value: 0,
                      },
                };
              }),
            fetch(`${API_BASE_URL}/api/sales-detailed?${params.toString()}`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            })
              .then(async (res) => {
                if (!res.ok)
                  throw new Error(`HTTP error! status: ${res.status}`);
                return { data: await res.json() };
              })
              .catch((error) => {
                console.log(
                  "Sales detailed API failed - using cached data or defaults"
                );
                const cached = localStorage.getItem("cached_sales_detailed");
                return { data: cached ? JSON.parse(cached) : { sales: [] } };
              }),
            fetch(
              `${API_BASE_URL}/api/sales-by-date?${params.toString()}&grouping=daily`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
            )
              .then(async (res) => {
                if (!res.ok)
                  throw new Error(`HTTP error! status: ${res.status}`);
                return { data: await res.json() };
              })
              .catch((error) => {
                console.log(
                  "Sales by date API failed - using cached data or defaults"
                );
                const cached = localStorage.getItem("cached_sales_dates");
                return { data: cached ? JSON.parse(cached) : { data: [] } };
              }),
            fetch(
              `${API_BASE_URL}/api/weekly-sales-forecast${
                forecastParams.toString() ? `?${forecastParams.toString()}` : ""
              }`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
            )
              .then(async (res) => {
                if (!res.ok)
                  throw new Error(`HTTP error! status: ${res.status}`);
                return { data: await res.json() };
              })
              .catch((error) => {
                console.log(
                  "Weekly forecast API failed - using cached data or defaults"
                );
                const cached = localStorage.getItem("cached_forecast");
                return {
                  data: cached
                    ? JSON.parse(cached)
                    : { forecast: [], historical_predictions: [] },
                };
              }),
          ]);

        // Extract data from settled promises
        const summary =
          summaryRes.status === "fulfilled"
            ? summaryRes.value.data
            : {
                total_revenue: 0,
                total_orders: 0,
                total_items_sold: 0,
                avg_order_value: 0,
              };
        const salesDetailed =
          itemsRes.status === "fulfilled" ? itemsRes.value.data : { sales: [] };
        const dates =
          dateRes.status === "fulfilled" ? dateRes.value.data : { data: [] };
        const forecast =
          forecastRes.status === "fulfilled"
            ? forecastRes.value.data
            : { forecast: [], historical_predictions: [] };

        // Cache successful responses
        if (summaryRes.status === "fulfilled")
          localStorage.setItem("cached_sales_summary", JSON.stringify(summary));
        if (itemsRes.status === "fulfilled")
          localStorage.setItem(
            "cached_sales_detailed",
            JSON.stringify(salesDetailed)
          );
        if (dateRes.status === "fulfilled")
          localStorage.setItem("cached_sales_dates", JSON.stringify(dates));
        if (forecastRes.status === "fulfilled")
          localStorage.setItem("cached_forecast", JSON.stringify(forecast));

        const reportData: SalesReportData = {
          totalRevenue: summary.total_revenue,
          totalOrders: summary.total_orders,
          totalItems: summary.total_items_sold,
          avgOrderValue: summary.avg_order_value,
          topItems: salesDetailed.sales.map((sale: any) => ({
            name: sale.item_name,
            category: sale.category,
            revenue: sale.total_price,
            quantity: sale.quantity,
            unitPrice: sale.unit_price,
            subtotal: sale.subtotal,
            discount_percentage: sale.discount_percentage,
            sale_date: sale.sale_date,
            order_number: sale.order_number,
            transaction_number: sale.transaction_number,
            dine_type: sale.dine_type,
            order_taker: sale.order_taker,
            cashier: sale.cashier,
            terminal_no: sale.terminal_no,
            member: sale.member,
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

  const importSalesData = useCallback(async (rows: any[]) => {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Authentication required. Please log in again.");
    }

    const res = await fetch(`${API_BASE_URL}/api/import-sales`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ rows }),
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error("Session expired. Please log in again.");
      }
      throw new Error(`Import failed: ${res.statusText}`);
    }

    return await res.json();
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
    importSalesData,
  };
}

export default useSimpleSalesReport;
