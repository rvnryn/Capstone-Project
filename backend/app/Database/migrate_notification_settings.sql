-- Migration SQL for notification_settings table
CREATE TABLE IF NOT EXISTS notification_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    low_stock_enabled BOOLEAN DEFAULT TRUE,
    low_stock_method TEXT DEFAULT '["inapp"]',
    expiration_enabled BOOLEAN DEFAULT TRUE,
    expiration_days INTEGER DEFAULT 3,
    expiration_method TEXT DEFAULT '["inapp"]'
);
