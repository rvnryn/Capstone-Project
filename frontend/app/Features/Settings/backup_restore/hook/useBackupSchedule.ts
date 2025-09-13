import useSWR from "swr";
import axiosInstance from "@/app/lib/axios";

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

// Fetch the current backup schedule
export function useBackupSchedule() {
  const { data, error, mutate, isLoading } = useSWR<BackupSchedule>(
    "/api/backup/schedule",
    async (url: string) => {
      const res = await axiosInstance.get(url);
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

// Update the backup schedule
export async function updateBackupSchedule(settings: BackupScheduleSettings) {
  const res = await axiosInstance.post("/api/backup/schedule", settings);
  return res.data;
}
