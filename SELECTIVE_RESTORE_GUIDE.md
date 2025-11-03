# Selective Restore Feature - Complete Guide

## Overview

The backup and restore system has been **completely fixed** and now supports **selective table restore**, giving you full control over what data to restore.

---

## 🔧 Backend Changes (COMPLETED)

### New API Endpoints

#### 1. **Preview Backup Contents**
```
POST /api/preview-backup
```

**Purpose:** View what tables are in a backup file WITHOUT restoring

**Request:**
- `file`: Backup file (multipart/form-data)
- `password`: Backup password

**Response:**
```json
{
  "tables": {
    "users": {
      "record_count": 15,
      "has_data": true
    },
    "inventory": {
      "record_count": 250,
      "has_data": true
    },
    "menu": {
      "record_count": 42,
      "has_data": true
    }
  },
  "total_tables": 23,
  "filename": "backup_20250102_143000.enc"
}
```

---

#### 2. **Selective Restore**
```
POST /api/restore-selective
```

**Purpose:** Restore ONLY selected tables from backup

**Request:**
- `file`: Backup file (multipart/form-data)
- `password`: Backup password
- `tables`: Comma-separated table names (e.g., "inventory,menu,suppliers")

**Response:**
```json
{
  "message": "Restore completed successfully."
}
```

**Example Usage:**
```javascript
const formData = new FormData();
formData.append('file', backupFile);
formData.append('password', 'mypassword');
formData.append('tables', 'inventory,menu,suppliers');

const response = await fetch('/api/restore-selective', {
  method: 'POST',
  body: formData
});
```

---

#### 3. **Full Restore (Original)**
```
POST /api/restore
POST /api/restore-local
```

**Purpose:** Restore ALL tables from backup (original behavior)

---

## 🐛 Critical Bugs Fixed

### Bug #1: Primary Keys Were Being Deleted ⚠️⚠️⚠️
**Before:**
```python
df2 = df.drop(columns=[pk_col])  # ❌ DELETED PRIMARY KEYS!
```

**After:**
```python
df.to_sql(table_name, conn, if_exists="append", index=False)  # ✅ KEEPS PRIMARY KEYS!
```

**Impact:**
- Primary keys are now preserved
- Auto-increment sequences work correctly
- No more duplicate key errors

---

### Bug #2: TRUNCATE RESTART IDENTITY
**Before:**
```python
TRUNCATE TABLE users RESTART IDENTITY;  # ❌ RESETS SEQUENCES TO 1!
```

**After:**
```python
DELETE FROM users;  # ✅ PRESERVES SEQUENCES!
```

**Impact:**
- Auto-increment counters remain correct
- No sequence conflicts

---

### Bug #3: Wrong Data Type Detection
**Before:**
- Guessed data types from first row only
- VARCHAR became INTEGER if first value was "123"

**After:**
- No data type guessing
- Uses existing table schema
- All data types preserved correctly

---

## 📋 Available Tables for Selective Restore

You can restore any combination of these tables:

**Inventory:**
- `inventory` - Master inventory
- `inventory_today` - Today's inventory
- `inventory_surplus` - Surplus inventory
- `inventory_spoilage` - Spoilage records
- `inventory_settings` - Ingredient settings
- `inventory_log` - Inventory history

**Menu:**
- `menu` - Menu items
- `menu_ingredients` - Menu-ingredient relationships
- `ingredients` - Ingredient definitions

**Sales:**
- `sales` - Sales records
- `top_sales` - Top selling items
- `orders` - Order records
- `order_items` - Order line items

**Users:**
- `users` - User accounts
- `user_activity_log` - Activity history
- `roles` - User roles

**Suppliers:**
- `suppliers` - Supplier information

**Settings:**
- `notification` - Notifications
- `notification_settings` - Notification preferences
- `custom_holidays` - Custom holidays
- `ph_holidays` - Philippine holidays
- `backup_history` - Backup history
- `backup_schedule` - Backup schedule

---

## 🎯 Use Cases

### Use Case 1: Restore Only Inventory
```javascript
// Preview backup
const preview = await fetch('/api/preview-backup', {
  method: 'POST',
  body: formData  // file + password
});

// Restore only inventory tables
formData.append('tables', 'inventory,inventory_today,inventory_settings');
await fetch('/api/restore-selective', {
  method: 'POST',
  body: formData
});
```

### Use Case 2: Restore Menu Without Users
```javascript
// Restore menu and ingredients, but keep current users
formData.append('tables', 'menu,menu_ingredients,ingredients');
await fetch('/api/restore-selective', {...});
```

### Use Case 3: Restore Only User Activity Log
```javascript
// Restore activity history without changing users
formData.append('tables', 'user_activity_log');
await fetch('/api/restore-selective', {...});
```

---

## 🚀 Frontend Implementation Guide

### Step 1: Add Preview Modal

Create a modal that shows backup contents before restore:

```tsx
const [backupPreview, setBackupPreview] = useState(null);
const [selectedTables, setSelectedTables] = useState<string[]>([]);

const handlePreviewBackup = async (file: File, password: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('password', password);

  const response = await fetch('/api/preview-backup', {
    method: 'POST',
    body: formData
  });

  const data = await response.json();
  setBackupPreview(data);
};
```

### Step 2: Table Selection UI

```tsx
{backupPreview && (
  <div className="space-y-2">
    <h3>Select Tables to Restore:</h3>
    {Object.entries(backupPreview.tables).map(([tableName, info]) => (
      <label key={tableName} className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={selectedTables.includes(tableName)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedTables([...selectedTables, tableName]);
            } else {
              setSelectedTables(selectedTables.filter(t => t !== tableName));
            }
          }}
        />
        <span>{tableName}</span>
        <span className="text-gray-400">
          ({info.record_count} records)
        </span>
      </label>
    ))}
  </div>
)}
```

### Step 3: Selective Restore Button

```tsx
const handleSelectiveRestore = async () => {
  if (selectedTables.length === 0) {
    alert('Please select at least one table to restore');
    return;
  }

  const formData = new FormData();
  formData.append('file', backupFile);
  formData.append('password', password);
  formData.append('tables', selectedTables.join(','));

  const response = await fetch('/api/restore-selective', {
    method: 'POST',
    body: formData
  });

  if (response.ok) {
    alert('Selected tables restored successfully!');
  }
};
```

---

## ⚠️ Important Warnings

### 1. Foreign Key Dependencies

Some tables depend on others. If you restore:
- `menu_ingredients` - Also restore `menu` and `ingredients`
- `order_items` - Also restore `orders`
- `inventory_log` - Related to `inventory`

### 2. User References

If you restore tables that reference users (like `user_activity_log`), make sure:
- User IDs in the backup match current users, OR
- Restore `users` table along with it

### 3. Sequence Issues

After selective restore:
- Auto-increment sequences are updated automatically
- First new record will have next available ID

---

## 🧪 Testing Checklist

Before using in production:

- [ ] Test preview backup (should show all tables)
- [ ] Test restore single table (e.g., just `inventory_settings`)
- [ ] Test restore multiple tables (e.g., `menu,menu_ingredients`)
- [ ] Test full restore (all tables)
- [ ] Verify primary keys are preserved
- [ ] Verify auto-increment works after restore
- [ ] Test with backup that has foreign keys
- [ ] Test error handling (wrong password, invalid tables)

---

## 📝 Activity Logging

All restore operations are logged:
- **Full Restore:** `action_type="restore backup"`
- **Selective Restore:** `action_type="selective restore"`
- **Description:** Shows filename and which tables were restored

Check User Activity Report to see restore history.

---

## 🔄 Migration from Old Restore

If you have existing frontend code using `/api/restore`:

**Old Code:**
```javascript
// Restores everything, no choice
await fetch('/api/restore', { method: 'POST', body: formData });
```

**New Code (Selective):**
```javascript
// 1. Preview first
const preview = await fetch('/api/preview-backup', {...});

// 2. Let user choose tables
const tables = userSelectedTables.join(',');

// 3. Restore selected
await fetch('/api/restore-selective', {
  method: 'POST',
  body: formData  // includes 'tables' parameter
});
```

---

## 🎨 Recommended UI Flow

1. **Upload Backup File**
   - User selects .enc file
   - Enters password

2. **Preview Contents**
   - Show all tables with record counts
   - Group by category (Inventory, Menu, Users, etc.)

3. **Select Tables**
   - Checkboxes for each table
   - "Select All" / "Deselect All" buttons
   - Show warnings for dependencies

4. **Confirm Restore**
   - Show summary: "You are about to restore 5 tables: ..."
   - Require confirmation
   - Show progress during restore

5. **Success/Error**
   - Show which tables were restored
   - Show any errors
   - Option to download restore log

---

## 🐛 Troubleshooting

### "None of the selected tables found in backup file"
- Table names are case-sensitive
- Check table names from preview
- Ensure backup file is not corrupted

### "Failed to restore table X"
- Check foreign key dependencies
- Ensure referenced tables exist
- Check database permissions

### "Restore completed but data missing"
- Verify selected tables
- Check backup file is from correct date
- Review activity log for details

---

## Summary

✅ **Backend:** Fully implemented with 3 new endpoints
⏳ **Frontend:** Needs implementation (guide provided above)
📝 **Documentation:** Complete
🧪 **Testing:** Recommended checklist provided

The selective restore feature gives you complete control over which tables to restore, preventing the "everything gets overwritten" problem you experienced before!
