-- Migration: Create auto-archive function for depleted old batches
-- Purpose: Automatically archive depleted old batches when newer batches exist
-- Date: 2025-11-11

CREATE OR REPLACE FUNCTION auto_archive_depleted_old_batches(
    p_item_name VARCHAR,
    p_table_name VARCHAR DEFAULT 'inventory_today'
) RETURNS JSON AS $$
DECLARE
    archived_count INT := 0;
    batch_record RECORD;
    newer_batches_exist BOOLEAN;
    archived_table_name VARCHAR;
    result JSON;
BEGIN
    -- Determine the archived table name
    IF p_table_name = 'inventory' THEN
        archived_table_name := 'archived_inventory';
    ELSIF p_table_name = 'inventory_today' THEN
        archived_table_name := 'archived_inventory_today';
    ELSIF p_table_name = 'inventory_surplus' THEN
        archived_table_name := 'archived_inventory_surplus';
    ELSE
        RAISE EXCEPTION 'Invalid table name: %', p_table_name;
    END IF;

    -- Loop through all DEPLETED batches (stock_quantity = 0) for this item
    FOR batch_record IN
        EXECUTE format(
            'SELECT item_id, item_name, stock_status, expiration_date, category,
                    batch_date, stock_quantity, unit_cost, created_at, updated_at
             FROM %I
             WHERE LOWER(item_name) = LOWER($1)
             AND stock_quantity = 0
             ORDER BY batch_date ASC',
            p_table_name
        ) USING p_item_name
    LOOP
        -- Check if there are NEWER batches with stock > 0
        EXECUTE format(
            'SELECT EXISTS(
                SELECT 1 FROM %I
                WHERE LOWER(item_name) = LOWER($1)
                AND batch_date > $2
                AND stock_quantity > 0
            )',
            p_table_name
        ) INTO newer_batches_exist USING p_item_name, batch_record.batch_date;

        -- If newer batches exist, archive this old depleted batch
        IF newer_batches_exist THEN
            -- Insert into archived table with proper type casting
            EXECUTE format(
                'INSERT INTO %I (
                    item_id, item_name, stock_status, expiration_date, category,
                    batch_date, stock_quantity, unit_cost, archived_at, archived_reason,
                    original_table, created_at, updated_at
                ) VALUES ($1, $2, $3, $4::DATE, $5, $6::DATE, $7, $8, NOW(), $9, $10, $11::TIMESTAMP, $12::TIMESTAMP)',
                archived_table_name
            ) USING
                batch_record.item_id,
                batch_record.item_name,
                batch_record.stock_status,
                batch_record.expiration_date,
                batch_record.category,
                batch_record.batch_date,
                batch_record.stock_quantity,
                batch_record.unit_cost,
                'Auto-archived: depleted old batch with newer batches available',
                p_table_name,
                batch_record.created_at,
                batch_record.updated_at;

            -- Delete from active inventory table
            EXECUTE format(
                'DELETE FROM %I WHERE item_id = $1 AND batch_date = $2',
                p_table_name
            ) USING batch_record.item_id, batch_record.batch_date;

            archived_count := archived_count + 1;

            RAISE NOTICE 'Archived batch: % (item_id: %, batch_date: %) from % to %',
                batch_record.item_name, batch_record.item_id, batch_record.batch_date,
                p_table_name, archived_table_name;
        END IF;
    END LOOP;

    -- Return result as JSON
    result := json_build_object(
        'archived_count', archived_count,
        'item_name', p_item_name,
        'table', p_table_name,
        'archived_table', archived_table_name
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION auto_archive_depleted_old_batches IS
'Automatically archives depleted old batches when newer batches with stock exist.
Only removes batches with stock_quantity = 0 if there are newer batches (batch_date > old_batch) with stock > 0.
Returns JSON with count of archived batches.';

-- Example usage:
-- SELECT auto_archive_depleted_old_batches('Sinigang Mix', 'inventory_today');
