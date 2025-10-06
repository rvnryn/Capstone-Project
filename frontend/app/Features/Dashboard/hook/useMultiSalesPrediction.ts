import { useCallback, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface SalesPrediction {
  name: string;
  sales: number[];
  week: string[];
  color: string;
}

export function useMultiSalesPrediction() {
  const [daily, setDaily] = useState<SalesPrediction[]>([]);
  const [weekly, setWeekly] = useState<SalesPrediction[]>([]);
  const [monthly, setMonthly] = useState<SalesPrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async (top_n: number = 3) => {
    setLoading(true);
    setError(null);
    try {
      const [dailyRes, weeklyRes, monthlyRes] = await Promise.all([
        fetch(
          `${API_BASE_URL}/api/predict_top_sales?timeframe=daily&top_n=${top_n}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        ),
        fetch(
          `${API_BASE_URL}/api/predict_top_sales?timeframe=weekly&top_n=${top_n}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        ),
        fetch(
          `${API_BASE_URL}/api/predict_top_sales?timeframe=monthly&top_n=${top_n}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        ),
      ]);

      if (!dailyRes.ok || !weeklyRes.ok || !monthlyRes.ok) {
        throw new Error("One or more requests failed");
      }

      const [dailyData, weeklyData, monthlyData] = await Promise.all([
        dailyRes.json(),
        weeklyRes.json(),
        monthlyRes.json(),
      ]);

      setDaily(dailyData);
      setWeekly(weeklyData);
      setMonthly(monthlyData);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  return { daily, weekly, monthly, loading, error, fetchAll };
}
