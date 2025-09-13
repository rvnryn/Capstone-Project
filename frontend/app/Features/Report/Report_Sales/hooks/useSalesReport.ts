import { useState, useCallback } from "react";

// Type definitions for API responses
export interface SalesSummary {
  period: string;
  total_orders: number;
  total_items_sold: number;
  total_revenue: number;
  avg_order_value: number;
  unique_items_sold: number;
}

export interface SalesItem {
  item_name: string;
  total_quantity: number;
  total_revenue: number;
  avg_price: number;
  orders_count: number;
}

export interface SalesByItemResponse {
  period: string;
  items: SalesItem[];
}

export interface SalesByDateData {
  period: string;
  orders_count: number;
  total_items: number;
  total_revenue: number;
}

export interface SalesByDateResponse {
  grouping: string;
  period: string;
  data: SalesByDateData[];
}

export interface TopPerformersResponse {
  metric: string;
  period: string;
  top_performers: SalesItem[];
}

export interface HourlySalesData {
  hour: number;
  hour_formatted: string;
  orders_count: number;
  total_items: number;
  total_revenue: number;
}

export interface HourlySalesResponse {
  date: string;
  hourly_sales: HourlySalesData[];
}

export interface SalesComparison {
  current_period: {
    period: string;
    orders: number;
    revenue: number;
    items: number;
    avg_order_value: number;
  };
  previous_period: {
    period: string;
    orders: number;
    revenue: number;
    items: number;
    avg_order_value: number;
  };
  changes: {
    orders_change_percent: number;
    revenue_change_percent: number;
    items_change_percent: number;
  };
}

interface UseSalesReportState {
  loading: boolean;
  error: string | null;
  salesSummary: SalesSummary | null;
  salesByItem: SalesByItemResponse | null;
  salesByDate: SalesByDateResponse | null;
  topPerformers: TopPerformersResponse | null;
  hourlySales: HourlySalesResponse | null;
  salesComparison: SalesComparison | null;
}

export function useSalesReport() {
  const [state, setState] = useState<UseSalesReportState>({
    loading: false,
    error: null,
    salesSummary: null,
    salesByItem: null,
    salesByDate: null,
    topPerformers: null,
    hourlySales: null,
    salesComparison: null,
  });

  const setLoading = (loading: boolean) => {
    setState((prev) => ({ ...prev, loading }));
  };

  const setError = (error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  };

  const handleApiCall = async <T>(
    apiCall: () => Promise<Response>,
    dataKey: keyof UseSalesReportState
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiCall();

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setState((prev) => ({ ...prev, [dataKey]: data }));
      return data;
    } catch (err: any) {
      const errorMessage = err.message || "An error occurred";
      console.error(`Sales Report API Error:`, err);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get sales summary
  const fetchSalesSummary = useCallback(
    async (
      startDate?: string,
      endDate?: string,
      timeframe: string = "daily"
    ): Promise<SalesSummary | null> => {
      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      params.append("timeframe", timeframe);

      return handleApiCall<SalesSummary>(
        () => fetch(`/api/sales-summary?${params.toString()}`),
        "salesSummary"
      );
    },
    []
  );

  // Get sales by item
  const fetchSalesByItem = useCallback(
    async (
      startDate?: string,
      endDate?: string,
      limit: number = 10
    ): Promise<SalesByItemResponse | null> => {
      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      params.append("limit", limit.toString());

      return handleApiCall<SalesByItemResponse>(
        () => fetch(`/api/sales-by-item?${params.toString()}`),
        "salesByItem"
      );
    },
    []
  );

  // Get sales by date
  const fetchSalesByDate = useCallback(
    async (
      startDate?: string,
      endDate?: string,
      grouping: string = "daily"
    ): Promise<SalesByDateResponse | null> => {
      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      params.append("grouping", grouping);

      return handleApiCall<SalesByDateResponse>(
        () => fetch(`/api/sales-by-date?${params.toString()}`),
        "salesByDate"
      );
    },
    []
  );

  // Get top performers
  const fetchTopPerformers = useCallback(
    async (
      startDate?: string,
      endDate?: string,
      metric: string = "revenue",
      limit: number = 5
    ): Promise<TopPerformersResponse | null> => {
      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      params.append("metric", metric);
      params.append("limit", limit.toString());

      return handleApiCall<TopPerformersResponse>(
        () => fetch(`/api/top-performers?${params.toString()}`),
        "topPerformers"
      );
    },
    []
  );

  // Get hourly sales
  const fetchHourlySales = useCallback(
    async (date?: string): Promise<HourlySalesResponse | null> => {
      const params = new URLSearchParams();
      if (date) params.append("date", date);

      return handleApiCall<HourlySalesResponse>(
        () => fetch(`/api/hourly-sales?${params.toString()}`),
        "hourlySales"
      );
    },
    []
  );

  // Get sales comparison
  const fetchSalesComparison = useCallback(
    async (
      currentStart: string,
      currentEnd: string,
      previousStart: string,
      previousEnd: string
    ): Promise<SalesComparison | null> => {
      const params = new URLSearchParams();
      params.append("current_start", currentStart);
      params.append("current_end", currentEnd);
      params.append("previous_start", previousStart);
      params.append("previous_end", previousEnd);

      return handleApiCall<SalesComparison>(
        () => fetch(`/api/sales-comparison?${params.toString()}`),
        "salesComparison"
      );
    },
    []
  );

  // Utility function to generate previous period dates
  const generatePreviousPeriod = useCallback(
    (
      startDate: string,
      endDate: string
    ): { previousStart: string; previousEnd: string } => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const previousEnd = new Date(start);
      previousEnd.setDate(previousEnd.getDate() - 1);

      const previousStart = new Date(previousEnd);
      previousStart.setDate(previousStart.getDate() - diffDays);

      return {
        previousStart: previousStart.toISOString().split("T")[0],
        previousEnd: previousEnd.toISOString().split("T")[0],
      };
    },
    []
  );

  // Convenience function to fetch period comparison
  const fetchPeriodComparison = useCallback(
    async (
      currentStart: string,
      currentEnd: string
    ): Promise<SalesComparison | null> => {
      const { previousStart, previousEnd } = generatePreviousPeriod(
        currentStart,
        currentEnd
      );
      return fetchSalesComparison(
        currentStart,
        currentEnd,
        previousStart,
        previousEnd
      );
    },
    [fetchSalesComparison, generatePreviousPeriod]
  );

  // Clear all data
  const clearData = useCallback(() => {
    setState({
      loading: false,
      error: null,
      salesSummary: null,
      salesByItem: null,
      salesByDate: null,
      topPerformers: null,
      hourlySales: null,
      salesComparison: null,
    });
  }, []);

  // Utility function to format currency
  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(amount);
  }, []);

  // Utility function to format percentage change
  const formatPercentageChange = useCallback((change: number): string => {
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(2)}%`;
  }, []);

  return {
    // State
    ...state,

    // API Methods
    fetchSalesSummary,
    fetchSalesByItem,
    fetchSalesByDate,
    fetchTopPerformers,
    fetchHourlySales,
    fetchSalesComparison,
    fetchPeriodComparison,

    // Utility Methods
    clearData,
    formatCurrency,
    formatPercentageChange,
    generatePreviousPeriod,
  };
}

export default useSalesReport;
