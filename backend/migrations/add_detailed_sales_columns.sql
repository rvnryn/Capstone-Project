-- Migration: Add detailed restaurant tracking columns to sales_report table
-- This adds all the fields needed for comprehensive sales tracking including discounts, orders, staff, etc.

-- Add discount tracking columns
ALTER TABLE sales_report
ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2) DEFAULT 0;

-- Add order tracking columns
ALTER TABLE sales_report
ADD COLUMN IF NOT EXISTS order_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS transaction_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(50);

-- Add service type and staff columns
ALTER TABLE sales_report
ADD COLUMN IF NOT EXISTS dine_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS order_taker VARCHAR(100),
ADD COLUMN IF NOT EXISTS cashier VARCHAR(100),
ADD COLUMN IF NOT EXISTS terminal_no VARCHAR(20);

-- Add customer tracking
ALTER TABLE sales_report
ADD COLUMN IF NOT EXISTS member VARCHAR(100),
ADD COLUMN IF NOT EXISTS member_code VARCHAR(50);

-- Add itemcode if not exists
ALTER TABLE sales_report
ADD COLUMN IF NOT EXISTS itemcode VARCHAR(50);

-- Add subtotal column (amount before discount)
ALTER TABLE sales_report
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) DEFAULT 0;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sales_order_number ON sales_report(order_number);
CREATE INDEX IF NOT EXISTS idx_sales_transaction_number ON sales_report(transaction_number);
CREATE INDEX IF NOT EXISTS idx_sales_discount ON sales_report(discount_percentage) WHERE discount_percentage > 0;
CREATE INDEX IF NOT EXISTS idx_sales_dine_type ON sales_report(dine_type);
CREATE INDEX IF NOT EXISTS idx_sales_order_taker ON sales_report(order_taker);
CREATE INDEX IF NOT EXISTS idx_sales_cashier ON sales_report(cashier);

-- Add comments for documentation
COMMENT ON COLUMN sales_report.discount_percentage IS 'Discount percentage applied (e.g., senior/PWD discount)';
COMMENT ON COLUMN sales_report.order_number IS 'Order number from POS system';
COMMENT ON COLUMN sales_report.transaction_number IS 'Transaction ID from POS';
COMMENT ON COLUMN sales_report.receipt_number IS 'Receipt number';
COMMENT ON COLUMN sales_report.dine_type IS 'Service type: DINE-IN, TAKE-OUT, DELIVERY';
COMMENT ON COLUMN sales_report.order_taker IS 'Staff member who took the order';
COMMENT ON COLUMN sales_report.cashier IS 'Cashier who processed the payment';
COMMENT ON COLUMN sales_report.terminal_no IS 'POS terminal number';
COMMENT ON COLUMN sales_report.member IS 'Customer/member name';
COMMENT ON COLUMN sales_report.subtotal IS 'Amount before discount applied';

-- Success message
SELECT 'Migration completed: Added detailed tracking columns to sales_report table' AS status;
