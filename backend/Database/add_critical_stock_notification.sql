-- Migration: Add critical stock notification settings
-- Date: 2025-11-18
-- Description: Add critical_stock_enabled and critical_stock_method columns to notification_settings table

-- Add critical_stock_enabled column (defaults to TRUE for all existing users)
ALTER TABLE notification_settings 
ADD COLUMN IF NOT EXISTS critical_stock_enabled BOOLEAN DEFAULT TRUE;

-- Add critical_stock_method column (defaults to '["inapp"]' for all existing users)
ALTER TABLE notification_settings 
ADD COLUMN IF NOT EXISTS critical_stock_method TEXT DEFAULT '["inapp"]';

-- Update existing records to ensure they have the new fields set
UPDATE notification_settings 
SET critical_stock_enabled = TRUE, 
    critical_stock_method = '["inapp"]'
WHERE critical_stock_enabled IS NULL 
   OR critical_stock_method IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN notification_settings.critical_stock_enabled IS 'Enable/disable critical stock notifications (stock <= 50% of threshold)';
COMMENT ON COLUMN notification_settings.critical_stock_method IS 'JSON array of notification methods for critical stock alerts: ["inapp", "email", "sms"]';
