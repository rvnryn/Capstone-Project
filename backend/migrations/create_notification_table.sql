-- Migration: Create notification table for in-app notifications
-- Description: Stores user notifications for low stock, expiring items, and system alerts
-- Date: 2025-01-09

-- Create notification table
CREATE TABLE IF NOT EXISTS notification (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    details JSONB,
    status VARCHAR(20) DEFAULT 'unread',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notification_user_id ON notification(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_status ON notification(status);
CREATE INDEX IF NOT EXISTS idx_notification_type ON notification(type);
CREATE INDEX IF NOT EXISTS idx_notification_created_at ON notification(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_user_status ON notification(user_id, status);

-- Add comments
COMMENT ON TABLE notification IS 'Stores in-app notifications for users (low stock, expiring items, system alerts)';
COMMENT ON COLUMN notification.user_id IS 'Reference to the user receiving the notification';
COMMENT ON COLUMN notification.type IS 'Notification type: low_stock, expiring_soon, expired, auto_transfer_*, etc.';
COMMENT ON COLUMN notification.message IS 'Notification message displayed to user';
COMMENT ON COLUMN notification.details IS 'JSON details about affected items';
COMMENT ON COLUMN notification.status IS 'Notification status: unread or read';

-- Verify table was created
SELECT 'notification table created successfully' AS status;
