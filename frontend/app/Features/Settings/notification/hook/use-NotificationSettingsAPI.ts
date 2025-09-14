"use client";
import { useState, useCallback } from "react";
import { offlineAxiosRequest } from "@/app/utils/offlineAxios";

export interface NotificationSettings {
  user_id: number;
  low_stock_enabled: boolean;
  low_stock_method: string[];
  expiration_enabled: boolean;
  expiration_days: number;
  expiration_method: string[];
}

export function useNotificationSettingsAPI(userId: number) {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  // Fetch settings from backend
  const fetchSettings = useCallback(async () => {
    if (!userId) {
      setSettings(null);
      setError("No user ID provided");
      setLoading(false);
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const cacheKey = `notification-settings-${userId}`;
      const response = await offlineAxiosRequest(
        {
          method: "GET",
          url: `/api/notification-settings?user_id=${userId}`,
        },
        {
          cacheKey,
          cacheHours: 2, // Settings can be cached longer
          showErrorToast: true,
          fallbackData: null,
        }
      );

      setSettings(response.data);
      setLoading(false);
      return response.data;
    } catch (err: any) {
      if (err.isOfflineError) {
        setSettings(null);
        setError("Settings not available offline");
      } else {
        setError(err.message || "Unknown error");
      }
      setLoading(false);
      return null;
    }
  }, [userId]);

  // Update settings and refetch from backend to ensure latest state
  const updateSettings = useCallback(
    async (newSettings: NotificationSettings) => {
      if (!userId) {
        setError("No user ID provided");
        return false;
      }
      setLoading(true);
      setError(null);
      try {
        const token = getToken();
        const res = await offlineAxiosRequest(
          {
            method: "POST",
            url: "/api/notification-settings",
            data: newSettings,
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          },
          {
            showErrorToast: true,
          }
        );
        // Refetch to get the latest settings from backend
        const latest = await fetchSettings();
        setSettings(latest);
        setLoading(false);
        return true;
      } catch (err: any) {
        setError(err.message || "Unknown error");
        setLoading(false);
        return false;
      }
    },
    [fetchSettings, userId]
  );

  // Helper to reload settings
  const reloadSettings = useCallback(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings,
    reloadSettings,
    setSettings, // for local state updates
  };
}
