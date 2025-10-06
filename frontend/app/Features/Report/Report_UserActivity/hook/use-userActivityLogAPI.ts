import { useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
      }

      const url = `${API_BASE_URL}/api/user-activity${
        searchParams.toString() ? `?${searchParams.toString()}` : ""
      }`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setLogs(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch logs");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const createLog = async (log: UserActivityLog) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/user-activity`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(log),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
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
