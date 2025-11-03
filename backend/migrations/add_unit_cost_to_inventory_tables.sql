-- Migration: Add unit_cost column to inventory tables
-- Purpose: Enable cost tracking and financial reporting for inventory management
-- Date: 2025-11-01
-- Phase 1: Financial Visibility + Movement Tracking

-- Add unit_cost column to inventory table (Master Inventory)
ALTER TABLE inventory
ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(10, 2) DEFAULT 0.00;

-- Add unit_cost column to inventory_today table (Today's Inventory)
ALTER TABLE inventory_today
ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(10, 2) DEFAULT 0.00;

-- Add unit_cost column to inventory_surplus table (Surplus Inventory)
ALTER TABLE inventory_surplus
ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(10, 2) DEFAULT 0.00;

-- Add unit_cost column to inventory_spoilage table (Spoilage Tracking)
ALTER TABLE inventory_spoilage
ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(10, 2) DEFAULT 0.00;

-- Add comments to document the columns
COMMENT ON COLUMN inventory.unit_cost IS 'Cost per unit of inventory item';
COMMENT ON COLUMN inventory_today.unit_cost IS 'Cost per unit of inventory item in today''s inventory';
COMMENT ON COLUMN inventory_surplus.unit_cost IS 'Cost per unit of surplus inventory item';
COMMENT ON COLUMN inventory_spoilage.unit_cost IS 'Cost per unit of spoiled inventory item (for calculating financial loss)';

-- Create indexes for performance (optional, but recommended for large datasets)
CREATE INDEX IF NOT EXISTS idx_inventory_unit_cost ON inventory(unit_cost) WHERE unit_cost > 0;
CREATE INDEX IF NOT EXISTS idx_inventory_today_unit_cost ON inventory_today(unit_cost) WHERE unit_cost > 0;
CREATE INDEX IF NOT EXISTS idx_inventory_surplus_unit_cost ON inventory_surplus(unit_cost) WHERE unit_cost > 0;
CREATE INDEX IF NOT EXISTS idx_inventory_spoilage_unit_cost ON inventory_spoilage(unit_cost) WHERE unit_cost > 0;
