"""
Run database migration to create inventory_transactions table
"""
import asyncio
from sqlalchemy import text
from app.supabase import engine

async def run_migration():
    """Execute the inventory_transactions table migration"""

    migration_sql = """
-- Migration: Create inventory_transactions table for detailed audit trail
-- Description: Logs every inventory change (deduction, restock, transfer, adjustment)
-- Date: 2025-01-09

-- Create inventory_transactions table
CREATE TABLE IF NOT EXISTS inventory_transactions (
    transaction_id BIGSERIAL PRIMARY KEY,
    transaction_type VARCHAR(50) NOT NULL,  -- DEDUCTION, RESTOCK, TRANSFER, ADJUSTMENT, SPOILAGE
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Item identification
    item_id INTEGER NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    batch_date DATE,
    category VARCHAR(100),

    -- Quantity changes
    quantity_before DECIMAL(12, 4) NOT NULL,
    quantity_changed DECIMAL(12, 4) NOT NULL,  -- Positive for add, negative for deduct
    quantity_after DECIMAL(12, 4) NOT NULL,
    unit_of_measurement VARCHAR(20) NOT NULL,

    -- Source tracking
    source_type VARCHAR(50),  -- SALES_IMPORT, MANUAL_DEDUCTION, RESTOCK, AUTO_TRANSFER
    source_id INTEGER,  -- Reference to sale ID, order ID, etc.
    source_reference VARCHAR(255),  -- Sale date, order number, receipt number, etc.
    menu_item VARCHAR(255),  -- For sales deductions

    -- User tracking
    user_id INTEGER,
    user_name VARCHAR(255),
    user_role VARCHAR(100),

    -- Additional details
    notes TEXT,
    recipe_unit VARCHAR(20),  -- Original unit from recipe
    recipe_quantity DECIMAL(12, 4),  -- Original quantity from recipe
    conversion_applied BOOLEAN DEFAULT FALSE,

    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_inv_trans_item ON inventory_transactions(item_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_inv_trans_item_name ON inventory_transactions(item_name, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_inv_trans_type ON inventory_transactions(transaction_type, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_inv_trans_date ON inventory_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_inv_trans_source ON inventory_transactions(source_type, source_reference);
CREATE INDEX IF NOT EXISTS idx_inv_trans_batch ON inventory_transactions(batch_date, item_name);

-- Add comments
COMMENT ON TABLE inventory_transactions IS 'Complete audit trail of all inventory quantity changes';
COMMENT ON COLUMN inventory_transactions.transaction_type IS 'Type of transaction: DEDUCTION, RESTOCK, TRANSFER, ADJUSTMENT, SPOILAGE';
COMMENT ON COLUMN inventory_transactions.quantity_changed IS 'Positive for additions (restock), negative for deductions';
COMMENT ON COLUMN inventory_transactions.source_type IS 'Origin of transaction: SALES_IMPORT, MANUAL_DEDUCTION, RESTOCK, AUTO_TRANSFER';
COMMENT ON COLUMN inventory_transactions.source_reference IS 'External reference like sale_date, order_number, receipt_number';
COMMENT ON COLUMN inventory_transactions.menu_item IS 'Menu item name for sales deductions';
COMMENT ON COLUMN inventory_transactions.conversion_applied IS 'Whether unit conversion was needed (recipe_unit != inventory_unit)';
"""

    try:
        async with engine.begin() as conn:
            print("Running migration...")
            await conn.execute(text(migration_sql))
            print("✅ Migration completed successfully!")
            print("✅ inventory_transactions table created with indexes")

    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        raise

if __name__ == "__main__":
    asyncio.run(run_migration())
