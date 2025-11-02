-- Fix Surplus Inventory 4x multiplication issue
-- This script divides all surplus stock quantities by 4 to correct the duplication

UPDATE inventory_surplus
SET
    stock_quantity = stock_quantity / 4.0,
    updated_at = NOW()
WHERE stock_quantity > 0;

-- Show the updated records
SELECT
    item_id,
    item_name,
    batch_date,
    stock_quantity,
    category,
    stock_status
FROM inventory_surplus
ORDER BY item_name, batch_date;
