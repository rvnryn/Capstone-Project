import { useCallback, useState } from "react";
import { offlineAxiosRequest } from "@/app/utils/offlineAxios";

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
        offlineAxiosRequest<SalesPrediction[]>(
          {
            method: "GET",
            url: `/api/predict_top_sales?timeframe=daily&top_n=${top_n}`,
          },
          {
            cacheKey: `predict_top_sales-daily-${top_n}`,
            cacheHours: 6,
            showErrorToast: false,
          }
        ),
        offlineAxiosRequest<SalesPrediction[]>(
          {
            method: "GET",
            url: `/api/predict_top_sales?timeframe=weekly&top_n=${top_n}`,
          },
          {
            cacheKey: `predict_top_sales-weekly-${top_n}`,
            cacheHours: 6,
            showErrorToast: false,
          }
        ),
        offlineAxiosRequest<SalesPrediction[]>(
          {
            method: "GET",
            url: `/api/predict_top_sales?timeframe=monthly&top_n=${top_n}`,
          },
          {
            cacheKey: `predict_top_sales-monthly-${top_n}`,
            cacheHours: 6,
            showErrorToast: false,
          }
        ),
      ]);
      setDaily(dailyRes.data);
      setWeekly(weeklyRes.data);
      setMonthly(monthlyRes.data);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  return { daily, weekly, monthly, loading, error, fetchAll };
}
