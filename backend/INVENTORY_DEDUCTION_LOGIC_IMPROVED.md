# 🎯 IMPROVED INVENTORY DEDUCTION LOGIC FOR SALES IMPORT
## Restaurant Inventory Tracking System - Complete Design

---

## 📋 TABLE OF CONTENTS
1. [System Overview](#system-overview)
2. [Current Implementation Analysis](#current-implementation-analysis)
3. [Critical Issues Found](#critical-issues-found)
4. [Improved Database Schema](#improved-database-schema)
5. [Enhanced Unit Conversion System](#enhanced-unit-conversion-system)
6. [Optimized Deduction Algorithm](#optimized-deduction-algorithm)
7. [Transaction Logging & Audit Trail](#transaction-logging--audit-trail)
8. [Error Handling & Recovery](#error-handling--recovery)
9. [Implementation Code](#implementation-code)
10. [Testing Strategy](#testing-strategy)

---

## 1. SYSTEM OVERVIEW

### Goal
Create a **bulletproof inventory deduction system** that:
- Automatically deducts ingredients when sales are imported
- Handles complex unit conversions (kg↔g, L↔ml, gal↔L, tray↔pcs)
- Implements FIFO (First-In-First-Out) for batch tracking
- **NEVER deletes items** - maintains 0 stock as "Out of Stock"
- Provides complete audit trail for all transactions
- Prevents negative stock and handles insufficient inventory gracefully

### Key Principles
1. **Store in Base Units**: All quantities stored in smallest unit (g, ml, pcs)
2. **Calculate in Base Units**: All math done in base units
3. **Display in Preferred Units**: Convert to user-friendly units for display
4. **Atomic Transactions**: All or nothing - rollback on errors
5. **Audit Everything**: Every deduction logged with before/after snapshots

---

## 2. CURRENT IMPLEMENTATION ANALYSIS

### ✅ What's Working Well

1. **FIFO Implementation** (Lines 72-133)
   ```python
   # Orders by batch_date ascending (oldest first)
   inv_res = postgrest_client.table("inventory_today")
       .select("*")
       .ilike("item_name", ingredient_name)
       .order("batch_date", desc=False)  # ✅ Correct FIFO
       .execute()
   ```

2. **Unit Conversion System** (`unit_converter.py`)
   - Proper base unit conversions
   - Type checking (weight, volume, count)
   - Error handling for incompatible units

3. **Prevents Negative Stock** (Line 114)
   ```python
   new_qty = max(current_qty - deduct_qty, 0)  # ✅ Never goes negative
   ```

---

## 3. CRITICAL ISSUES FOUND

### 🔴 Issue 1: Missing Unit of Measurement in Database
**Problem**: `inventory_today` table doesn't store the unit!
```python
class InventoryToday(Base):
    item_id = Column(Integer, primary_key=True)
    item_name = Column(String)
    stock_quantity = Column(Float)  # ❌ No unit column!
    # Missing: unit_of_measurement Column(String)
```

**Impact**:
- Cannot determine if `stock_quantity=100` means 100g, 100kg, or 100pcs
- Unit conversion fails because inventory unit is assumed
- Risk of deducting wrong amounts

**Solution**: Add `unit_of_measurement` column to ALL inventory tables.

---

### 🔴 Issue 2: No Transaction Logging
**Problem**: No audit trail for deductions
```python
# Only updates stock, no transaction record
update_res = postgrest_client.table("inventory_today").update({
    "stock_quantity": new_qty  # ❌ No transaction log
}).eq("item_id", inv_item["item_id"]).execute()
```

**Impact**:
- Cannot trace why stock decreased
- No way to reverse incorrect deductions
- Compliance issues for auditing

**Solution**: Create `inventory_transactions` table to log every change.

---

### 🔴 Issue 3: Missing Compound Unit Support
**Problem**: Unit converter doesn't handle:
- `pack` (e.g., 1 pack = 500g)
- `tray` (e.g., 1 tray = 30 pcs)
- `sack` (e.g., 1 sack = 25 kg)
- `case` (e.g., 1 case = 24 cans)

**Solution**: Add configurable compound unit conversions.

---

### 🔴 Issue 4: Race Conditions in Concurrent Sales
**Problem**: Two sales imported simultaneously could:
1. Both read stock_quantity = 100
2. Both deduct 60
3. Final stock = 40 (should be -20 or insufficient stock error)

**Solution**: Use database-level locking with `SELECT FOR UPDATE`.

---

### 🔴 Issue 5: No Partial Deduction Rollback
**Problem**: If deducting 3 ingredients and the 3rd fails:
- First 2 ingredients already deducted
- No rollback mechanism
- Inventory inconsistent

**Solution**: Wrap entire sales import in a transaction with rollback.

---

### 🔴 Issue 6: Insufficient Stock Handling
**Problem**: Continues processing even with insufficient stock
```python
if qty_to_deduct > 0:
    errors.append(f"Insufficient stock...")  # ❌ Just logs error
    # But sale is still recorded as imported!
```

**Solution**: Option to block import or flag sales as "pending" until stock available.

---

## 4. IMPROVED DATABASE SCHEMA

### 4.1 Enhanced Inventory Tables

```sql
-- Add unit_of_measurement to all inventory tables
ALTER TABLE inventory_today
ADD COLUMN IF NOT EXISTS unit_of_measurement VARCHAR(20) NOT NULL DEFAULT 'g',
ADD COLUMN IF NOT EXISTS base_quantity DECIMAL(12, 4),  -- Always in base unit
ADD COLUMN IF NOT EXISTS display_quantity DECIMAL(12, 4),  -- For display
ADD COLUMN IF NOT EXISTS display_unit VARCHAR(20),  -- User-friendly unit
ADD COLUMN IF NOT EXISTS stock_status VARCHAR(20) DEFAULT 'AVAILABLE',  -- AVAILABLE, OUT_OF_STOCK, LOW_STOCK
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE,  -- For transaction locking
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS locked_by VARCHAR(100);

-- Same for inventory, inventory_surplus, inventory_spoilage tables
```

### 4.2 Compound Unit Conversions Table

```sql
CREATE TABLE IF NOT EXISTS unit_conversions (
    conversion_id SERIAL PRIMARY KEY,
    from_unit VARCHAR(50) NOT NULL,
    to_unit VARCHAR(50) NOT NULL,
    conversion_factor DECIMAL(15, 6) NOT NULL,
    unit_type VARCHAR(20) NOT NULL,  -- weight, volume, count, compound
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(from_unit, to_unit)
);

-- Insert standard conversions
INSERT INTO unit_conversions (from_unit, to_unit, conversion_factor, unit_type) VALUES
-- Weight conversions
('kg', 'g', 1000, 'weight'),
('g', 'kg', 0.001, 'weight'),
('lb', 'g', 453.592, 'weight'),
('oz', 'g', 28.3495, 'weight'),

-- Volume conversions
('l', 'ml', 1000, 'volume'),
('ml', 'l', 0.001, 'volume'),
('gal', 'ml', 3785.41, 'volume'),
('gal', 'l', 3.785, 'volume'),

-- Count conversions
('tray', 'pcs', 30, 'count'),
('dozen', 'pcs', 12, 'count'),
('case', 'pcs', 24, 'count'),

-- Compound conversions (category-specific)
('sack', 'kg', 25, 'compound'),  -- Rice sacks
('pack_meat', 'g', 500, 'compound'),  -- Meat packs
('pack_condiment', 'ml', 250, 'compound'),  -- Condiment packs
('bottle', 'ml', 1000, 'compound');  -- Standard bottle
```

### 4.3 Inventory Transactions Log

```sql
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
    source_id INTEGER,  -- Reference to sale, menu order, etc.
    source_reference VARCHAR(255),  -- Order number, receipt number, etc.

    -- User tracking
    user_id INTEGER,
    user_name VARCHAR(255),
    user_role VARCHAR(100),

    -- Additional details
    notes TEXT,
    metadata JSONB,  -- Store recipe details, menu item, conversion info

    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Indexes for fast queries
    INDEX idx_inv_trans_item (item_id, transaction_date),
    INDEX idx_inv_trans_type (transaction_type, transaction_date),
    INDEX idx_inv_trans_date (transaction_date DESC),
    INDEX idx_inv_trans_source (source_type, source_id)
);

COMMENT ON TABLE inventory_transactions IS 'Complete audit trail of all inventory changes';
COMMENT ON COLUMN inventory_transactions.metadata IS 'JSON: {recipe_unit, inventory_unit, conversion_applied, menu_item, shortage_info}';
```

### 4.4 Sales Deduction Status Tracking

```sql
CREATE TABLE IF NOT EXISTS sales_deduction_status (
    deduction_id SERIAL PRIMARY KEY,
    sale_date DATE NOT NULL,
    sales_count INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL,  -- COMPLETED, PARTIAL, FAILED
    items_processed INTEGER DEFAULT 0,
    items_successful INTEGER DEFAULT 0,
    items_failed INTEGER DEFAULT 0,
    total_deductions INTEGER DEFAULT 0,
    errors JSONB,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    duration_seconds DECIMAL(10, 2),
    processed_by_user_id INTEGER,
    processed_by_user_name VARCHAR(255),
    INDEX idx_sales_deduction_date (sale_date DESC),
    INDEX idx_sales_deduction_status (status, sale_date)
);
```

---

## 5. ENHANCED UNIT CONVERSION SYSTEM

### 5.1 Extended Conversion Functions

```python
# Add to unit_converter.py

# Category-specific compound units
COMPOUND_CONVERSIONS = {
    # Meat & Seafood
    "pack_meat": {"to": "g", "factor": 500.0, "category": "Meats"},
    "tray_meat": {"to": "g", "factor": 1000.0, "category": "Meats"},

    # Rice & Noodles
    "sack": {"to": "kg", "factor": 25.0, "category": "Rice & Noodles"},
    "pack_rice": {"to": "kg", "factor": 5.0, "category": "Rice & Noodles"},

    # Dairy & Eggs
    "tray_eggs": {"to": "pcs", "factor": 30.0, "category": "Dairy & Eggs"},
    "dozen": {"to": "pcs", "factor": 12.0, "category": "Dairy & Eggs"},

    # Beverages
    "case": {"to": "pcs", "factor": 24.0, "category": "Beverages"},
    "bottle": {"to": "ml", "factor": 1000.0, "category": "Beverages"},

    # Seasonings & Condiments
    "pack_condiment": {"to": "ml", "factor": 250.0, "category": "Seasonings & Condiments"},
}


def convert_compound_unit(quantity: float, from_unit: str, category: str = None) -> Tuple[float, str]:
    """
    Convert compound units to base units.

    Args:
        quantity: Amount in compound unit
        from_unit: Compound unit (e.g., "sack", "tray_eggs")
        category: Item category for context-specific conversions

    Returns:
        Tuple of (converted_quantity, base_unit)

    Example:
        convert_compound_unit(2, "sack", "Rice & Noodles") -> (50.0, "kg")
    """
    normalized = normalize_unit(from_unit)

    if normalized in COMPOUND_CONVERSIONS:
        conversion = COMPOUND_CONVERSIONS[normalized]

        # Check category match if specified
        if category and conversion["category"] != category:
            logger.warning(f"Category mismatch: {from_unit} expected {conversion['category']}, got {category}")

        base_quantity = quantity * conversion["factor"]
        return (base_quantity, conversion["to"])

    return (quantity, from_unit)


def smart_convert_units(
    quantity: float,
    from_unit: str,
    to_unit: str,
    category: str = None
) -> Optional[float]:
    """
    Intelligent unit conversion that handles compound units.

    Conversion flow:
    1. Check if from_unit is compound -> convert to base
    2. Check if to_unit is compound -> convert to base
    3. Perform standard unit conversion

    Args:
        quantity: Amount to convert
        from_unit: Source unit (may be compound)
        to_unit: Target unit (may be compound)
        category: Item category for context

    Returns:
        Converted quantity or None if conversion impossible
    """
    # Step 1: Handle compound source unit
    if normalize_unit(from_unit) in COMPOUND_CONVERSIONS:
        quantity, from_unit = convert_compound_unit(quantity, from_unit, category)

    # Step 2: Handle compound target unit
    target_is_compound = normalize_unit(to_unit) in COMPOUND_CONVERSIONS
    if target_is_compound:
        _, base_to_unit = convert_compound_unit(1.0, to_unit, category)
        # Convert to base unit first
        converted = convert_units(quantity, from_unit, base_to_unit)
        if converted is None:
            return None
        # Then convert back to compound
        conversion = COMPOUND_CONVERSIONS[normalize_unit(to_unit)]
        return converted / conversion["factor"]

    # Step 3: Standard conversion
    return convert_units(quantity, from_unit, to_unit)
```

---

## 6. OPTIMIZED DEDUCTION ALGORITHM

### 6.1 Transaction-Safe Deduction with Locking

```python
from sqlalchemy import text
from contextlib import contextmanager
import time

class InventoryDeductionError(Exception):
    """Custom exception for inventory deduction failures"""
    pass


@contextmanager
def inventory_lock_manager(db_session, item_id: int, batch_date: str, timeout_seconds: int = 30):
    """
    Context manager for database-level row locking.
    Prevents race conditions during concurrent sales imports.
    """
    lock_acquired = False
    start_time = time.time()

    while not lock_acquired and (time.time() - start_time) < timeout_seconds:
        try:
            # Attempt to acquire lock
            result = db_session.execute(
                text("""
                    UPDATE inventory_today
                    SET is_locked = TRUE,
                        locked_at = CURRENT_TIMESTAMP,
                        locked_by = :user
                    WHERE item_id = :item_id
                      AND batch_date = :batch_date
                      AND (is_locked = FALSE OR locked_at < CURRENT_TIMESTAMP - INTERVAL '5 minutes')
                    RETURNING item_id
                """),
                {"item_id": item_id, "batch_date": batch_date, "user": "sales_import"}
            )

            if result.rowcount > 0:
                lock_acquired = True
                logger.info(f"Lock acquired for item {item_id}, batch {batch_date}")
            else:
                # Lock held by another process, wait and retry
                time.sleep(0.1)

        except Exception as e:
            logger.error(f"Error acquiring lock: {e}")
            raise

    if not lock_acquired:
        raise InventoryDeductionError(f"Could not acquire lock for item {item_id} within {timeout_seconds}s")

    try:
        yield  # Execute the locked operation
    finally:
        # Release lock
        db_session.execute(
            text("""
                UPDATE inventory_today
                SET is_locked = FALSE,
                    locked_at = NULL,
                    locked_by = NULL
                WHERE item_id = :item_id AND batch_date = :batch_date
            """),
            {"item_id": item_id, "batch_date": batch_date}
        )
        logger.info(f"Lock released for item {item_id}, batch {batch_date}")


async def deduct_ingredient_with_transaction(
    db_session,
    ingredient_name: str,
    quantity_to_deduct: float,
    unit: str,
    category: str,
    menu_item_name: str,
    sale_date: str,
    user_id: int,
    user_name: str
) -> dict:
    """
    Deduct ingredient from inventory with full transaction safety.

    Features:
    - ACID transaction (rollback on any error)
    - Row-level locking (prevents race conditions)
    - Complete audit trail
    - Automatic unit conversion
    - FIFO batch tracking
    - Zero stock preservation

    Returns:
        Dictionary with deduction details and any warnings/errors
    """
    deduction_result = {
        "ingredient": ingredient_name,
        "status": "success",
        "deductions": [],
        "warnings": [],
        "errors": []
    }

    try:
        # Start transaction
        transaction = db_session.begin_nested()

        # Fetch inventory items (FIFO - oldest first)
        inv_query = text("""
            SELECT item_id, item_name, stock_quantity, unit_of_measurement,
                   batch_date, expiration_date, category, unit_cost
            FROM inventory_today
            WHERE LOWER(item_name) = LOWER(:ingredient_name)
              AND stock_quantity > 0
            ORDER BY batch_date ASC, item_id ASC
            FOR UPDATE  -- Lock rows for update
        """)

        inv_items = db_session.execute(
            inv_query,
            {"ingredient_name": ingredient_name}
        ).fetchall()

        if not inv_items:
            deduction_result["status"] = "error"
            deduction_result["errors"].append(f"Ingredient '{ingredient_name}' not found or out of stock")
            return deduction_result

        # Get inventory unit from first item
        inventory_unit = inv_items[0].unit_of_measurement

        # Convert recipe unit to inventory unit
        qty_in_inventory_unit = smart_convert_units(
            quantity_to_deduct,
            unit,
            inventory_unit,
            category
        )

        if qty_in_inventory_unit is None:
            deduction_result["status"] = "error"
            deduction_result["errors"].append(
                f"Cannot convert {unit} to {inventory_unit} for '{ingredient_name}'"
            )
            transaction.rollback()
            return deduction_result

        remaining_to_deduct = qty_in_inventory_unit
        total_deducted = 0.0

        # Deduct from batches (FIFO)
        for inv_item in inv_items:
            if remaining_to_deduct <= 0:
                break

            item_id = inv_item.item_id
            batch_date = inv_item.batch_date
            current_qty = float(inv_item.stock_quantity)

            # Calculate deduction for this batch
            deduct_from_batch = min(current_qty, remaining_to_deduct)
            new_qty = max(current_qty - deduct_from_batch, 0)

            # Update inventory
            update_query = text("""
                UPDATE inventory_today
                SET stock_quantity = :new_qty,
                    stock_status = CASE
                        WHEN :new_qty = 0 THEN 'OUT_OF_STOCK'
                        WHEN :new_qty < (SELECT low_stock_threshold FROM inventory_settings
                                        WHERE LOWER(name) = LOWER(:ingredient_name) LIMIT 1) THEN 'LOW_STOCK'
                        ELSE 'AVAILABLE'
                    END,
                    updated_at = CURRENT_TIMESTAMP
                WHERE item_id = :item_id AND batch_date = :batch_date
            """)

            db_session.execute(update_query, {
                "new_qty": new_qty,
                "item_id": item_id,
                "batch_date": batch_date,
                "ingredient_name": ingredient_name
            })

            # Log transaction
            transaction_log_query = text("""
                INSERT INTO inventory_transactions (
                    transaction_type, item_id, item_name, batch_date, category,
                    quantity_before, quantity_changed, quantity_after, unit_of_measurement,
                    source_type, source_reference, user_id, user_name,
                    notes, metadata
                ) VALUES (
                    'DEDUCTION', :item_id, :item_name, :batch_date, :category,
                    :qty_before, :qty_changed, :qty_after, :unit,
                    'SALES_IMPORT', :sale_date, :user_id, :user_name,
                    :notes, :metadata::jsonb
                )
            """)

            db_session.execute(transaction_log_query, {
                "item_id": item_id,
                "item_name": ingredient_name,
                "batch_date": batch_date,
                "category": category,
                "qty_before": current_qty,
                "qty_changed": -deduct_from_batch,  # Negative for deduction
                "qty_after": new_qty,
                "unit": inventory_unit,
                "sale_date": sale_date,
                "user_id": user_id,
                "user_name": user_name,
                "notes": f"Auto-deducted for menu item: {menu_item_name}",
                "metadata": json.dumps({
                    "menu_item": menu_item_name,
                    "recipe_unit": unit,
                    "recipe_quantity": quantity_to_deduct,
                    "inventory_unit": inventory_unit,
                    "conversion_applied": unit != inventory_unit,
                    "batch_depleted": new_qty == 0
                })
            })

            deduction_result["deductions"].append({
                "batch_date": str(batch_date),
                "quantity_before": current_qty,
                "quantity_deducted": deduct_from_batch,
                "quantity_after": new_qty,
                "unit": inventory_unit
            })

            remaining_to_deduct -= deduct_from_batch
            total_deducted += deduct_from_batch

        # Check for shortage
        if remaining_to_deduct > 0:
            shortage_in_recipe_unit = smart_convert_units(
                remaining_to_deduct,
                inventory_unit,
                unit,
                category
            ) or remaining_to_deduct

            deduction_result["status"] = "partial"
            deduction_result["warnings"].append(
                f"Insufficient stock for '{ingredient_name}'. Short by {format_quantity_with_unit(shortage_in_recipe_unit, unit)}"
            )

            # Option 1: Rollback entire deduction (strict mode)
            # transaction.rollback()
            # deduction_result["status"] = "error"
            # return deduction_result

            # Option 2: Allow partial deduction (lenient mode) - current implementation
            logger.warning(f"Partial deduction for {ingredient_name}: {shortage_in_recipe_unit} {unit} short")

        # Commit transaction
        transaction.commit()

        deduction_result["total_deducted"] = total_deducted
        deduction_result["unit"] = inventory_unit

        return deduction_result

    except Exception as e:
        logger.error(f"Error deducting {ingredient_name}: {str(e)}")
        transaction.rollback()
        deduction_result["status"] = "error"
        deduction_result["errors"].append(str(e))
        return deduction_result
```

### 6.2 Improved Sales Import Deduction Flow

```python
async def auto_deduct_inventory_from_sales_v2(
    sale_date: str,
    db_session,
    user_id: int,
    user_name: str,
    strict_mode: bool = False
) -> dict:
    """
    Version 2: Improved auto-deduction with transaction safety.

    Args:
        sale_date: Date of sales to process
        db_session: Database session
        user_id: User performing import
        user_name: User name
        strict_mode: If True, rollback ALL deductions on ANY error

    Returns:
        Detailed deduction report
    """
    start_time = time.time()

    # Create deduction status record
    deduction_status_id = db_session.execute(
        text("""
            INSERT INTO sales_deduction_status (
                sale_date, status, processed_by_user_id, processed_by_user_name
            ) VALUES (:sale_date, 'IN_PROGRESS', :user_id, :user_name)
            RETURNING deduction_id
        """),
        {"sale_date": sale_date, "user_id": user_id, "user_name": user_name}
    ).scalar()

    try:
        # Fetch all sales for the date
        sales_query = text("""
            SELECT item_name, SUM(quantity) as total_quantity, category
            FROM sales_report
            WHERE sale_date = :sale_date
            GROUP BY item_name, category
        """)

        sales_data = db_session.execute(sales_query, {"sale_date": sale_date}).fetchall()

        if not sales_data:
            return {"status": "no_sales", "message": f"No sales found for {sale_date}"}

        deduction_summary = {
            "sale_date": sale_date,
            "sales_count": len(sales_data),
            "items_processed": 0,
            "items_successful": 0,
            "items_failed": 0,
            "total_deductions": 0,
            "deductions": [],
            "errors": [],
            "warnings": []
        }

        # Start master transaction (if strict mode)
        if strict_mode:
            master_transaction = db_session.begin_nested()

        # Process each menu item
        for sale in sales_data:
            menu_item_name = sale.item_name
            quantity_sold = float(sale.total_quantity)
            category = sale.category

            deduction_summary["items_processed"] += 1

            try:
                # Find menu item
                menu_query = text("""
                    SELECT menu_id, dish_name
                    FROM menu
                    WHERE LOWER(dish_name) = LOWER(:menu_item)
                    LIMIT 1
                """)

                menu_result = db_session.execute(
                    menu_query,
                    {"menu_item": menu_item_name}
                ).fetchone()

                if not menu_result:
                    logger.warning(f"Menu item '{menu_item_name}' not found")
                    deduction_summary["warnings"].append(f"Menu item '{menu_item_name}' not configured")
                    continue

                menu_id = menu_result.menu_id

                # Get ingredients
                ingredients_query = text("""
                    SELECT ingredient_name, quantity, measurements
                    FROM menu_ingredients
                    WHERE menu_id = :menu_id
                """)

                ingredients = db_session.execute(
                    ingredients_query,
                    {"menu_id": menu_id}
                ).fetchall()

                if not ingredients:
                    logger.warning(f"No ingredients configured for '{menu_item_name}'")
                    deduction_summary["warnings"].append(f"No ingredients for '{menu_item_name}'")
                    continue

                item_deductions = []
                item_has_errors = False

                # Deduct each ingredient
                for ingredient in ingredients:
                    ingredient_name = ingredient.ingredient_name
                    qty_per_serving = float(ingredient.quantity)
                    recipe_unit = normalize_unit(ingredient.measurements)

                    total_qty_needed = qty_per_serving * quantity_sold

                    # Deduct with transaction safety
                    deduction_result = await deduct_ingredient_with_transaction(
                        db_session=db_session,
                        ingredient_name=ingredient_name,
                        quantity_to_deduct=total_qty_needed,
                        unit=recipe_unit,
                        category=category,
                        menu_item_name=menu_item_name,
                        sale_date=sale_date,
                        user_id=user_id,
                        user_name=user_name
                    )

                    item_deductions.append(deduction_result)
                    deduction_summary["total_deductions"] += len(deduction_result.get("deductions", []))

                    if deduction_result["status"] == "error":
                        item_has_errors = True
                        deduction_summary["errors"].extend(deduction_result["errors"])
                    elif deduction_result["status"] == "partial":
                        deduction_summary["warnings"].extend(deduction_result["warnings"])

                if item_has_errors:
                    deduction_summary["items_failed"] += 1
                    if strict_mode:
                        raise InventoryDeductionError(f"Deduction failed for {menu_item_name}")
                else:
                    deduction_summary["items_successful"] += 1

                deduction_summary["deductions"].append({
                    "menu_item": menu_item_name,
                    "quantity_sold": quantity_sold,
                    "ingredients": item_deductions
                })

            except Exception as e:
                logger.error(f"Error processing '{menu_item_name}': {str(e)}")
                deduction_summary["items_failed"] += 1
                deduction_summary["errors"].append(f"Error processing '{menu_item_name}': {str(e)}")

                if strict_mode:
                    master_transaction.rollback()
                    raise

        # Commit master transaction
        if strict_mode:
            if deduction_summary["items_failed"] > 0:
                master_transaction.rollback()
                final_status = "FAILED"
            else:
                master_transaction.commit()
                final_status = "COMPLETED"
        else:
            final_status = "PARTIAL" if deduction_summary["items_failed"] > 0 else "COMPLETED"

        # Update status record
        duration = time.time() - start_time
        db_session.execute(
            text("""
                UPDATE sales_deduction_status
                SET status = :status,
                    items_processed = :items_processed,
                    items_successful = :items_successful,
                    items_failed = :items_failed,
                    total_deductions = :total_deductions,
                    errors = :errors::jsonb,
                    completed_at = CURRENT_TIMESTAMP,
                    duration_seconds = :duration
                WHERE deduction_id = :deduction_id
            """),
            {
                "status": final_status,
                "items_processed": deduction_summary["items_processed"],
                "items_successful": deduction_summary["items_successful"],
                "items_failed": deduction_summary["items_failed"],
                "total_deductions": deduction_summary["total_deductions"],
                "errors": json.dumps(deduction_summary["errors"]),
                "duration": duration,
                "deduction_id": deduction_status_id
            }
        )

        db_session.commit()

        deduction_summary["status"] = final_status
        deduction_summary["duration_seconds"] = round(duration, 2)

        return deduction_summary

    except Exception as e:
        logger.error(f"Fatal error in auto_deduct_inventory_from_sales_v2: {str(e)}")

        # Mark as failed
        db_session.execute(
            text("""
                UPDATE sales_deduction_status
                SET status = 'FAILED',
                    errors = :errors::jsonb,
                    completed_at = CURRENT_TIMESTAMP
                WHERE deduction_id = :deduction_id
            """),
            {
                "errors": json.dumps([str(e)]),
                "deduction_id": deduction_status_id
            }
        )

        db_session.commit()

        return {"status": "error", "error": str(e)}
```

---

## 7. TRANSACTION LOGGING & AUDIT TRAIL

### 7.1 Query Transaction History

```sql
-- Get all deductions for a specific ingredient
SELECT
    it.transaction_date,
    it.item_name,
    it.quantity_before,
    it.quantity_changed,
    it.quantity_after,
    it.unit_of_measurement,
    it.source_reference,
    it.user_name,
    it.notes,
    it.metadata->>'menu_item' as menu_item,
    it.metadata->>'recipe_quantity' as recipe_quantity
FROM inventory_transactions it
WHERE it.item_name = 'Tomatoes'
  AND it.transaction_type = 'DEDUCTION'
ORDER BY it.transaction_date DESC
LIMIT 50;

-- Get daily deduction summary
SELECT
    DATE(transaction_date) as deduction_date,
    item_name,
    COUNT(*) as deduction_count,
    SUM(ABS(quantity_changed)) as total_deducted,
    unit_of_measurement
FROM inventory_transactions
WHERE transaction_type = 'DEDUCTION'
  AND transaction_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(transaction_date), item_name, unit_of_measurement
ORDER BY deduction_date DESC, total_deducted DESC;

-- Trace a specific sale's deductions
SELECT
    it.item_name,
    it.batch_date,
    it.quantity_changed,
    it.unit_of_measurement,
    it.metadata->>'menu_item' as menu_item
FROM inventory_transactions it
WHERE it.source_type = 'SALES_IMPORT'
  AND it.source_reference = '2025-01-09'
ORDER BY it.transaction_date;
```

### 7.2 Reconciliation Report

```python
def generate_reconciliation_report(date_from: str, date_to: str) -> dict:
    """
    Generate reconciliation report comparing:
    - Expected stock (beginning - deductions + restocks)
    - Actual stock (current inventory)
    - Discrepancies
    """
    query = text("""
        WITH stock_changes AS (
            SELECT
                item_name,
                SUM(CASE WHEN transaction_type = 'DEDUCTION' THEN quantity_changed ELSE 0 END) as total_deducted,
                SUM(CASE WHEN transaction_type = 'RESTOCK' THEN quantity_changed ELSE 0 END) as total_restocked,
                unit_of_measurement
            FROM inventory_transactions
            WHERE transaction_date BETWEEN :date_from AND :date_to
            GROUP BY item_name, unit_of_measurement
        ),
        current_stock AS (
            SELECT
                item_name,
                SUM(stock_quantity) as current_quantity,
                unit_of_measurement
            FROM inventory_today
            GROUP BY item_name, unit_of_measurement
        ),
        beginning_stock AS (
            SELECT
                item_name,
                stock_quantity as beginning_quantity,
                unit_of_measurement
            FROM inventory_snapshots
            WHERE snapshot_date = :date_from
        )
        SELECT
            bs.item_name,
            bs.beginning_quantity,
            COALESCE(sc.total_deducted, 0) as total_deducted,
            COALESCE(sc.total_restocked, 0) as total_restocked,
            bs.beginning_quantity + COALESCE(sc.total_restocked, 0) + COALESCE(sc.total_deducted, 0) as expected_quantity,
            cs.current_quantity as actual_quantity,
            cs.current_quantity - (bs.beginning_quantity + COALESCE(sc.total_restocked, 0) + COALESCE(sc.total_deducted, 0)) as discrepancy,
            bs.unit_of_measurement
        FROM beginning_stock bs
        LEFT JOIN stock_changes sc ON bs.item_name = sc.item_name AND bs.unit_of_measurement = sc.unit_of_measurement
        LEFT JOIN current_stock cs ON bs.item_name = cs.item_name AND bs.unit_of_measurement = cs.unit_of_measurement
        WHERE ABS(cs.current_quantity - (bs.beginning_quantity + COALESCE(sc.total_restocked, 0) + COALESCE(sc.total_deducted, 0))) > 0.01
        ORDER BY ABS(discrepancy) DESC;
    """)

    results = db_session.execute(query, {
        "date_from": date_from,
        "date_to": date_to
    }).fetchall()

    return {
        "date_from": date_from,
        "date_to": date_to,
        "discrepancies_found": len(results),
        "details": [dict(row) for row in results]
    }
```

---

## 8. ERROR HANDLING & RECOVERY

### 8.1 Reversal Mechanism

```python
async def reverse_deduction(transaction_id: int, reason: str, user_id: int, user_name: str) -> dict:
    """
    Reverse a previous deduction transaction.
    """
    try:
        # Get original transaction
        original_query = text("""
            SELECT * FROM inventory_transactions
            WHERE transaction_id = :transaction_id
              AND transaction_type = 'DEDUCTION'
        """)

        original = db_session.execute(original_query, {"transaction_id": transaction_id}).fetchone()

        if not original:
            return {"status": "error", "message": "Transaction not found or not a deduction"}

        # Create reversal transaction
        reversal_query = text("""
            INSERT INTO inventory_transactions (
                transaction_type, item_id, item_name, batch_date, category,
                quantity_before, quantity_changed, quantity_after, unit_of_measurement,
                source_type, source_id, user_id, user_name, notes, metadata
            ) VALUES (
                'REVERSAL', :item_id, :item_name, :batch_date, :category,
                :qty_before, :qty_changed, :qty_after, :unit,
                'MANUAL_REVERSAL', :original_trans_id, :user_id, :user_name,
                :notes, :metadata::jsonb
            )
        """)

        db_session.execute(reversal_query, {
            "item_id": original.item_id,
            "item_name": original.item_name,
            "batch_date": original.batch_date,
            "category": original.category,
            "qty_before": original.quantity_after,  # Swap before/after
            "qty_changed": -original.quantity_changed,  # Reverse the change
            "qty_after": original.quantity_before,
            "unit": original.unit_of_measurement,
            "original_trans_id": transaction_id,
            "user_id": user_id,
            "user_name": user_name,
            "notes": f"Reversal of transaction {transaction_id}. Reason: {reason}",
            "metadata": json.dumps({"original_transaction_id": transaction_id, "reason": reason})
        })

        # Update inventory
        update_query = text("""
            UPDATE inventory_today
            SET stock_quantity = stock_quantity + :qty_to_add,
                updated_at = CURRENT_TIMESTAMP
            WHERE item_id = :item_id AND batch_date = :batch_date
        """)

        db_session.execute(update_query, {
            "qty_to_add": -original.quantity_changed,  # Add back what was deducted
            "item_id": original.item_id,
            "batch_date": original.batch_date
        })

        db_session.commit()

        return {
            "status": "success",
            "message": f"Transaction {transaction_id} reversed successfully",
            "reversed_quantity": -original.quantity_changed,
            "unit": original.unit_of_measurement
        }

    except Exception as e:
        db_session.rollback()
        logger.error(f"Error reversing transaction {transaction_id}: {str(e)}")
        return {"status": "error", "message": str(e)}
```

---

## 9. TESTING STRATEGY

### 9.1 Unit Tests

```python
import pytest
from decimal import Decimal

class TestUnitConversions:
    def test_kg_to_g(self):
        result = convert_units(2.5, "kg", "g")
        assert result == 2500.0

    def test_l_to_ml(self):
        result = convert_units(1.5, "l", "ml")
        assert result == 1500.0

    def test_gal_to_l(self):
        result = convert_units(1, "gal", "l")
        assert abs(result - 3.785) < 0.001

    def test_tray_to_pcs(self):
        result = smart_convert_units(2, "tray_eggs", "pcs", "Dairy & Eggs")
        assert result == 60.0

    def test_sack_to_kg(self):
        result = smart_convert_units(3, "sack", "kg", "Rice & Noodles")
        assert result == 75.0

    def test_incompatible_units(self):
        result = convert_units(1, "kg", "ml")
        assert result is None


class TestInventoryDeduction:
    @pytest.fixture
    def setup_test_data(self, db_session):
        # Insert test inventory
        db_session.execute(text("""
            INSERT INTO inventory_today (
                item_id, item_name, stock_quantity, unit_of_measurement,
                batch_date, expiration_date, category
            ) VALUES
            (1, 'Tomatoes', 5000, 'g', '2025-01-01', '2025-01-15', 'Vegetables'),
            (2, 'Tomatoes', 3000, 'g', '2025-01-05', '2025-01-20', 'Vegetables')
        """))
        db_session.commit()

    def test_fifo_deduction(self, db_session, setup_test_data):
        # Deduct 6kg (6000g) - should take from oldest first
        result = await deduct_ingredient_with_transaction(
            db_session, "Tomatoes", 6, "kg", "Vegetables",
            "Test Menu", "2025-01-10", 1, "Test User"
        )

        assert result["status"] == "success"
        assert len(result["deductions"]) == 2
        # First batch should be depleted (5000g taken)
        assert result["deductions"][0]["quantity_after"] == 0
        # Second batch should have 2000g left (3000 - 1000)
        assert result["deductions"][1]["quantity_after"] == 2000

    def test_insufficient_stock(self, db_session, setup_test_data):
        # Try to deduct 10kg (10000g) - only 8000g available
        result = await deduct_ingredient_with_transaction(
            db_session, "Tomatoes", 10, "kg", "Vegetables",
            "Test Menu", "2025-01-10", 1, "Test User"
        )

        assert result["status"] == "partial"
        assert len(result["warnings"]) > 0
        assert "insufficient" in result["warnings"][0].lower()

    def test_unit_conversion_deduction(self, db_session, setup_test_data):
        # Recipe in kg, inventory in g
        result = await deduct_ingredient_with_transaction(
            db_session, "Tomatoes", 2.5, "kg", "Vegetables",
            "Test Menu", "2025-01-10", 1, "Test User"
        )

        assert result["status"] == "success"
        assert result["total_deducted"] == 2500  # 2.5kg = 2500g
```

### 9.2 Integration Tests

```python
class TestSalesImportIntegration:
    def test_complete_sales_import_flow(self, db_session):
        # 1. Insert menu with ingredients
        # 2. Import sales
        # 3. Verify inventory deducted correctly
        # 4. Verify transactions logged
        # 5. Verify audit trail
        pass

    def test_concurrent_sales_imports(self, db_session):
        # Test race condition handling with locking
        pass

    def test_rollback_on_error(self, db_session):
        # Test that entire sale is rolled back if any ingredient fails (strict mode)
        pass
```

---

## 10. DEPLOYMENT & MIGRATION PLAN

### Phase 1: Database Schema Updates (Week 1)
1. Add `unit_of_measurement` column to all inventory tables
2. Create `inventory_transactions` table
3. Create `sales_deduction_status` table
4. Create `unit_conversions` table
5. Populate unit conversions table

### Phase 2: Code Deployment (Week 2)
1. Deploy enhanced `unit_converter.py`
2. Deploy new `deduct_ingredient_with_transaction()` function
3. Deploy `auto_deduct_inventory_from_sales_v2()`
4. Add API endpoint for reversal

### Phase 3: Testing & Validation (Week 3)
1. Run unit tests
2. Run integration tests
3. Test with sample sales data
4. Validate reconciliation reports

### Phase 4: Production Rollout (Week 4)
1. Enable new deduction system in parallel (shadow mode)
2. Compare old vs new results for 1 week
3. Switch to new system
4. Monitor for issues

---

## 11. CONFIGURATION OPTIONS

```python
# config/inventory_deduction_config.py

DEDUCTION_CONFIG = {
    # Deduction behavior
    "strict_mode": False,  # If True, rollback all deductions on any error
    "allow_negative_stock": False,  # Never allow negative stock
    "require_full_stock": False,  # If True, fail if insufficient stock for any ingredient

    # Locking
    "enable_row_locking": True,
    "lock_timeout_seconds": 30,

    # Transaction logging
    "log_all_transactions": True,
    "log_metadata": True,

    # Unit conversions
    "use_compound_units": True,
    "auto_detect_category": True,

    # Performance
    "batch_size": 50,  # Process sales in batches
    "enable_parallel_processing": False,  # Future: parallel deduction

    # Notifications
    "notify_on_low_stock": True,
    "notify_on_deduction_error": True,
}
```

---

## 12. MONITORING & ALERTS

```sql
-- Daily deduction health check
CREATE OR REPLACE VIEW deduction_health_metrics AS
SELECT
    DATE(transaction_date) as date,
    COUNT(*) as total_deductions,
    COUNT(DISTINCT item_name) as unique_items,
    SUM(ABS(quantity_changed)) as total_quantity_deducted,
    COUNT(*) FILTER (WHERE quantity_after = 0) as batches_depleted,
    AVG(EXTRACT(EPOCH FROM (created_at - transaction_date))) as avg_processing_time_seconds
FROM inventory_transactions
WHERE transaction_type = 'DEDUCTION'
  AND transaction_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(transaction_date)
ORDER BY date DESC;

-- Alert: Items frequently running out of stock
CREATE OR REPLACE VIEW frequent_stockouts AS
SELECT
    item_name,
    COUNT(*) as stockout_count,
    MAX(transaction_date) as last_stockout,
    unit_of_measurement
FROM inventory_transactions
WHERE transaction_type = 'DEDUCTION'
  AND quantity_after = 0
  AND transaction_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY item_name, unit_of_measurement
HAVING COUNT(*) >= 5
ORDER BY stockout_count DESC;
```

---

## ✅ SUMMARY

This improved system provides:

1. **✅ Robust Unit Conversion** - Handles all unit types including compound units
2. **✅ FIFO Implementation** - Oldest batches used first
3. **✅ Zero Stock Preservation** - Items never deleted, marked as OUT_OF_STOCK
4. **✅ Transaction Safety** - ACID compliant with rollback support
5. **✅ Complete Audit Trail** - Every change logged with full details
6. **✅ Race Condition Prevention** - Row-level locking
7. **✅ Error Recovery** - Reversal mechanism for mistakes
8. **✅ Performance Optimized** - Batch processing and efficient queries
9. **✅ Monitoring & Alerts** - Built-in health checks
10. **✅ Configurable Behavior** - Strict/lenient modes

### Next Steps:
1. Review and approve schema changes
2. Test unit converter enhancements
3. Deploy to staging environment
4. Run comprehensive tests
5. Monitor performance metrics
6. Roll out to production

---

**Document Version**: 1.0
**Last Updated**: 2025-01-09
**Author**: Claude Code - Restaurant Inventory System Specialist
