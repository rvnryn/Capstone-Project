-- Migration: Create archived_inventory tables for auto-archiving depleted old batches
-- Purpose: Store historical inventory data that's been depleted and removed from active inventory
-- Date: 2025-11-11

-- Create archived_inventory table (for master inventory archives)
CREATE TABLE IF NOT EXISTS archived_inventory (
    item_id INTEGER,
    item_name VARCHAR(255),
    stock_status VARCHAR(50),
    expiration_date DATE,
    category VARCHAR(100),
    batch_date DATE,
    stock_quantity FLOAT DEFAULT 0,
    unit_cost NUMERIC(10, 2) DEFAULT 0.00,
    archived_at TIMESTAMP DEFAULT NOW(),
    archived_reason VARCHAR(255) DEFAULT 'Auto-archived: depleted old batch with newer batches available',
    original_table VARCHAR(50) DEFAULT 'inventory',
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    PRIMARY KEY (item_id, batch_date, archived_at)
);

-- Create archived_inventory_today table
CREATE TABLE IF NOT EXISTS archived_inventory_today (
    item_id INTEGER,
    item_name VARCHAR(255),
    stock_status VARCHAR(50),
    expiration_date DATE,
    category VARCHAR(100),
    batch_date DATE,
    stock_quantity FLOAT DEFAULT 0,
    unit_cost NUMERIC(10, 2) DEFAULT 0.00,
    archived_at TIMESTAMP DEFAULT NOW(),
    archived_reason VARCHAR(255) DEFAULT 'Auto-archived: depleted old batch with newer batches available',
    original_table VARCHAR(50) DEFAULT 'inventory_today',
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    PRIMARY KEY (item_id, batch_date, archived_at)
);

-- Create archived_inventory_surplus table
CREATE TABLE IF NOT EXISTS archived_inventory_surplus (
    item_id INTEGER,
    item_name VARCHAR(255),
    stock_status VARCHAR(50),
    expiration_date DATE,
    category VARCHAR(100),
    batch_date DATE,
    stock_quantity FLOAT DEFAULT 0,
    unit_cost NUMERIC(10, 2) DEFAULT 0.00,
    archived_at TIMESTAMP DEFAULT NOW(),
    archived_reason VARCHAR(255) DEFAULT 'Auto-archived: depleted old batch with newer batches available',
    original_table VARCHAR(50) DEFAULT 'inventory_surplus',
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    PRIMARY KEY (item_id, batch_date, archived_at)
);

-- Create indexes for faster querying in reports
CREATE INDEX IF NOT EXISTS idx_archived_inventory_item_name ON archived_inventory(item_name);
CREATE INDEX IF NOT EXISTS idx_archived_inventory_archived_at ON archived_inventory(archived_at);
CREATE INDEX IF NOT EXISTS idx_archived_inventory_batch_date ON archived_inventory(batch_date);

CREATE INDEX IF NOT EXISTS idx_archived_inventory_today_item_name ON archived_inventory_today(item_name);
CREATE INDEX IF NOT EXISTS idx_archived_inventory_today_archived_at ON archived_inventory_today(archived_at);
CREATE INDEX IF NOT EXISTS idx_archived_inventory_today_batch_date ON archived_inventory_today(batch_date);

CREATE INDEX IF NOT EXISTS idx_archived_inventory_surplus_item_name ON archived_inventory_surplus(item_name);
CREATE INDEX IF NOT EXISTS idx_archived_inventory_surplus_archived_at ON archived_inventory_surplus(archived_at);
CREATE INDEX IF NOT EXISTS idx_archived_inventory_surplus_batch_date ON archived_inventory_surplus(batch_date);

-- Add comments
COMMENT ON TABLE archived_inventory IS 'Archived inventory batches that were auto-removed from active inventory. Used for historical reporting.';
COMMENT ON TABLE archived_inventory_today IS 'Archived today inventory batches. Used for historical reporting.';
COMMENT ON TABLE archived_inventory_surplus IS 'Archived surplus inventory batches. Used for historical reporting.';

COMMENT ON COLUMN archived_inventory.archived_at IS 'Timestamp when this batch was archived';
COMMENT ON COLUMN archived_inventory.archived_reason IS 'Reason for archiving (e.g., depleted with newer batches available)';
COMMENT ON COLUMN archived_inventory.original_table IS 'Which inventory table this came from';
