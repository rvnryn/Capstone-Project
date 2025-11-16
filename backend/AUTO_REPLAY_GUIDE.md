# Auto-Replay Migration System - Quick Guide

## 🎯 Ano Ito?

**Automatic na mag-reapply ng migrations after restore!**

Kapag nag-restore ka from backup, automatic na tatakbo ulit lahat ng migrations na ginawa AFTER that backup.

## 🚀 How It Works

```
1. Run migration → Auto-record sa history ✓
2. Restore from backup → Auto-detect migrations to replay ✓
3. Auto-run lahat ng missing migrations ✓
```

## 📋 Setup (One-time lang)

```bash
# 1. Make sure you have the files:
backend/
  ├── auto_replay_migrations.py    (NEW - auto replay system)
  ├── migration_template.py         (UPDATED - records history)
  └── migration_history.json        (AUTO-CREATED - tracks migrations)
```

## 💻 Usage

### Regular Migration (Automatic Recording)

```bash
# Run migration normally
python migrations/001_add_unit_cost.py

# ✓ Migration runs
# ✓ Creates backup
# ✓ Auto-records in history
```

### Restore with Auto-Replay

```bash
# Option 1: Restore + Auto-replay in one command
python auto_replay_migrations.py restore backups/backup_20241116_143022.json

# This will:
# 1. Restore database from backup
# 2. Find all migrations after that backup
# 3. Auto-run those migrations
# 4. Done! ✓
```

### View Migration History

```bash
python auto_replay_migrations.py history

# Shows:
# 1. ✓ add_unit_cost (Applied: 2024-11-10)
# 2. ✓ add_batch_date (Applied: 2024-11-11)
# 3. ✓ add_constraints (Applied: 2024-11-12)
```

## 🔄 Complete Example

```bash
# Monday: Run Migration 1
python migrations/001_add_unit_cost.py
# ✓ Applied
# ✓ Backup created: backup_001_20241110_100000.json
# ✓ Recorded in history

# Tuesday: Run Migration 2
python migrations/002_add_batch_date.py
# ✓ Applied
# ✓ Backup created: backup_002_20241111_100000.json
# ✓ Recorded in history

# Wednesday: Run Migration 3
python migrations/003_add_constraints.py
# ✗ FAILED!
# ✓ Auto-restored from backup_002

# Now you have 2 options:

# Option A: Just retry Migration 3 (manual)
python migrations/003_add_constraints.py

# Option B: Restore with auto-replay (automatic)
python auto_replay_migrations.py restore backups/backup_002_20241111_100000.json
# ✓ Restores from backup
# ✓ Auto-detects Migration 3 is missing
# ✓ Auto-runs Migration 3
# ✓ Done!
```

## 📊 Migration History File

Auto-created `migration_history.json`:

```json
{
  "migrations": [
    {
      "name": "001_add_unit_cost",
      "status": "applied",
      "applied_at": "2024-11-10T10:00:00",
      "last_run": "2024-11-10T10:00:00",
      "backup_file": "backups/backup_001_20241110_100000.json"
    },
    {
      "name": "002_add_batch_date",
      "status": "applied",
      "applied_at": "2024-11-11T10:00:00",
      "last_run": "2024-11-11T10:00:00",
      "backup_file": "backups/backup_002_20241111_100000.json"
    }
  ],
  "last_updated": "2024-11-11T10:00:00"
}
```

## ✅ Benefits

### BEFORE (Manual):

```
1. Restore from backup
2. Check which migrations are missing
3. Manually run Migration A
4. Manually run Migration B
5. Manually run Migration C
6. Hope you didn't miss anything
```

### AFTER (Auto-Replay):

```
1. python auto_replay_migrations.py restore backup.json
2. Done! ✓
```

## 🎯 Commands Reference

```bash
# Restore with auto-replay
python auto_replay_migrations.py restore backups/backup_file.json

# View migration history
python auto_replay_migrations.py history

# Just replay migrations (without restore)
python auto_replay_migrations.py replay backups/backup_file.json

# Normal migration (auto-records in history)
python migrations/your_migration.py
```

## 🔒 Safety Features

1. **Confirmation Required** - Hindi agad mag-run, tatanungin ka muna
2. **Order Preserved** - Mag-run in correct order based on timestamps
3. **Stop on Fail** - Kapag may nag-fail, automatic stop
4. **Full Logging** - Makikita mo lahat ng nangyayari

## 💡 Pro Tips

1. **Name migrations with numbers**:

   ```
   001_add_unit_cost.py
   002_add_batch_date.py
   003_add_constraints.py
   ```

2. **Keep migration files**:

   - Don't delete migration files
   - Auto-replay needs them to work

3. **Check history before restore**:

   ```bash
   python auto_replay_migrations.py history
   ```

4. **Test in dev first**:
   - Always test auto-replay in dev environment
   - Make sure migration files are accessible

## ⚠️ Requirements

1. Migration files must be in `migrations/` folder
2. Migration files must have `run_migration()` function
3. Use the updated `migration_template.py` for new migrations
4. Keep `migration_history.json` in version control (optional)

## 🆘 Troubleshooting

### "Migration file not found"

```bash
# Make sure migration files are in migrations/ folder
ls migrations/

# If missing, you'll need to run manually
python your_migration.py
```

### "Auto-replay system not available"

```bash
# Make sure auto_replay_migrations.py exists
ls auto_replay_migrations.py

# If missing, download from template
```

### Clear migration history (fresh start)

```bash
# Delete history file
rm migration_history.json

# Start fresh
python migrations/001_your_first_migration.py
```

## 🎉 Summary

**Ayaw mo na mag-manual ng migrations after restore?**

✅ Use: `python auto_replay_migrations.py restore backup.json`

**That's it!** Automatic na lahat! 🚀

---

Need help? Check `MIGRATION_BACKUP_RESTORE_STANDARD.md` for more details.
