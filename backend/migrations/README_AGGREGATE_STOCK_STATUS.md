# Multi-Batch Aggregate Stock Status Implementation

## Overview

This implementation ensures that items are only marked as **"Out Of Stock"** when **ALL batches** of that item have zero stock quantity. This prevents premature out-of-stock alerts when some batches still have available inventory.

## Key Concept

**Before**: Each batch was marked individually as "Out Of Stock" when its `stock_quantity = 0`

**After**: An item is only marked "Out Of Stock" when the **SUM of all batches** with the same `item_name = 0`

### Example

**Scenario**: "Sinigang Mix" has 3 batches
- Batch A (2025-11-01): 0 units
- Batch B (2025-11-05): 10 units
- Batch C (2025-11-08): 5 units

**Previous Behavior**: Batch A would show as "Out Of Stock" even though 15 units are available

**New Behavior**: All batches show status "Normal" because total stock = 15 units

---

## Installation Steps

### Step 1: Run Database Migration

Execute the SQL migration to create the aggregate stock status function:

```bash
# Navigate to backend directory
cd C:\Users\Acsur\Desktop\VSCODE\cardiacdelights\Capstone-Project\backend

# Run the migration using psql or your database client
psql -U your_username -d your_database -f migrations/add_aggregate_stock_function.sql
```

Or execute directly in your PostgreSQL database:

```sql
-- Copy and paste the contents of:
-- migrations/add_aggregate_stock_function.sql
```

This will create:
- `calculate_aggregate_stock_status()` function
- Performance indexes on `LOWER(item_name)` for faster grouping

### Step 2: Verify Database Function

Test the function works correctly:

```sql
-- Test with an example item
SELECT calculate_aggregate_stock_status('Sinigang Mix', 'inventory_today');

-- Should return: 'Out Of Stock', 'Critical', 'Low', or 'Normal'
```

### Step 3: Backend is Already Updated

The following backend files have been modified:
- ✅ `app/routes/Inventory/aggregate_status.py` - NEW file with aggregate status endpoints
- ✅ `app/routes/Reports/Sales/salesimport.py` - Auto-deduction now updates aggregate status
- ✅ `app/routes/Dashboard/dashboard.py` - Out-of-stock endpoint uses aggregate logic
- ✅ `app/main.py` - Router registered

**No additional backend changes needed!**

### Step 4: Frontend is Already Updated

The following frontend files have been modified:
- ✅ `app/Features/Dashboard/hook/useDashboardQuery.ts` - Query hook uses `table=inventory_today`
- ✅ `app/Features/Dashboard/page.tsx` - UI shows grouped batch view

**No additional frontend changes needed!**

### Step 5: Restart Backend Server

```bash
# Stop the backend server (Ctrl+C)

# Start it again
cd C:\Users\Acsur\Desktop\VSCODE\cardiacdelights\Capstone-Project\backend
python -m uvicorn app.main:app --reload --port 8000
```

### Step 6: Rebuild Frontend (Optional)

If you want to test immediately:

```bash
cd C:\Users\Acsur\Desktop\VSCODE\cardiacdelights\Capstone-Project\frontend
npm run dev
```

---

## How It Works

### 1. Database Function

The PostgreSQL function `calculate_aggregate_stock_status()` computes stock status across all batches:

```sql
SELECT calculate_aggregate_stock_status('Item Name', 'inventory_today');
```

**Logic**:
1. Sums `stock_quantity` for all batches with the same `item_name`
2. Fetches threshold from `inventory_settings`
3. Returns status based on total stock:
   - `total_stock = 0` → "Out Of Stock"
   - `total_stock <= threshold × 0.5` → "Critical"
   - `total_stock <= threshold` → "Low"
   - `total_stock > threshold` → "Normal"

### 2. Auto-Deduction with Status Update

When sales are imported with auto-deduct enabled:

```python
# In salesimport.py
async def auto_deduct_inventory_from_sales(sale_date: str, enable_validation: bool = True, db=None):
    # ... deduction logic ...

    # Track all items that were deducted
    deducted_items = set()

    for ingredient in ingredients_data:
        ingredient_name = ingredient.get("ingredient_name")
        deducted_items.add(ingredient_name)  # Track for update
        # ... FIFO deduction ...

    # Update aggregate status for all deducted items
    for item_name in deducted_items:
        new_status = await update_aggregate_stock_status(item_name, "inventory_today", db)
        # All batches now have the same aggregate status
```

**Result**: After auto-deduction, ALL batches of each ingredient get updated with the correct aggregate status.

### 3. Dashboard Out-of-Stock Query

The dashboard now uses a CTE (Common Table Expression) to show only items where **ALL** batches are depleted:

```sql
WITH item_totals AS (
    SELECT
        item_name,
        SUM(stock_quantity) as total_stock,
        COUNT(*) as batch_count
    FROM inventory_today
    GROUP BY item_name
)
SELECT it.*, totals.total_stock, totals.batch_count
FROM inventory_today it
INNER JOIN item_totals totals ON LOWER(it.item_name) = LOWER(totals.item_name)
WHERE totals.total_stock = 0  -- Only show when ALL batches are zero
ORDER BY it.item_name, it.batch_date
```

### 4. Frontend Grouped Display

The dashboard UI groups batches by item name and shows:
- Item name
- Total number of batches depleted
- Collapsible details showing each batch's date and expiration

```typescript
// Group by item_name
Object.entries(
  outOfStockItems.reduce((acc, item) => {
    if (!acc[item.item_name]) acc[item.item_name] = [];
    acc[item.item_name].push(item);
    return acc;
  }, {})
).map(([itemName, batches]) => (
  <div>
    <h3>{itemName}</h3>
    <p>All {batches.length} batch(es) depleted</p>
    <details>
      {batches.map(batch => <li>Batch {batch.batch_date}</li>)}
    </details>
  </div>
))
```

---

## API Endpoints

### 1. Get Aggregate Status

```http
GET /api/inventory/aggregate-stock-status/{item_name}?table=inventory_today
```

**Response**:
```json
{
  "item_name": "Sinigang Mix",
  "aggregate_status": "Normal",
  "total_stock": 15.0,
  "batch_count": 3,
  "batches": [
    {
      "item_id": 1,
      "batch_date": "2025-11-01",
      "stock_quantity": 0,
      "individual_status": "Out Of Stock"
    },
    {
      "item_id": 2,
      "batch_date": "2025-11-05",
      "stock_quantity": 10,
      "individual_status": "Normal"
    },
    {
      "item_id": 3,
      "batch_date": "2025-11-08",
      "stock_quantity": 5,
      "individual_status": "Low"
    }
  ]
}
```

### 2. Recalculate All Aggregate Statuses

```http
POST /api/inventory/recalculate-aggregate-status?table=inventory_today
```

**Use Case**: Batch update to fix inconsistent status values

**Response**:
```json
{
  "message": "Successfully recalculated aggregate status for 45 items",
  "updated_items": [
    {"item_name": "Sinigang Mix", "status": "Normal"},
    {"item_name": "Chicken", "status": "Low"},
    ...
  ],
  "table": "inventory_today"
}
```

### 3. Out-of-Stock with Multi-Batch Support

```http
GET /api/dashboard/out-of-stock?table=inventory_today&limit=50&skip=0
```

**Response**: Only returns items where **ALL** batches have `stock_quantity = 0`

---

## Testing the Implementation

### Test Case 1: Partial Depletion

1. Create item "Test Item" with 2 batches:
   - Batch A: 10 units
   - Batch B: 5 units

2. Import sales that deduct 10 units (depletes Batch A only)

3. **Expected Result**:
   - Batch A: 0 units, status "Normal" (aggregate)
   - Batch B: 5 units, status "Normal" (aggregate)
   - Total: 5 units
   - **NOT shown in out-of-stock dashboard**

### Test Case 2: Complete Depletion

1. Continue from Test Case 1

2. Import sales that deduct 5 more units (depletes Batch B)

3. **Expected Result**:
   - Batch A: 0 units, status "Out Of Stock" (aggregate)
   - Batch B: 0 units, status "Out Of Stock" (aggregate)
   - Total: 0 units
   - **NOW shown in out-of-stock dashboard** with "All 2 batch(es) depleted"

### Test Case 3: Manual Recalculation

```bash
# Call the recalculation endpoint
curl -X POST http://localhost:8000/api/inventory/recalculate-aggregate-status?table=inventory_today
```

**Expected**: All items get their status recalculated based on current stock totals

---

## Troubleshooting

### Issue: Status not updating after auto-deduction

**Solution**: Check that database session is being passed:

```python
# In salesimport.py line 486
deduction_result = await auto_deduct_inventory_from_sales(
    sale_date,
    enable_validation=True,
    db=db  # ← Make sure this is passed!
)
```

### Issue: Database function not found

**Error**: `function calculate_aggregate_stock_status does not exist`

**Solution**: Run the migration:
```bash
psql -U your_username -d your_database -f migrations/add_aggregate_stock_function.sql
```

### Issue: Frontend still shows old out-of-stock items

**Solution**: Clear cache and refresh:
```javascript
// In browser console
localStorage.removeItem('cached_out_of_stock');
window.location.reload();
```

### Issue: Performance is slow

**Solution**: Ensure indexes are created:
```sql
CREATE INDEX IF NOT EXISTS idx_inventory_today_item_name_lower
ON inventory_today(LOWER(item_name));
```

---

## Maintenance

### Periodic Recalculation

To ensure data consistency, consider running a daily recalculation:

```python
# Add to scheduled tasks (e.g., APScheduler)
@scheduler.scheduled_job('cron', hour=3)  # Run at 3 AM daily
async def daily_status_recalculation():
    async with get_db() as db:
        from app.routes.Inventory.aggregate_status import update_aggregate_stock_status

        # Get all unique item names
        items = await db.execute(text("SELECT DISTINCT item_name FROM inventory_today"))

        for item in items:
            await update_aggregate_stock_status(item[0], "inventory_today", db)
```

---

## Benefits

1. **Accurate Stock Visibility**: No false out-of-stock alerts
2. **Better Inventory Management**: See aggregate stock across all batches
3. **Automatic Updates**: Status recalculates after every sales import
4. **Performance Optimized**: Uses database-level aggregation with indexes
5. **User-Friendly UI**: Grouped display shows batch details at a glance

---

## Files Modified

### Backend
- ✅ `migrations/add_aggregate_stock_function.sql` - NEW
- ✅ `app/routes/Inventory/aggregate_status.py` - NEW
- ✅ `app/routes/Reports/Sales/salesimport.py` - MODIFIED
- ✅ `app/routes/Dashboard/dashboard.py` - MODIFIED
- ✅ `app/main.py` - MODIFIED

### Frontend
- ✅ `app/Features/Dashboard/hook/useDashboardQuery.ts` - MODIFIED
- ✅ `app/Features/Dashboard/page.tsx` - MODIFIED

---

## Questions?

If you encounter any issues or need clarification:

1. Check the logs: `backend/logs/` or console output
2. Verify database function exists: `\df calculate_aggregate_stock_status` in psql
3. Test endpoints directly using curl or Postman
4. Review this README for troubleshooting steps

---

**Implementation Date**: 2025-11-11
**Version**: 1.0
**Status**: ✅ Complete and Ready for Testing
