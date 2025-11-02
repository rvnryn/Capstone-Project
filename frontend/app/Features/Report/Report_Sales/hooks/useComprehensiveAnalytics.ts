import { useState, useEffect } from "react";

interface ComprehensiveAnalytics {
  period: string;
  summary: {
    total_revenue: number;
    total_cogs: number;
    gross_profit: number;
    total_loss: number;
    net_profit: number;
    total_items_sold: number;
    unique_items_sold: number;
    total_transactions: number;
    avg_unit_price: number;
  };
  profitability: {
    gross_profit_margin: number;
    net_profit_margin: number;
    loss_percentage: number;
    cogs_percentage: number;
  };
  loss_analysis: {
    total_spoilage_cost: number;
    total_quantity_spoiled: number;
    total_incidents: number;
    unique_items_spoiled: number;
    spoilage_items: Array<{
      item_name: string;
      category: string;
      total_spoiled: number;
      total_cost: number;
      incidents: number;
      reasons: string;
    }>;
  };
  top_performers: Array<{
    item_name: string;
    category: string;
    total_quantity_sold: number;
    total_revenue: number;
    avg_price: number;
  }>;
  category_breakdown: Array<{
    category: string;
    total_quantity: number;
    total_revenue: number;
    revenue_percentage: number;
    unique_items: number;
    avg_price: number;
  }>;
  daily_trend: Array<{
    date: string;
    total_items: number;
    total_revenue: number;
  }>;
}

export function useComprehensiveAnalytics(
  startDate: string,
  endDate: string,
  autoRefreshInterval: number = 0
) {
  const [analytics, setAnalytics] = useState<ComprehensiveAnalytics | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAnalytics = async (isBackgroundRefresh = false) => {
    // Only show loading on initial fetch, not on background refresh
    if (!isBackgroundRefresh) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const apiBaseUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(
        `${apiBaseUrl}/api/comprehensive-sales-analytics?start_date=${startDate}&end_date=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const data = await response.json();
      setAnalytics(data);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || "Error loading analytics");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!startDate || !endDate) return;

    // Initial fetch
    fetchAnalytics(false);

    // Setup auto-refresh if interval is provided
    if (autoRefreshInterval > 0) {
      const intervalId = setInterval(() => {
        fetchAnalytics(true); // Background refresh - keeps old data visible
      }, autoRefreshInterval);

      return () => clearInterval(intervalId);
    }
  }, [startDate, endDate, autoRefreshInterval]);

  return {
    analytics,
    loading,
    isRefreshing,
    error,
    lastUpdated,
    refetch: () => fetchAnalytics(false),
  };
}
