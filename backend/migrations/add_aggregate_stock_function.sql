-- Migration: Add aggregate stock status calculation function
-- Purpose: Calculate stock status based on total stock across all batches of the same item
-- Date: 2025-11-11

CREATE OR REPLACE FUNCTION calculate_aggregate_stock_status(
    p_item_name VARCHAR,
    p_table_name VARCHAR DEFAULT 'inventory_today'
) RETURNS VARCHAR AS $$
DECLARE
    total_stock FLOAT;
    batch_count INT;
    item_threshold FLOAT;
    column_query TEXT;
BEGIN
    -- Build query dynamically to get total stock quantity across all batches
    -- Uses case-insensitive comparison for item names
    column_query := format(
        'SELECT COALESCE(SUM(stock_quantity), 0)::FLOAT, COUNT(*)::INT
         FROM %I
         WHERE LOWER(CAST(%I.item_name AS TEXT)) = LOWER($1)',
        p_table_name, p_table_name
    );

    EXECUTE column_query
    INTO total_stock, batch_count
    USING p_item_name;

    -- Get threshold from inventory_settings
    -- Use qualified column reference
    SELECT COALESCE(low_stock_threshold, 100.0) INTO item_threshold
    FROM inventory_settings
    WHERE LOWER(CAST(inventory_settings.item_name AS TEXT)) = LOWER(p_item_name)
    LIMIT 1;

    -- Default threshold if not found
    IF item_threshold IS NULL THEN
        item_threshold := 100.0;
    END IF;

    -- Calculate aggregate status based on TOTAL stock across all batches
    -- This ensures items are only marked "Out Of Stock" when ALL batches are depleted
    IF total_stock = 0 THEN
        RETURN 'Out Of Stock';
    ELSIF total_stock <= (item_threshold * 0.5) THEN
        RETURN 'Critical';
    ELSIF total_stock <= item_threshold THEN
        RETURN 'Low';
    ELSE
        RETURN 'Normal';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT calculate_aggregate_stock_status('Sinigang Mix', 'inventory_today');
-- SELECT calculate_aggregate_stock_status('Chicken', 'inventory');
-- SELECT calculate_aggregate_stock_status('Salt', 'inventory_surplus');

-- Create index for faster item_name lookups (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_inventory_item_name_lower ON inventory(LOWER(item_name));
CREATE INDEX IF NOT EXISTS idx_inventory_today_item_name_lower ON inventory_today(LOWER(item_name));
CREATE INDEX IF NOT EXISTS idx_inventory_surplus_item_name_lower ON inventory_surplus(LOWER(item_name));

COMMENT ON FUNCTION calculate_aggregate_stock_status IS
'Calculates stock status based on total stock across all batches of the same item.
Only marks items as "Out Of Stock" when ALL batches have zero stock.';
