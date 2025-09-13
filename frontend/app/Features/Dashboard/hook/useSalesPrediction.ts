import { useCallback, useState } from "react";

export interface SalesPrediction {
  name: string;
  sales: number[];
  week: string[];
  color: string;
}

export function useSalesPrediction() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SalesPrediction[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchSalesPrediction = useCallback(
    async (timeframe: string = "weekly", top_n: number = 3) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/predict_top_sales?timeframe=${timeframe}&top_n=${top_n}`
        );
        if (!res.ok) throw new Error("Failed to fetch sales prediction");
        const result = await res.json();
        console.log("[DEBUG] Frontend received:", result);
        setData(result);
      } catch (err: any) {
        console.error("[DEBUG] Frontend error:", err);
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { data, loading, error, fetchSalesPrediction };
}
