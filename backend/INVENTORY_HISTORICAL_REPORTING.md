# Inventory Historical Reporting System

## Overview

The Inventory Historical Reporting system captures daily snapshots of your inventory state, enabling historical analysis, trend tracking, and comparison over time. This solves the limitation where reports were being overwritten daily by preserving historical data.

## Features

### 1. **Daily Automatic Snapshots**
- Automatically captures inventory state every 24 hours
- Runs at midnight to capture end-of-day inventory
- Stores complete inventory details including:
  - Stock quantities
  - Stock status (Normal, Low, Critical, Out of Stock)
  - Item values (quantity × unit cost)
  - Categories and metadata

### 2. **Historical Analytics**
- Query inventory state from any past date
- Compare inventory between two dates
- Track stock level trends over time
- Analyze category performance historically

### 3. **Manual Snapshot Creation**
- Create snapshots on-demand for specific dates
- Useful for:
  - Testing
  - Creating historical baselines
  - Capturing important business moments (end of month, quarter, etc.)

## Database Schema

### Table: `inventory_snapshots`

```sql
CREATE TABLE inventory_snapshots (
    snapshot_id SERIAL PRIMARY KEY,
    snapshot_date DATE NOT NULL,              -- Date of snapshot
    item_id INTEGER NOT NULL,                 -- Item reference
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(255),
    stock_quantity FLOAT NOT NULL DEFAULT 0.0,
    stock_status VARCHAR(50),                 -- Normal, Low, Critical, Out of Stock
    unit_cost NUMERIC(10, 2) DEFAULT 0.00,
    total_value NUMERIC(12, 2),               -- Calculated: quantity * cost
    batch_date DATE,
    expiration_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### 1. Get Historical Analytics

**Endpoint:** `GET /api/inventory-analytics-historical`

**Query Parameters:**
- `historical_date` (optional): Specific date for snapshot (YYYY-MM-DD)
- `start_date` (optional): Start date for time-range data
- `end_date` (optional): End date for time-range data

**Examples:**

```bash
# Get current inventory (no historical_date)
GET /api/inventory-analytics-historical

# Get inventory state from December 1, 2024
GET /api/inventory-analytics-historical?historical_date=2024-12-01

# Get historical snapshot with custom date range for spoilage
GET /api/inventory-analytics-historical?historical_date=2024-12-01&start_date=2024-11-01&end_date=2024-12-01
```

**Response:**
```json
{
  "is_historical": true,
  "snapshot_date": "2024-12-01",
  "period": {
    "start_date": "2024-11-01",
    "end_date": "2024-12-01"
  },
  "stock_overview": {
    "total_items": 150,
    "total_quantity": 5000,
    "total_categories": 8,
    "out_of_stock_items": 5,
    "total_inventory_value": 125000.50
  },
  "stock_by_category": [...],
  "stock_status_distribution": [...],
  "top_items": [...]
}
```

### 2. Create Manual Snapshot

**Endpoint:** `POST /api/inventory-snapshot/create`

**Query Parameters:**
- `snapshot_date` (optional): Date for snapshot (defaults to today)

**Examples:**

```bash
# Create snapshot for today
POST /api/inventory-snapshot/create

# Create snapshot for specific date
POST /api/inventory-snapshot/create?snapshot_date=2024-12-15
```

**Response:**
```json
{
  "status": "success",
  "message": "Snapshot created successfully",
  "snapshot_date": "2024-12-15",
  "items_count": 150
}
```

### 3. Get Available Snapshot Dates

**Endpoint:** `GET /api/inventory-snapshot/dates`

**Response:**
```json
{
  "snapshots": [
    {
      "snapshot_date": "2025-01-09",
      "items_count": 150,
      "created_at": "2025-01-09T00:00:05Z"
    },
    {
      "snapshot_date": "2025-01-08",
      "items_count": 148,
      "created_at": "2025-01-08T00:00:03Z"
    }
  ],
  "total_snapshots": 30
}
```

### 4. Compare Two Snapshots

**Endpoint:** `GET /api/inventory-snapshots/compare`

**Query Parameters:**
- `date1` (required): First snapshot date
- `date2` (required): Second snapshot date

**Example:**

```bash
GET /api/inventory-snapshots/compare?date1=2024-12-01&date2=2024-12-15
```

**Response:**
```json
{
  "date1": "2024-12-01",
  "date2": "2024-12-15",
  "summary": {
    "total_items_date1": 150,
    "total_items_date2": 152,
    "items_changed": 45,
    "items_added": 3,
    "items_removed": 1
  },
  "changes": [
    {
      "item_name": "Tomatoes",
      "category": "Vegetables",
      "quantity_before": 100.0,
      "quantity_after": 250.0,
      "quantity_change": 150.0,
      "status_before": "Low",
      "status_after": "Normal",
      "value_change": 750.00
    }
  ],
  "new_items": [...],
  "removed_items": [...]
}
```

### 5. Delete Snapshot

**Endpoint:** `DELETE /api/inventory-snapshot/{snapshot_date}`

**Example:**

```bash
DELETE /api/inventory-snapshot/2024-12-01
```

## Installation & Setup

### 1. Run Database Migration

Execute the migration SQL file to create the table:

```bash
# Using psql
psql -U your_user -d your_database -f migrations/create_inventory_snapshots_table.sql

# Or using Supabase SQL Editor
# Copy and paste the contents of create_inventory_snapshots_table.sql
```

### 2. Verify Installation

The backend will automatically:
- Register the new API endpoints
- Start the daily snapshot scheduler on startup
- Begin capturing snapshots every 24 hours

### 3. Create Initial Snapshot (Optional)

To create an initial snapshot for today:

```bash
curl -X POST http://localhost:8000/api/inventory-snapshot/create
```

## Usage Examples

### Frontend Integration

#### 1. Fetch Available Snapshot Dates for Dropdown

```typescript
const fetchSnapshotDates = async () => {
  const response = await fetch('/api/inventory-snapshot/dates');
  const data = await response.json();
  return data.snapshots.map(s => s.snapshot_date);
};
```

#### 2. Get Historical Report

```typescript
const getHistoricalReport = async (date: string) => {
  const response = await fetch(
    `/api/inventory-analytics-historical?historical_date=${date}`
  );
  return await response.json();
};
```

#### 3. Compare Two Periods

```typescript
const comparePeriods = async (date1: string, date2: string) => {
  const response = await fetch(
    `/api/inventory-snapshots/compare?date1=${date1}&date2=${date2}`
  );
  return await response.json();
};
```

## Scheduler Configuration

The daily snapshot job:
- **Frequency:** Every 24 hours
- **Wait First:** Yes (waits one cycle before first run)
- **Duplicate Prevention:** Checks if snapshot already exists for the date
- **System User:** Records snapshots with user_id = 0 (System)

To modify the schedule, edit the `@repeat_every` decorator in:
```python
# backend/app/routes/Reports/Inventory/inventory_snapshot_scheduler.py

@router.on_event("startup")
@repeat_every(seconds=86400, wait_first=True)  # Change seconds value
async def scheduled_daily_snapshot():
    ...
```

## Performance Considerations

### Indexes
The following indexes optimize query performance:
- `snapshot_date` - For date-based queries
- `item_id` - For item tracking
- `item_name` - For item lookups
- `category` - For category filtering
- `(snapshot_date, item_name)` - Composite index for comparisons

### Storage
- Average snapshot size: ~150 items × 200 bytes = ~30KB per snapshot
- Monthly storage: 30 days × 30KB = ~900KB
- Yearly storage: 365 days × 30KB = ~11MB

Very minimal storage impact!

### Query Optimization
- Snapshots are indexed by date for fast retrieval
- Historical queries use the same optimized SQL as current queries
- Comparison queries use efficient JOINs

## Troubleshooting

### Snapshot Not Created

**Check scheduler logs:**
```python
logger.info("Starting scheduled inventory snapshot for {today}")
```

**Manually trigger:**
```bash
curl -X POST http://localhost:8000/api/inventory-snapshot/create
```

### No Snapshots Found

**Verify table exists:**
```sql
SELECT COUNT(*) FROM inventory_snapshots;
```

**Check available dates:**
```bash
curl http://localhost:8000/api/inventory-snapshot/dates
```

### Duplicate Snapshots

The system prevents duplicates automatically. If a snapshot exists for a date, it will skip creation:

```json
{
  "status": "skipped",
  "message": "Snapshot for 2025-01-09 already exists"
}
```

## Future Enhancements

Potential features to add:
1. **Snapshot retention policy** - Auto-delete snapshots older than X days
2. **Compressed snapshots** - Store only changes (delta compression)
3. **Scheduled reports** - Email weekly/monthly comparison reports
4. **Trend prediction** - ML-based forecasting using historical data
5. **Custom snapshot tags** - Mark important business events
6. **Multi-warehouse support** - Snapshots per location

## Migration Rollback

To remove the historical reporting feature:

```sql
-- Drop table and indexes
DROP TABLE IF EXISTS inventory_snapshots CASCADE;

-- Remove from main.py imports
-- Comment out the router registrations
```

## Support

For issues or questions:
1. Check logs in `backend/logs/`
2. Verify database connection
3. Test with manual snapshot creation
4. Review API response errors

---

**Last Updated:** January 9, 2025
**Version:** 1.0.0
