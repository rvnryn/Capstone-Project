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

export function useComprehensiveAnalytics(startDate: string, endDate: string) {
  const [analytics, setAnalytics] = useState<ComprehensiveAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!startDate || !endDate) return;

    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://localhost:8000/api/comprehensive-sales-analytics?start_date=${startDate}&end_date=${endDate}`,
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
      } catch (err: any) {
        setError(err.message || "Error loading analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [startDate, endDate]);

  return { analytics, loading, error };
}
