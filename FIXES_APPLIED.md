# FIXES APPLIED - Critical Bugs

## Date: 2025-01-10

---

## ✅ ISSUE 1: Sales Auto-Deducting Without Import [FIXED]

### Problem:
Sales inventory was being automatically deducted even when user didn't import sales data or didn't want auto-deduction.

### Root Cause:
In `salesimport.py` line 373, the `auto_deduct` parameter defaulted to `True`:
```python
auto_deduct = data.get("auto_deduct", True)  # WRONG - Always deducts!
```

###Fixes Applied:

**Fix 1: Changed Default to False** ✅
```python
# backend/app/routes/Reports/Sales/salesimport.py:373
auto_deduct = data.get("auto_deduct", False)  # Default to False - explicit opt-in required
```

**Fix 2: Added Logging** ✅
```python
# Lines 440-455
if auto_deduct and sale_dates:
    logger.info(f"AUTO-DEDUCTION ENABLED: Processing {len(sale_dates)} sale dates: {list(sale_dates)}")
    # ... deduction logic ...
else:
    if not auto_deduct:
        logger.info("AUTO-DEDUCTION DISABLED: Skipping inventory deduction")
    else:
        logger.info("AUTO-DEDUCTION SKIPPED: No sale dates to process")
```

### Impact:
- Auto-deduction now requires **explicit opt-in** by sending `auto_deduct: true` in request
- Logs show when deductions happen for debugging
- **RESTART BACKEND** to apply this fix

---

## ⚠️ ISSUE 2: Session Expired Problem [ANALYZED - NO CODE CHANGE NEEDED]

### Problem:
User experiences "session expired" messages frequently

### Analysis:

**Good News**: Frontend ALREADY has automatic token refresh!
- Refreshes every 45 minutes (line 283 in `AuthContext.tsx`)
- Refreshes on window focus if token expires <5 minutes (line 332-378)
- Uses localStorage for persistence

**Actual Causes**:

1. **Supabase JWT Expiration** (Most Likely)
   - Supabase default JWT expires in 1 hour
   - Frontend refreshes at 45 minutes, giving 15-minute buffer
   - If user is inactive for >1 hour, token expires before refresh

2. **Network/Backend Issues**
   - If backend is unreachable during refresh, token expires
   - Line 98-114 tries to fetch `/api/auth/session`, falls back to cache if fails

3. **Browser Issues**
   - localStorage cleared by user/browser
   - Cookie/storage limits in private browsing

### Recommendations:

**Option A: Increase Supabase JWT Expiration (Recommended)**
1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/pfxxnqvaniyadzlizgqf/auth/url-configuration
2. Settings → Auth → JWT Expiry
3. Change from 3600 seconds (1 hour) to 28800 seconds (8 hours)

**Option B: Add Session Expiry Warning in UI**
Add toast notification 5 minutes before token expires:
```typescript
// Show warning when token expires in <5 minutes
if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
    showToast("Your session will expire soon. Click to stay signed in.");
}
```

**Option C: Check Backend Availability**
If `/api/auth/session` frequently fails, check:
- Backend server uptime
- Network connection
- CORS configuration

### No Code Changes Required:
The frontend already handles token refresh correctly. The issue is either:
- Supabase JWT expiration too short (fix in Supabase dashboard)
- Backend connectivity issues (check logs)
- User clearing browser data manually

---

## 🔍 ISSUE 3: Menu Ingredients Disappearing [NEEDS INVESTIGATION]

### Analysis:

**Code Review**: The `get_menu()` endpoint fetches ALL menu_ingredients:
```python
# menu.py:369-373
ing_res = (
    postgrest_client.table("menu_ingredients")
    .select("menu_id,ingredient_id,ingredient_name,quantity,measurements")
    .in_("menu_id", menu_ids)
    .execute()
)
```

**This query has NO filtering based on stock!**

### Possible Causes:

1. **Database Trigger** (Most Likely)
   - A trigger on `inventory_today` might delete menu_ingredients when stock = 0
   - Check Supabase for triggers:
     ```sql
     SELECT * FROM pg_trigger WHERE tgname LIKE '%menu%' OR tgname LIKE '%ingredient%';
     ```

2. **Row-Level Security (RLS) Policy**
   - Supabase RLS might be filtering out rows
   - Check: Supabase Dashboard → Database → menu_ingredients → RLS policies

3. **Frontend Filtering**
   - Frontend might be hiding ingredients with zero stock
   - Check React components that display menu ingredients

4. **Cascade Delete**
   - Foreign key with `ON DELETE CASCADE` from inventory tables
   - Check:
     ```sql
     SELECT
         tc.table_name,
         kcu.column_name,
         ccu.table_name AS foreign_table_name,
         ccu.column_name AS foreign_column_name,
         rc.delete_rule
     FROM information_schema.table_constraints AS tc
     JOIN information_schema.key_column_usage AS kcu
       ON tc.constraint_name = kcu.constraint_name
     JOIN information_schema.constraint_column_usage AS ccu
       ON ccu.constraint_name = tc.constraint_name
     JOIN information_schema.referential_constraints AS rc
       ON rc.constraint_name = tc.constraint_name
     WHERE tc.table_name = 'menu_ingredients' AND tc.constraint_type = 'FOREIGN KEY';
     ```

### Action Required:
**Ask user for specific example:**
- Which menu item?
- Which ingredient disappeared?
- When did it disappear (after stock reached zero)?
- Check `menu_ingredients` table directly for that ingredient

---

## ⚡ ISSUE 4: Data Fetching Issues [PERFORMANCE FIX NEEDED]

### Problem:
Slow API responses, especially for `/menu` endpoint

### Root Cause: N+1 Query Problem

The `get_menu()` endpoint has a **massive performance issue**:

```python
# For EACH menu item (lines 395-468):
for item in data:
    for ing in item["ingredients"]:
        # Query 1: inventory
        inv = postgrest_client.table("inventory").select(...).ilike("item_name", ing_name).execute()

        # Query 2: inventory_surplus
        surplus = postgrest_client.table("inventory_surplus").select(...).ilike("item_name", ing_name).execute()

        # Query 3: inventory_today
        today = postgrest_client.table("inventory_today").select(...).ilike("item_name", ing_name).execute()
```

**For 10 menu items with 5 ingredients each = 150 database queries!**

### Performance Impact:
- 10 menu items × 5 ingredients × 3 tables = 150 queries
- Each query ~20ms = 3000ms (3 seconds) total
- Blocks user interface during loading

### Fix Needed:
Batch all queries into 3 queries total instead of N×M×3:

```python
# Collect all unique ingredient names
all_ingredient_names = []
for item in data:
    for ing in item.get("ingredients", []):
        name = ing.get("ingredient_name")
        if name:
            all_ingredient_names.append(name)

# Remove duplicates
unique_names = list(set(all_ingredient_names))

# Single query for each table (3 queries total instead of 150!)
inv_all = postgrest_client.table("inventory").select("*").in_("item_name", unique_names).execute()
surplus_all = postgrest_client.table("inventory_surplus").select("*").in_("item_name", unique_names).execute()
today_all = postgrest_client.table("inventory_today").select("*").in_("item_name", unique_names).execute()

# Build lookup dictionary
stock_map = {}
for item in inv_all.data or []:
    name = item["item_name"].lower()
    stock_map.setdefault(name, 0)
    stock_map[name] += item.get("stock_quantity", 0)

# ... similar for surplus_all and today_all

# Then use stock_map to check availability (O(1) lookup instead of O(N) query)
for item in data:
    for ing in item["ingredients"]:
        name = ing.get("ingredient_name", "").lower()
        available = stock_map.get(name, 0)
```

This would reduce:
- 150 queries → 3 queries
- 3000ms → 60ms (50x faster!)

### Status:
**NOT YET IMPLEMENTED** - Requires refactoring `get_menu()` in menu.py:345-501

---

## Summary of Fixes

| Issue | Status | Action Required |
|-------|--------|----------------|
| Sales Auto-Deduct | ✅ **FIXED** | Restart backend |
| Session Expired | ⚠️ **CONFIG CHANGE** | Update Supabase JWT expiry to 8 hours |
| Ingredients Disappearing | 🔍 **INVESTIGATION** | Check database triggers/RLS |
| Data Fetching Slow | ⚠️ **FIX NEEDED** | Optimize menu.py with batch queries |

---

## Next Steps

1. **Immediate**: Restart backend to apply sales auto-deduct fix
2. **High Priority**: Increase Supabase JWT expiration to 8 hours
3. **Investigation**: Check for database triggers deleting menu_ingredients
4. **Performance**: Implement batch query optimization for `/menu` endpoint

---

## Files Modified

1. ✅ `backend/app/routes/Reports/Sales/salesimport.py`
   - Line 373: Changed `auto_deduct` default from `True` to `False`
   - Lines 440-455: Added logging for auto-deduction

2. 📝 `backend/CRITICAL_BUGS_ANALYSIS.md` - Created detailed analysis
3. 📝 `backend/FIXES_APPLIED.md` - This document
