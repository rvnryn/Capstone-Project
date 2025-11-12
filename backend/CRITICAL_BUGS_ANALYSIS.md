# CRITICAL BUGS ANALYSIS & FIXES

## Issues Reported by User:

1. **Inventory**: Menu ingredients disappearing when out of stock
2. **Sales Report**: Always auto-deducting from sales even without importing
3. **General**: Data fetching issues
4. **General**: Session always expiring

---

## ISSUE 1: Menu Ingredients Disappearing When Out of Stock

### Problem:
Looking at `menu.py` line 369-398, the `get_menu()` endpoint fetches `menu_ingredients` using:
```python
ing_res = (
    postgrest_client.table("menu_ingredients")
    .select("menu_id,ingredient_id,ingredient_name,quantity,measurements")
    .in_("menu_id", menu_ids)
    .execute()
)
```

**This query fetches ALL menu_ingredients regardless of stock status.**

### Root Cause:
**THERE IS NO BUG HERE** - ingredients should always be returned.

The actual issue might be:
1. **Frontend filtering** - The frontend might be hiding ingredients with `stock_quantity = 0`
2. **Database trigger** - There might be a trigger deleting menu_ingredients when stock reaches zero
3. **User confusion** - They might be confusing "Out of Stock" menu status with "missing ingredients"

### Verification Needed:
Check if there's:
- A database trigger on `inventory_today` that cascades to `menu_ingredients`
- Frontend code filtering out ingredients
- Row-Level Security (RLS) policies in Supabase affecting the query

### Fix Recommendation:
**IF ingredients are actually being deleted from database:**
Check Supabase for:
- Database triggers on `inventory`, `inventory_today`, `inventory_surplus`
- RLS policies on `menu_ingredients` table
- Cascade delete settings

---

## ISSUE 2: Sales Report Always Auto-Deducting Without Import

### Problem Location:
`salesimport.py` lines 421-432:

```python
# Automatically deduct inventory if enabled
if auto_deduct and sale_dates:
    deduction_results = []
    for sale_date in sale_dates:
        deduction_result = await auto_deduct_inventory_from_sales(sale_date)
        deduction_results.append({
            "sale_date": sale_date,
            "result": deduction_result
        })
```

### Root Causes:

#### Cause A: Default Parameter
Line 356:
```python
auto_deduct = data.get("auto_deduct", True)  # Default to True
```

**BUG**: Auto-deduction is TRUE by default! This means if the frontend doesn't send `auto_deduct: false`, it will ALWAYS deduct.

#### Cause B: Possible Scheduled Job/Hook
There might be:
1. A cron job calling `/import-sales` endpoint
2. A database trigger on `sales_report` INSERT
3. A Supabase webhook firing on sales data changes

### Fixes Required:

**Fix 1: Change Default to FALSE**
```python
# Line 356 - CHANGE THIS
auto_deduct = data.get("auto_deduct", False)  # Default to False - explicit opt-in
```

**Fix 2: Add Logging**
Add logging to track when deductions happen:
```python
if auto_deduct:
    logger.info(f"AUTO-DEDUCTION ENABLED for {len(sale_dates)} sale dates: {sale_dates}")
else:
    logger.info(f"AUTO-DEDUCTION DISABLED (skipping deduction)")
```

**Fix 3: Check for Scheduled Jobs**
Run:
```sql
-- Check Supabase for triggers
SELECT * FROM pg_trigger WHERE tgname LIKE '%sales%';

-- Check for Edge Functions/Webhooks
SELECT * FROM pg_cron.job WHERE jobname LIKE '%sales%';
```

---

## ISSUE 3: Data Fetching Issues

### Symptoms:
"Data fetching" is vague, but likely related to:
- Slow API responses
- Empty results
- Stale data
- CORS errors
- Network timeouts

### Possible Causes in menu.py:

#### Problem A: N+1 Query Problem (Lines 403-465)
The `get_menu()` endpoint loops through each ingredient and makes 3 separate queries:
```python
for ing in item["ingredients"]:
    ing_name = ing.get("ingredient_name") or ing.get("name")

    # Query 1: inventory
    inv = postgrest_client.table("inventory").select(...).ilike("item_name", ing_name).execute()

    # Query 2: inventory_surplus
    surplus = postgrest_client.table("inventory_surplus").select(...).ilike("item_name", ing_name).execute()

    # Query 3: inventory_today
    today = postgrest_client.table("inventory_today").select(...).ilike("item_name", ing_name).execute()
```

**For 10 menu items with 5 ingredients each = 150 database queries!**

#### Problem B: Thread Pool Usage
Line 501:
```python
return await run_in_threadpool(sync_get_menu)
```

This runs the entire sync function in a thread pool, but INSIDE it still makes async-style calls to `postgrest_client`.

### Fixes Required:

**Fix 1: Batch Queries**
Instead of querying per ingredient, collect all ingredient names and query once:
```python
all_ingredient_names = list(set([ing.get("ingredient_name") for item in data for ing in item.get("ingredients", [])]))

# Single query for all ingredients
inv_all = postgrest_client.table("inventory").select("*").in_("item_name", all_ingredient_names).execute()
surplus_all = postgrest_client.table("inventory_surplus").select("*").in_("item_name", all_ingredient_names).execute()
today_all = postgrest_client.table("inventory_today").select("*").in_("item_name", all_ingredient_names).execute()

# Build lookup dictionaries
inv_map = {}
for item in inv_all.data or []:
    inv_map.setdefault(item["item_name"].lower(), []).append(item)
```

**Fix 2: Add Caching**
Add Redis/in-memory caching for inventory data with 5-minute TTL

**Fix 3: Add Response Time Logging**
```python
import time
start = time.time()
result = sync_get_menu()
logger.info(f"get_menu took {time.time() - start:.2f}s")
return result
```

---

## ISSUE 4: Session Always Expiring

### Possible Causes:

#### Cause A: JWT Token Expiration Too Short
Check `auth_routes.py` for token expiration settings

#### Cause B: Frontend Not Refreshing Tokens
Frontend might not be:
1. Storing tokens properly (localStorage vs sessionStorage)
2. Sending Authorization header correctly
3. Refreshing tokens before expiry
4. Handling 401 responses

#### Cause C: CORS/Cookie Issues
If using cookies for sessions:
- `SameSite` attribute blocking cookies
- CORS not allowing credentials
- Cookie domain mismatch

#### Cause D: Server Restarting
If backend restarts frequently, in-memory sessions are lost

### Verification Steps:

1. **Check token expiration:**
```python
# In auth_routes.py, look for:
expires_delta = timedelta(minutes=???)
```

2. **Check frontend token storage:**
```javascript
// Should be in localStorage, not sessionStorage
localStorage.getItem('access_token')
```

3. **Check if tokens are being sent:**
```javascript
// Headers should include:
{
  'Authorization': `Bearer ${token}`
}
```

4. **Check CORS settings:**
```python
# In main.py
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,  # Must be True for cookies
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Fixes Required:

**Fix 1: Increase Token Expiration**
Change from 30 minutes to 8 hours:
```python
expires_delta = timedelta(hours=8)
```

**Fix 2: Implement Token Refresh**
Add endpoint:
```python
@router.post("/refresh")
async def refresh_token(refresh_token: str):
    # Validate refresh token
    # Issue new access token
    # Return new token
```

**Fix 3: Add Token Expiry Check in Frontend**
```javascript
// Check if token expires in next 5 minutes
if (tokenExpiresAt - Date.now() < 5 * 60 * 1000) {
    await refreshToken();
}
```

---

## PRIORITY FIXES

### HIGH PRIORITY (Fix Immediately):

1. **Sales Auto-Deduct Default**: Change `auto_deduct` default from `True` to `False`
2. **Session Expiration**: Increase JWT token expiration
3. **N+1 Query Problem**: Batch inventory queries in `get_menu()`

### MEDIUM PRIORITY (Fix This Week):

1. **Check for scheduled jobs/triggers** causing unwanted sales deductions
2. **Add caching** for inventory data
3. **Implement token refresh** mechanism

### LOW PRIORITY (Investigate):

1. **Menu ingredients disappearing** - Verify if this is actually happening or user confusion
2. **Database triggers** - Check Supabase for any automatic triggers

---

## TESTING CHECKLIST

After fixes:
- [ ] Test sales import WITHOUT auto_deduct
- [ ] Test sales import WITH auto_deduct explicitly enabled
- [ ] Test menu GET endpoint performance (should be <500ms)
- [ ] Test session persistence across page refreshes
- [ ] Test token expiration handling
- [ ] Verify ingredients always show even when out of stock
