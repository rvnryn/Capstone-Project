import { useState } from "react";
import axios from "@/app/lib/axios";
import { offlineAxiosRequest } from "@/app/utils/offlineAxios";

export interface UserActivityLog {
  activity_id?: number;
  user_id: number;
  username?: string;
  role?: string;
  action_type: string;
  description?: string;
  activity_date?: string;
  report_date?: string;
  date_time?: string;
}

export function useUserActivityLogAPI() {
  const [logs, setLogs] = useState<UserActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async (params?: {
    user_id?: number;
    action_type?: string;
    role?: string;
    start_date?: string;
    end_date?: string;
    report_date?: string;
    limit?: number;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const cacheKey = `user-activity-${JSON.stringify(params || {})}`;
      const response = await offlineAxiosRequest(
        {
          method: "GET",
          url: "/api/user-activity",
          params,
        },
        {
          cacheKey,
          cacheHours: 1, // User activity is time-sensitive
          showErrorToast: true,
          fallbackData: [],
        }
      );
      setLogs(response.data || []);
    } catch (err: any) {
      if (err.isOfflineError) {
        setLogs([]); // Set empty array for offline errors
        setError("Data not available offline");
      } else {
        setError(err.message || "Failed to fetch logs");
      }
    } finally {
      setLoading(false);
    }
  };

  const createLog = async (log: UserActivityLog) => {
    setLoading(true);
    setError(null);
    try {
      const response = await offlineAxiosRequest(
        {
          method: "POST",
          url: "/api/user-activity",
          data: log,
        },
        {
          showErrorToast: true,
        }
      );
      return response.data;
    } catch (err: any) {
      setError(err.message || "Failed to create log");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    logs,
    loading,
    error,
    fetchLogs,
    createLog,
  };
}
