import useSWR from "swr";
import { offlineAxiosRequest } from "@/app/utils/offlineAxios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

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
      const res = await offlineAxiosRequest(
        {
          method: "GET",
          url,
        },
        {
          cacheKey: "backup-schedule",
          cacheHours: 24,
          showErrorToast: true,
        }
      );
      return res.data;
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
  const res = await offlineAxiosRequest(
    {
      method: "POST",
      url: `${API_BASE_URL}/api/schedule`,
      data: settings,
    },
    {
      showErrorToast: true,
    }
  );
  return res.data;
}
