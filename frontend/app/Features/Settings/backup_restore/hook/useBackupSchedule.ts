import useSWR from "swr";
import { getToken } from "@/app/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface BackupSchedule {
  id: number;
  user_id: number;
  frequency: string;
  day_of_week?: string | null;
  day_of_month?: number | null;
  time_of_day: string;
}

export interface BackupScheduleSettings {
  frequency: string;
  day_of_week?: string;
  day_of_month?: number;
  time_of_day: string;
}

// Fetch the current backup schedule (matches backend: GET /schedule)
export function useBackupSchedule() {
  const { data, error, mutate, isLoading } = useSWR<BackupSchedule>(
    `${API_BASE_URL}/api/schedule`,
    async (url: string) => {
      const token = getToken();
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch backup schedule");
      }

      return response.json();
    }
  );
  return {
    schedule: data,
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}

// Update the backup schedule (matches backend: POST /schedule)
export async function updateBackupSchedule(settings: BackupScheduleSettings) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/api/schedule`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    throw new Error("Failed to update backup schedule");
  }

  return response.json();
}
