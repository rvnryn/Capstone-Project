-- Fix: Drop and recreate aggregate stock status function
-- This fixes the "column item_name does not exist" error

-- Drop the existing function
DROP FUNCTION IF EXISTS calculate_aggregate_stock_status(VARCHAR, VARCHAR);

-- Create the corrected function
CREATE OR REPLACE FUNCTION calculate_aggregate_stock_status(
    p_item_name VARCHAR,
    p_table_name VARCHAR DEFAULT 'inventory_today'
) RETURNS VARCHAR AS $$
DECLARE
    total_stock FLOAT;
    batch_count INT;
    item_threshold FLOAT;
BEGIN
    -- Get total stock quantity across all batches for this item
    -- Fixed: Don't reference table.column in format string
    IF p_table_name = 'inventory' THEN
        SELECT COALESCE(SUM(stock_quantity), 0), COUNT(*)
        INTO total_stock, batch_count
        FROM inventory
        WHERE LOWER(item_name) = LOWER(p_item_name);
    ELSIF p_table_name = 'inventory_today' THEN
        SELECT COALESCE(SUM(stock_quantity), 0), COUNT(*)
        INTO total_stock, batch_count
        FROM inventory_today
        WHERE LOWER(item_name) = LOWER(p_item_name);
    ELSIF p_table_name = 'inventory_surplus' THEN
        SELECT COALESCE(SUM(stock_quantity), 0), COUNT(*)
        INTO total_stock, batch_count
        FROM inventory_surplus
        WHERE LOWER(item_name) = LOWER(p_item_name);
    ELSE
        RAISE EXCEPTION 'Invalid table name: %', p_table_name;
    END IF;

    -- Get threshold from inventory_settings
    -- Cast low_stock_threshold to NUMERIC to fix COALESCE type mismatch
    -- Note: inventory_settings uses 'name' column, not 'item_name'
    SELECT COALESCE(CAST(low_stock_threshold AS NUMERIC), 100.0) INTO item_threshold
    FROM inventory_settings
    WHERE LOWER(name) = LOWER(p_item_name)
    LIMIT 1;

    -- Default threshold if not found
    IF item_threshold IS NULL THEN
        item_threshold := 100.0;
    END IF;

    -- Calculate aggregate status based on TOTAL stock across all batches
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

-- Test the function
SELECT calculate_aggregate_stock_status('Sinigang Mix', 'inventory');
