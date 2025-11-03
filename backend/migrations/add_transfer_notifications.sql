-- Migration: Add transfer notification settings and user activity logging
-- This adds notification settings for inventory transfers and user activity tracking

-- Add transfer notification settings to notification_settings table
ALTER TABLE notification_settings
ADD COLUMN IF NOT EXISTS transfer_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS transfer_method TEXT DEFAULT '["inapp"]';

-- Add comments
COMMENT ON COLUMN notification_settings.transfer_enabled IS 'Enable notifications for inventory transfer processes';
COMMENT ON COLUMN notification_settings.transfer_method IS 'Notification methods for transfers (JSON array)';

-- Success message
SELECT 'Migration completed: Added transfer notification settings' AS status;
