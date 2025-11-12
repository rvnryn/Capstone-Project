# Auto-Archive System for Depleted Old Batches

## Overview

The auto-archive system automatically removes depleted old batches from active inventory **only when** newer batches with stock exist. This keeps your active inventory clean while preserving historical data for reports.

## How It Works

### Rules:

1. **OLD batch with 0 stock + NEW batch with stock > 0** → **Archive old batch** ✅
2. **OLD batch with 0 stock + NO new batches** → **Keep old batch** ❌ (Don't archive)
3. **Archived batches** → Removed from active inventory, but **STILL appear in inventory reports**

### Example Scenarios:

#### Scenario 1: Archive Old Batch (Normal Case)
**Sinigang Mix** has 3 batches:
- Batch A (2025-10-01): **0 units** ← OLD, depleted
- Batch B (2025-11-05): **10 units** ← NEWER, has stock
- Batch C (2025-11-08): **5 units** ← NEWEST

**Result**: Batch A is **auto-archived** because it's depleted AND newer batches (B, C) exist.

**Active inventory** will show:
- Batch B: 10 units
- Batch C: 5 units

**Archived inventory** (for reports) will show:
- Batch A: 0 units (archived 2025-11-11)

---

#### Scenario 2: Keep Old Batch (No Newer Batches)
**Salt** has 1 batch:
- Batch A (2025-10-01): **0 units** ← OLD, depleted

**Result**: Batch A is **NOT archived** because no newer batches exist.

**Active inventory** will show:
- Batch A: 0 units ← Still visible

**Why?** Because this is the ONLY batch, so you need to know that Salt is out of stock!

---

#### Scenario 3: Partial Depletion
**Chicken** has 2 batches:
- Batch A (2025-10-01): **5 units** ← OLD, still has stock
- Batch B (2025-11-05): **10 units** ← NEWER

**Result**: No archiving happens because Batch A still has stock.

---

## Installation

### Step 1: Create Archived Tables

Run this migration in Supabase SQL Editor:

```sql
-- Copy and paste the contents of:
-- backend/migrations/create_archived_inventory.sql
```

This creates 3 archived tables:
- `archived_inventory` (for master inventory)
- `archived_inventory_today` (for today's inventory)
- `archived_inventory_surplus` (for surplus inventory)

### Step 2: Create Auto-Archive Function

Run this migration in Supabase SQL Editor:

```sql
-- Copy and paste the contents of:
-- backend/migrations/create_auto_archive_function.sql
```

This creates the `auto_archive_depleted_old_batches()` function.

### Step 3: Run Fixed Aggregate Function

Make sure you've also run the fixed aggregate status function:

```sql
-- Copy and paste the contents of:
-- backend/FORCE_FIX_MIGRATION.sql
```

### Step 4: Restart Backend

```bash
cd C:\Users\Acsur\Desktop\VSCODE\cardiacdelights\Capstone-Project\backend
python -m uvicorn app.main:app --reload --port 8000
```

---

## How to Use

### Automatic Archiving

The system runs **automatically** whenever:

1. **Manual inventory update**: You manually update stock quantity to 0
2. **Sales auto-deduction**: Sales import deducts ingredients to 0
3. **Aggregate status recalculation**: You run the recalculation endpoint

### Manual Testing

Test the archive function directly in SQL:

```sql
-- Test archiving for a specific item
SELECT auto_archive_depleted_old_batches('Sinigang Mix', 'inventory_today');

-- Expected output:
-- {"archived_count": 1, "item_name": "Sinigang Mix", "table": "inventory_today", "archived_table": "archived_inventory_today"}
```

---

## API Endpoints

### 1. View Archived Inventory (For Reports)

```http
GET /api/inventory/archived?table=inventory_today&limit=100&skip=0
```

**Query Parameters:**
- `table`: Which archived table (`inventory`, `inventory_today`, `inventory_surplus`)
- `item_name`: Filter by specific item (optional)
- `start_date`: Filter by archived_at >= start_date (optional)
- `end_date`: Filter by archived_at <= end_date (optional)
- `limit`: Max records (1-1000, default: 100)
- `skip`: Pagination offset (default: 0)

**Response:**
```json
{
  "archived_items": [
    {
      "item_id": 123,
      "item_name": "Sinigang Mix",
      "stock_status": "Out Of Stock",
      "expiration_date": "2025-12-01",
      "category": "Seasonings",
      "batch_date": "2025-10-01",
      "stock_quantity": 0,
      "unit_cost": 25.50,
      "archived_at": "2025-11-11T10:30:00",
      "archived_reason": "Auto-archived: depleted old batch with newer batches available",
      "original_table": "inventory_today",
      "created_at": "2025-10-01T08:00:00",
      "updated_at": "2025-11-10T15:45:00"
    }
  ],
  "total_count": 1,
  "table": "archived_inventory_today",
  "filters": {
    "item_name": null,
    "start_date": null,
    "end_date": null
  }
}
```

### 2. Recalculate with Auto-Archive

```http
POST /api/inventory/recalculate-aggregate-status?table=inventory_today
```

This will:
1. Recalculate aggregate status for all items
2. Auto-archive depleted old batches (if newer batches exist)

---

## Workflow Examples

### Example 1: Sales Import with Auto-Deduction

1. **Before**: Sinigang Mix has 2 batches
   - Batch A (2025-10-01): 10 units
   - Batch B (2025-11-05): 20 units

2. **User Action**: Import sales that deduct 10 units

3. **System Process**:
   - FIFO deduction: Batch A depleted to 0 units
   - Aggregate status update triggered
   - **Auto-archive**: Batch A archived (because Batch B exists)

4. **After**: Active inventory shows only:
   - Batch B: 20 units

5. **Reports**: Archived inventory shows:
   - Batch A: 0 units (archived 2025-11-11)

### Example 2: Manual Update

1. **User Action**: Manually update Batch A stock to 0

2. **System Process**:
   - Aggregate status update triggered
   - Check for newer batches
   - **Auto-archive**: Batch A archived (if newer batches exist)

3. **Result**: Clean active inventory, historical data preserved

---

## Disable Auto-Archive (Optional)

If you want to disable auto-archive for a specific update:

```python
# In your code:
await update_aggregate_stock_status(
    item_name="Sinigang Mix",
    table_name="inventory_today",
    db=db,
    auto_archive=False  # ← Disable auto-archive
)
```

---

## Benefits

1. ✅ **Clean active inventory**: No cluttered views with 0-stock old batches
2. ✅ **Historical data preserved**: All archived batches still in database for reports
3. ✅ **Automatic**: No manual intervention needed
4. ✅ **Smart**: Only archives when newer batches exist
5. ✅ **Safe**: Last remaining batch is never archived

---

## Database Tables

### Archived Tables Structure

All archived tables have the same structure:

```sql
CREATE TABLE archived_inventory_today (
    item_id INTEGER,
    item_name VARCHAR(255),
    stock_status VARCHAR(50),
    expiration_date DATE,
    category VARCHAR(100),
    batch_date DATE,
    stock_quantity FLOAT DEFAULT 0,
    unit_cost NUMERIC(10, 2) DEFAULT 0.00,
    archived_at TIMESTAMP DEFAULT NOW(),         -- When it was archived
    archived_reason VARCHAR(255),                 -- Why it was archived
    original_table VARCHAR(50),                   -- Which table it came from
    created_at TIMESTAMP,                         -- Original creation time
    updated_at TIMESTAMP,                         -- Last update before archiving
    PRIMARY KEY (item_id, batch_date, archived_at)
);
```

### Indexes

For fast report queries:
- `idx_archived_inventory_item_name`
- `idx_archived_inventory_archived_at`
- `idx_archived_inventory_batch_date`

---

## Troubleshooting

### Issue: Batch not archiving even though newer batches exist

**Check:**
1. Is `stock_quantity` exactly 0? (Not NULL, not negative)
2. Does newer batch have `batch_date > old_batch_date`?
3. Does newer batch have `stock_quantity > 0`?

**Debug SQL:**
```sql
-- Check batches for an item
SELECT item_id, batch_date, stock_quantity
FROM inventory_today
WHERE LOWER(item_name) = LOWER('Sinigang Mix')
ORDER BY batch_date ASC;

-- Manually test archive function
SELECT auto_archive_depleted_old_batches('Sinigang Mix', 'inventory_today');
```

### Issue: Last remaining batch was archived

**This should NEVER happen!** The function only archives if newer batches exist.

**Check:**
```sql
-- Verify archived batch
SELECT * FROM archived_inventory_today
WHERE item_name = 'Sinigang Mix'
ORDER BY archived_at DESC
LIMIT 1;

-- Check if item still exists in active inventory
SELECT * FROM inventory_today
WHERE item_name = 'Sinigang Mix';
```

### Issue: Archived batches not showing in reports

**Solution:**
Use the archived inventory endpoint:

```bash
curl "http://localhost:8000/api/inventory/archived?table=inventory_today&item_name=Sinigang%20Mix"
```

---

## Files Modified/Created

### New Files:
- ✅ `migrations/create_archived_inventory.sql`
- ✅ `migrations/create_auto_archive_function.sql`
- ✅ `AUTO_ARCHIVE_SYSTEM_README.md` (this file)

### Modified Files:
- ✅ `app/routes/Inventory/aggregate_status.py` - Added auto-archive logic
- ✅ `app/routes/Inventory/master_inventory.py` - Triggers auto-archive
- ✅ `app/routes/Inventory/today_inventory.py` - Triggers auto-archive
- ✅ `app/routes/Inventory/surplus_inventory.py` - Triggers auto-archive
- ✅ `app/routes/Reports/Sales/salesimport.py` - Triggers auto-archive

---

## Summary

The auto-archive system keeps your inventory clean by automatically removing depleted old batches **only when** newer batches exist. Archived batches are preserved for reporting, ensuring you never lose historical data.

**Key Rule**: Only archive if `old_batch.stock_quantity = 0` AND `newer_batch.batch_date > old_batch.batch_date` AND `newer_batch.stock_quantity > 0`.

---

**Implementation Date**: 2025-11-11
**Version**: 1.0
**Status**: ✅ Complete and Ready for Testing
