-- FORCE FIX: This will completely remove and recreate the function
-- Run this in Supabase SQL Editor

-- Step 1: Drop ALL versions of the function (with different signatures)
DROP FUNCTION IF EXISTS calculate_aggregate_stock_status(VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS calculate_aggregate_stock_status(VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS calculate_aggregate_stock_status CASCADE;

-- Step 2: Verify it's gone
-- You should see "No such function" if successful
-- SELECT calculate_aggregate_stock_status('test', 'inventory_today');

-- Step 3: Create the FIXED function with BOTH fixes applied
CREATE FUNCTION calculate_aggregate_stock_status(
    p_item_name VARCHAR,
    p_table_name VARCHAR DEFAULT 'inventory_today'
) RETURNS VARCHAR AS $$
DECLARE
    total_stock FLOAT;
    batch_count INT;
    item_threshold FLOAT;
BEGIN
    -- Get total stock quantity across all batches for this item
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
    -- FIX #1: Use 'name' column (not 'item_name') - inventory_settings uses 'name'
    -- FIX #2: Cast VARCHAR to NUMERIC to fix COALESCE type mismatch
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

-- Step 4: Test the function
SELECT calculate_aggregate_stock_status('Sinigang Mix', 'inventory_today') as status;

-- Expected result: 'Normal', 'Low', 'Critical', or 'Out Of Stock'
-- If you get an error, the function is still broken
-- If you get a status, SUCCESS!
