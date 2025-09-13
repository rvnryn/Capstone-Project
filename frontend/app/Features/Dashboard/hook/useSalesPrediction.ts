import { useCallback, useState } from "react";
import axiosInstance from "@/app/lib/axios"; // Add this import

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
        // Use axiosInstance instead of fetch
        const res = await axiosInstance.get(
          `/api/predict_top_sales?timeframe=${timeframe}&top_n=${top_n}`
        );
        setData(res.data);
      } catch (err: any) {
        console.error("Sales prediction fetch error:", err);
        setError(
          err?.response?.data?.detail ||
            err.message ||
            "Failed to fetch sales prediction"
        );
        setData([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { data, loading, error, fetchSalesPrediction };
}
