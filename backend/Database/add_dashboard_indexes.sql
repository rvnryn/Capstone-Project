-- Add indexes for dashboard performance
CREATE INDEX IF NOT EXISTS idx_inventory_stock_status ON inventory(stock_status);
CREATE INDEX IF NOT EXISTS idx_inventory_expiration_date ON inventory(expiration_date);
CREATE INDEX IF NOT EXISTS idx_inventory_surplus_expiration_date ON inventory_surplus(expiration_date);
