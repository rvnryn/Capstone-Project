import { useState, useEffect, useCallback } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface InventoryAnalytics {
  period: {
    start_date: string;
    end_date: string;
  };
  stock_overview: {
    total_items: number;
    total_quantity: number;
    total_categories: number;
    out_of_stock_items: number;
  };
  stock_by_category: Array<{
    category: string;
    item_count: number;
    total_quantity: number;
  }>;
  outOfStock_items: Array<{
    item_name: string;
    category: string;
    stock_quantity: number;
    threshold: number;
  }>;
  critical_stock_items: Array<{
    item_name: string;
    category: string;
    stock_quantity: number;
    threshold: number;
  }>;
  low_stock_items: Array<{
    item_name: string;
    category: string;
    stock_quantity: number;
    threshold: number;
  }>;
  normal_items: Array<{
    item_name: string;
    category: string;
    stock_quantity: number;
    threshold: number;
  }>;
  expiring_items: Array<{
    item_name: string;
    category: string;
    stock_quantity: number;
    expiration_date: string;
    days_until_expiry: number;
  }>;
  spoilage_summary: {
    total_incidents: number;
    total_quantity_spoiled: number;
    unique_items_spoiled: number;
  };
  spoilage_trend: Array<{
    date: string;
    incidents: number;
    total_quantity: number;
    unique_items: number;
  }>;
  top_items: Array<{
    item_name: string;
    category: string;
    stock_quantity: number;
    batch_date: string;
  }>;
  inventory_movement: Array<{
    date: string;
    items_sold: number;
    total_quantity_sold: number;
  }>;
  stock_status_distribution: Array<{
    status: string;
    count: number;
  }>;
}

export function useInventoryAnalytics(startDate?: string, endDate?: string) {
  const [analytics, setAnalytics] = useState<InventoryAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived counts
  const criticalCount = analytics?.low_stock_items
    ? analytics.low_stock_items.filter(
        (item) =>
          item.stock_quantity <= 0.5 * item.threshold && item.stock_quantity > 0
      ).length
    : 0;

  const outOfStockCount = analytics?.low_stock_items
    ? analytics.low_stock_items.filter((item) => item.stock_quantity === 0)
        .length
    : 0;

  const normal_stock_items =
    analytics?.normal_items?.filter(
      (item) => item.stock_quantity > item.threshold // Normal: above threshold
    ) || [];

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);

      const response = await fetch(
        `${API_BASE_URL}/api/inventory-analytics?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch inventory analytics");
      console.error("Error fetching inventory analytics:", err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics,
    criticalCount,
    outOfStockCount,
  };
}
