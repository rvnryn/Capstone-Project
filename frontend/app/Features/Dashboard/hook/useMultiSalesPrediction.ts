import { useCallback, useState } from "react";

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
        fetch(`/api/predict_top_sales?timeframe=daily&top_n=${top_n}`),
        fetch(`/api/predict_top_sales?timeframe=weekly&top_n=${top_n}`),
        fetch(`/api/predict_top_sales?timeframe=monthly&top_n=${top_n}`),
      ]);
      if (!dailyRes.ok || !weeklyRes.ok || !monthlyRes.ok)
        throw new Error("Failed to fetch one or more predictions");
      setDaily(await dailyRes.json());
      setWeekly(await weeklyRes.json());
      setMonthly(await monthlyRes.json());
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  return { daily, weekly, monthly, loading, error, fetchAll };
}
