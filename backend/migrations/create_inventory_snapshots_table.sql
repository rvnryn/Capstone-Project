-- Migration: Create inventory_snapshots table for historical inventory reporting
-- Description: Stores daily snapshots of inventory state to enable historical analytics and trend analysis
-- Date: 2025-01-09

-- Create inventory_snapshots table
CREATE TABLE IF NOT EXISTS inventory_snapshots (
    snapshot_id SERIAL PRIMARY KEY,
    snapshot_date DATE NOT NULL,
    item_id INTEGER NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(255),
    stock_quantity FLOAT NOT NULL DEFAULT 0.0,
    stock_status VARCHAR(50),
    unit_cost NUMERIC(10, 2) DEFAULT 0.00,
    total_value NUMERIC(12, 2),
    batch_date DATE,
    expiration_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_inventory_snapshots_snapshot_date ON inventory_snapshots(snapshot_date);
CREATE INDEX idx_inventory_snapshots_item_id ON inventory_snapshots(item_id);
CREATE INDEX idx_inventory_snapshots_item_name ON inventory_snapshots(item_name);
CREATE INDEX idx_inventory_snapshots_category ON inventory_snapshots(category);
CREATE INDEX idx_inventory_snapshots_date_item ON inventory_snapshots(snapshot_date, item_name);

-- Add comment to table
COMMENT ON TABLE inventory_snapshots IS 'Daily snapshots of inventory state for historical reporting and trend analysis';
COMMENT ON COLUMN inventory_snapshots.snapshot_date IS 'Date of the snapshot (end-of-day state)';
COMMENT ON COLUMN inventory_snapshots.item_id IS 'Reference to the inventory item';
COMMENT ON COLUMN inventory_snapshots.total_value IS 'Calculated value: stock_quantity * unit_cost';
COMMENT ON COLUMN inventory_snapshots.created_at IS 'Timestamp when the snapshot was created';

-- Verify table was created
SELECT 'inventory_snapshots table created successfully' AS status;
