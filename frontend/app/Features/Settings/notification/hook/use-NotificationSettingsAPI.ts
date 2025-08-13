/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useCallback } from "react";

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
      const res = await fetch(`/api/notification-settings?user_id=${userId}`);
      if (!res.ok) throw new Error("Failed to fetch notification settings");
      const data = await res.json();
      setSettings(data);
      setLoading(false);
      return data;
    } catch (err: any) {
      setError(err.message || "Unknown error");
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
        const res = await fetch("/api/notification-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newSettings),
        });
        if (!res.ok) throw new Error("Failed to update notification settings");
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
