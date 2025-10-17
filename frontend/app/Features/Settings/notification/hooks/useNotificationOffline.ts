import { useOfflineCRUD } from "@/app/hooks/useOfflineCRUD";
import { useCallback } from "react";

// Notification Settings Hook
export function useNotificationSettings() {
  const offlineCRUD = useOfflineCRUD({
    entityName: "notification_settings",
    apiEndpoint: "/api/settings/notifications",
    cacheKey: "cached_notification_settings",
  });

  // Get notification preferences
  const getNotificationPreferences = useCallback(async () => {
    const settings = await offlineCRUD.readItems();
    return settings.length > 0 ? settings[0] : getDefaultNotificationSettings();
  }, [offlineCRUD]);

  // Update notification preferences
  const updateNotificationPreferences = useCallback(
    async (preferences: any) => {
      const existing = await getNotificationPreferences();
      if (existing.id) {
        return await offlineCRUD.updateItem(existing.id, preferences);
      } else {
        return await offlineCRUD.createItem(preferences);
      }
    },
    [offlineCRUD, getNotificationPreferences]
  );

  return {
    ...offlineCRUD,
    getNotificationPreferences,
    updateNotificationPreferences,
  };
}

// Default notification settings
function getDefaultNotificationSettings() {
  return {
    id: "default",
    email_notifications: true,
    push_notifications: true,
    low_stock_alerts: true,
    expiry_alerts: true,
    sales_reports: true,
    user_activity_alerts: false,
    system_maintenance: true,
    alert_frequency: "immediate", // immediate, daily, weekly
    quiet_hours_start: "22:00",
    quiet_hours_end: "08:00",
    offline_created: false,
  };
}
