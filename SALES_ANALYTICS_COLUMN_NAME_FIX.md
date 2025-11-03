# Sales Analytics Column Name Fix - COMPLETE ✅

## Summary
Fixed SQL query errors in the comprehensive sales analytics endpoint where `unit_cost` was incorrectly used instead of `unit_price` when querying the `sales_report` table.

---

## Error Details

### Error Message
```
sqlalchemy.exc.ProgrammingError: column "unit_cost" does not exist
```

### Root Cause
The `sales_report` table has a column named `unit_price`, not `unit_cost`:
- ✅ **Inventory tables** use `unit_cost` (what you pay for inventory)
- ✅ **Sales table** uses `unit_price` (what customers pay for menu items)

The queries were incorrectly trying to use `unit_cost` in sales queries.

---

## Affected Endpoint

**Endpoint:** `GET /api/comprehensive-sales-analytics`
**File:** `backend/app/routes/Reports/Sales/sales_report.py`
**Function:** `get_comprehensive_sales_analytics`

---

## Changes Made

### File Modified
**[backend/app/routes/Reports/Sales/sales_report.py](backend/app/routes/Reports/Sales/sales_report.py)**

### 1. Revenue Summary Query (Line 771)

**Before:**
```sql
SELECT
    SUM(quantity) as total_items_sold,
    SUM(total_price) as total_revenue,
    AVG(unit_cost) as avg_unit_cost,  -- ❌ WRONG COLUMN
    COUNT(DISTINCT item_name) as unique_items_sold,
    COUNT(*) as total_transactions
FROM sales_report
WHERE DATE(sale_date) BETWEEN :start_date AND :end_date
```

**After:**
```sql
SELECT
    SUM(quantity) as total_items_sold,
    SUM(total_price) as total_revenue,
    AVG(unit_price) as avg_unit_cost,  -- ✅ CORRECT COLUMN
    COUNT(DISTINCT item_name) as unique_items_sold,
    COUNT(*) as total_transactions
FROM sales_report
WHERE DATE(sale_date) BETWEEN :start_date AND :end_date
```

### 2. Top Selling Items Query (Line 888)

**Before:**
```sql
SELECT
    item_name,
    category,
    SUM(quantity) as total_quantity_sold,
    SUM(total_price) as total_revenue,
    AVG(unit_cost) as avg_price  -- ❌ WRONG COLUMN
FROM sales_report
WHERE DATE(sale_date) BETWEEN :start_date AND :end_date
GROUP BY item_name, category
ORDER BY total_revenue DESC
LIMIT 10
```

**After:**
```sql
SELECT
    item_name,
    category,
    SUM(quantity) as total_quantity_sold,
    SUM(total_price) as total_revenue,
    AVG(unit_price) as avg_price  -- ✅ CORRECT COLUMN
FROM sales_report
WHERE DATE(sale_date) BETWEEN :start_date AND :end_date
GROUP BY item_name, category
ORDER BY total_revenue DESC
LIMIT 10
```

### 3. Category Breakdown Query (Line 922)

**Before:**
```sql
SELECT
    category,
    SUM(quantity) as total_quantity,
    SUM(total_price) as total_revenue,
    COUNT(DISTINCT item_name) as unique_items,
    AVG(unit_cost) as avg_price  -- ❌ WRONG COLUMN
FROM sales_report
WHERE DATE(sale_date) BETWEEN :start_date AND :end_date
GROUP BY category
ORDER BY total_revenue DESC
```

**After:**
```sql
SELECT
    category,
    SUM(quantity) as total_quantity,
    SUM(total_price) as total_revenue,
    COUNT(DISTINCT item_name) as unique_items,
    AVG(unit_price) as avg_price  -- ✅ CORRECT COLUMN
FROM sales_report
WHERE DATE(sale_date) BETWEEN :start_date AND :end_date
GROUP BY category
ORDER BY total_revenue DESC
```

---

## Column Name Convention

### Inventory System
**Column:** `unit_cost`
**Tables:** `inventory`, `inventory_today`, `inventory_surplus`, `inventory_spoilage`
**Meaning:** Cost per unit paid to supplier
**Example:** Buy eggs for ₱5.00 per piece

### Sales System
**Column:** `unit_price`
**Tables:** `sales_report`, `menu`
**Meaning:** Price per unit sold to customer
**Example:** Sell egg dish for ₱120.00 per serving

### Why Different?
```
unit_cost (inventory)  →  What we PAY
unit_price (sales)     →  What customers PAY
profit = unit_price - unit_cost
```

---

## Impact

### Before Fix
- ❌ API endpoint crashed with 500 error
- ❌ Sales analytics page failed to load
- ❌ Error: "column unit_cost does not exist"

### After Fix
- ✅ API endpoint returns data successfully
- ✅ Sales analytics page loads correctly
- ✅ Average prices calculated correctly
- ✅ Top items and category breakdowns working

---

## Testing

### Test Endpoint
```bash
GET http://localhost:8000/api/comprehensive-sales-analytics?start_date=2025-10-02&end_date=2025-11-01
```

### Expected Response (Sample)
```json
{
  "summary": {
    "total_revenue": 50000.00,
    "total_cogs": 20000.00,
    "gross_profit": 30000.00,
    "total_loss": 500.00,
    "net_profit": 29500.00,
    "total_items_sold": 200,
    "unique_items_sold": 50,
    "total_transactions": 150,
    "avg_unit_price": 250.00  // ✅ Now using unit_price
  },
  "top_selling_items": [
    {
      "item_name": "Fried Chicken",
      "category": "Main Course",
      "total_quantity_sold": 50,
      "total_revenue": 6000.00,
      "avg_price": 120.00  // ✅ Now using unit_price
    }
  ],
  "category_breakdown": [
    {
      "category": "Main Course",
      "total_quantity": 100,
      "total_revenue": 15000.00,
      "unique_items": 10,
      "avg_price": 150.00  // ✅ Now using unit_price
    }
  ]
}
```

---

## Related Files (No Changes Needed)

These files correctly use `unit_cost` for inventory queries:
- ✅ `backend/app/models/inventory.py`
- ✅ `backend/app/models/inventory_today.py`
- ✅ `backend/app/models/inventory_surplus.py`
- ✅ `backend/app/models/inventory_spoilage.py`
- ✅ `backend/app/routes/Inventory/*.py`

These files correctly use `unit_price` for sales queries:
- ✅ `backend/app/models/sales.py`
- ✅ `backend/app/routes/Reports/Sales/sales_report.py` (now fixed)

---

## Note on COGS Calculation

The COGS (Cost of Goods Sold) calculation in the same file CORRECTLY uses `unit_cost` from inventory tables:

```sql
-- This is CORRECT ✅
SELECT AVG(it.unit_cost)
FROM inventory_today it
WHERE LOWER(TRIM(it.item_name)) = LOWER(TRIM(mi.ingredient_name))
```

This is correct because COGS calculates the cost of ingredients used (from inventory), not the selling price.

---

## Verification Checklist

- [x] Revenue summary query fixed (line 771)
- [x] Top selling items query fixed (line 888)
- [x] Category breakdown query fixed (line 922)
- [x] API endpoint returns 200 OK (not 500 error)
- [x] Sales analytics page loads without errors
- [x] Average prices calculated correctly
- [x] COGS calculation still uses unit_cost (correct)

---

## Database Schema Reference

### sales_report table columns:
```sql
- id
- item_name
- category
- quantity
- unit_price       ✅ (not unit_cost)
- total_price
- sale_date
- order_number
- transaction_number
- dine_type
- report_date
```

### inventory tables columns:
```sql
- id
- item_name
- category
- stock_quantity
- unit_cost        ✅ (not unit_price)
- expiration_date
- batch_date
- ...
```

---

## Prevention

To avoid similar issues in the future:

1. **Use consistent naming:**
   - Inventory → `unit_cost`
   - Sales/Menu → `unit_price`

2. **Add code comments:**
   ```python
   # Use unit_cost for inventory (what we pay)
   # Use unit_price for sales (what customers pay)
   ```

3. **Test with actual data:**
   - Always test analytics endpoints after schema changes
   - Run integration tests for all report endpoints

---

**Completion Date:** 2025-11-02
**Status:** Production Ready ✅
**Breaking Changes:** None (bug fix only)
**File Modified:** 1 file (sales_report.py)
**Lines Changed:** 3 lines
**Impact:** Backend SQL queries only
