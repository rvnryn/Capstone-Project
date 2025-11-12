"""
Run database migration using Supabase SQL endpoint
"""
import os
from dotenv import load_dotenv
import requests

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Just the CREATE TABLE statement
create_table_sql = """
CREATE TABLE IF NOT EXISTS inventory_transactions (
    transaction_id BIGSERIAL PRIMARY KEY,
    transaction_type VARCHAR(50) NOT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    item_id INTEGER NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    batch_date DATE,
    category VARCHAR(100),
    quantity_before DECIMAL(12, 4) NOT NULL,
    quantity_changed DECIMAL(12, 4) NOT NULL,
    quantity_after DECIMAL(12, 4) NOT NULL,
    unit_of_measurement VARCHAR(20) NOT NULL,
    source_type VARCHAR(50),
    source_id INTEGER,
    source_reference VARCHAR(255),
    menu_item VARCHAR(255),
    user_id INTEGER,
    user_name VARCHAR(255),
    user_role VARCHAR(100),
    notes TEXT,
    recipe_unit VARCHAR(20),
    recipe_quantity DECIMAL(12, 4),
    conversion_applied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

# Indexes
indexes_sql = [
    "CREATE INDEX IF NOT EXISTS idx_inv_trans_item ON inventory_transactions(item_id, transaction_date DESC);",
    "CREATE INDEX IF NOT EXISTS idx_inv_trans_item_name ON inventory_transactions(item_name, transaction_date DESC);",
    "CREATE INDEX IF NOT EXISTS idx_inv_trans_type ON inventory_transactions(transaction_type, transaction_date DESC);",
    "CREATE INDEX IF NOT EXISTS idx_inv_trans_date ON inventory_transactions(transaction_date DESC);",
    "CREATE INDEX IF NOT EXISTS idx_inv_trans_source ON inventory_transactions(source_type, source_reference);",
    "CREATE INDEX IF NOT EXISTS idx_inv_trans_batch ON inventory_transactions(batch_date, item_name);"
]

def run_sql(sql_statement):
    """Execute SQL via Supabase REST API"""
    url = f"https://{SUPABASE_URL}/rest/v1/rpc/exec_sql"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }

    # Try direct PostgREST query endpoint for raw SQL
    # Supabase doesn't expose raw SQL via REST API by default
    # We need to use the SQL Editor in dashboard OR use psql

    print(f"SQL: {sql_statement[:100]}...")
    print("\nNote: Supabase REST API doesn't support raw SQL execution.")
    print("Please use one of these methods instead:\n")

    return False

if __name__ == "__main__":
    print("=" * 80)
    print("MIGRATION: Create inventory_transactions table")
    print("=" * 80)
    print("\nYou have 2 options to run this migration:\n")

    print("OPTION 1 (RECOMMENDED): Supabase Dashboard")
    print("-" * 80)
    print(f"1. Go to: https://supabase.com/dashboard/project/pfxxnqvaniyadzlizgqf/sql/new")
    print("2. Copy the SQL from: migrations/create_inventory_transactions_table.sql")
    print("3. Paste into SQL Editor")
    print("4. Click 'Run'\n")

    print("OPTION 2: Use psql command line")
    print("-" * 80)
    print("Run this command:")
    print('psql "postgresql://postgres.pfxxnqvaniyadzlizgqf:Urayanarvin#747@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres" -f migrations/create_inventory_transactions_table.sql')
    print("\n" + "=" * 80)

    # Print the SQL for easy copying
    print("\nFull SQL to copy:")
    print("=" * 80)
    with open("migrations/create_inventory_transactions_table.sql", "r") as f:
        print(f.read())
