import { useState } from "react";
import axios from "@/app/lib/axios";

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
      const response = await axios.get("/api/user-activity", {
        params,
      });
      setLogs(response.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  };

  const createLog = async (log: UserActivityLog) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post("/api/user-activity", log);
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
