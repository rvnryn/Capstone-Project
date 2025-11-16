# AI Prompt: Create Auto-Replay Migration System

**Copy and paste this entire prompt to an AI assistant:**

---

I need you to create an automatic migration replay system for my database migrations. Here are the requirements:

## Context

I have a Python/Supabase project where I run database migrations. Currently, when I restore from a backup, I need to manually re-run all migrations that were applied after that backup point. I want to automate this process.

## What I Need

### 1. Auto-Replay Migrations System (`auto_replay_migrations.py`)

Create a Python script that:

**Features:**

- Tracks all migrations that have been run (save to `migration_history.json`)
- When restoring from a backup, automatically detects which migrations need to be replayed
- Re-runs those migrations in the correct order
- Provides safety confirmations before executing
- Handles errors gracefully

**Core Functions:**

```python
def load_migration_history()
    # Load from migration_history.json

def save_migration_history(history)
    # Save to migration_history.json with timestamp

def record_migration(migration_name, status, backup_file)
    # Record when a migration is applied

def get_migrations_after_backup(backup_timestamp)
    # Find all migrations applied after a specific backup date
    # Backup filename format: backup_migration_name_YYYYMMDD_HHMMSS.json

def run_migration_file(migration_path)
    # Dynamically import and run a migration file
    # Call the migration's run_migration() function

def auto_replay_migrations(backup_file)
    # Main function: auto-detect and replay migrations

def restore_with_auto_replay(backup_file)
    # Step 1: Restore from backup
    # Step 2: Auto-replay missing migrations
```

**CLI Commands:**

```bash
python auto_replay_migrations.py history                 # View migration history
python auto_replay_migrations.py replay <backup_file>    # Just replay (no restore)
```

**IMPORTANT: Seamless Integration**

- Modify `restore_from_backup.py` to automatically call auto-replay after restore
- User should ONLY need to run: `python restore_from_backup.py backup.json`
- System automatically handles BOTH restore AND replay
- No extra commands, no extra steps - fully automatic!

**Migration History JSON Format:**

```json
{
  "migrations": [
    {
      "name": "001_add_unit_cost",
      "status": "applied",
      "applied_at": "2024-11-10T10:00:00",
      "last_run": "2024-11-10T10:00:00",
      "backup_file": "backups/backup_001_20241110_100000.json"
    }
  ],
  "last_updated": "2024-11-11T10:00:00"
}
```

### 2. Updated Migration Template (`migration_template.py`)

Update the existing migration template to automatically record migrations when they run successfully.

**Add to the template:**

- Import the record_migration function from auto_replay_migrations
- After successful migration, call: `record_migration(MIGRATION_NAME, "applied", backup_file)`
- Handle case where auto_replay_migrations is not available (graceful degradation)

**Integration point:**

```python
# After migration succeeds
if AUTO_REPLAY_ENABLED:
    record_migration(MIGRATION_NAME, status="applied", backup_file=backup_file)
    print("✓ Migration recorded in history (auto-replay enabled)")
```

### 3. Integrated Restore Script (`restore_from_backup.py`)

Update the existing restore script to automatically trigger auto-replay after successful restore.

**Modify restore function to:**

- After successful restore, automatically call auto_replay_migrations()
- Make it seamless - user just runs restore, migrations auto-apply
- No extra commands needed

**User Experience:**

```bash
# User just runs restore
python restore_from_backup.py backup.json

# System automatically does BOTH:
# 1. ✓ Restores database
# 2. ✓ Auto-replays missing migrations
# User doesn't need to do anything extra!
```

### 4. Quick Reference Guide (`AUTO_REPLAY_GUIDE.md`)

Create a markdown guide with:

**Sections:**

- What is it? (Simple explanation)
- How it works (Visual flow showing seamless integration)
- Setup instructions (one-time)
- Usage examples - emphasize ONE COMMAND does everything
- Complete workflow example (before/after comparison)
- Benefits list - highlight "zero extra steps"
- Commands reference
- Safety features
- Pro tips
- Troubleshooting section
- Requirements

**Tone:** Simple, clear, with emojis, code examples, and visual diagrams showing seamless workflow

## Technical Requirements

**Environment:**

- Python 3.8+
- Supabase client library
- python-dotenv
- JSON for data storage

**Environment Variables:**

```
SUPABASE_URL
SUPABASE_SERVICE_KEY
```

**File Structure:**

```
backend/
  ├── auto_replay_migrations.py    (NEW)
  ├── migration_template.py         (UPDATE)
  ├── restore_from_backup.py        (EXISTING - import from this)
  ├── migration_history.json        (AUTO-CREATED)
  ├── migrations/                   (EXISTING - migration files here)
  └── backups/                      (EXISTING - backup files here)
```

**Migration File Requirements:**

- All migration files must have a `run_migration()` function that returns True/False
- Migration files should be named: `001_description.py`, `002_description.py`, etc.
- Backup files are named: `backup_migration_name_YYYYMMDD_HHMMSS.json`

## Key Features to Implement

1. **Automatic Recording:** Every successful migration is auto-recorded
2. **Smart Detection:** Compare backup timestamp with migration history
3. **Ordered Replay:** Replay migrations in chronological order
4. **Batch Processing:** Handle multiple migrations in sequence
5. **Error Handling:** Stop on first failure, show clear error messages
6. **User Confirmation:** Ask before running auto-replay
7. **Detailed Logging:** Show progress with ✓, ✗, ⚠ symbols
8. **History Viewing:** Easy way to see what migrations have been applied

## Usage Flow Example (Seamless!)

```bash
# 1. Run migrations normally (auto-records in history)
python migrations/001_add_unit_cost.py
python migrations/002_add_batch_date.py
python migrations/003_add_constraints.py

# 2. Something fails, need to restore
# USER ONLY RUNS THIS ONE COMMAND:
python restore_from_backup.py backups/backup_002_20241111.json

# System AUTOMATICALLY does EVERYTHING:
# Step 1: ✓ Restores database from backup
# Step 2: ✓ Detects migration 003 is missing
# Step 3: ✓ Asks for confirmation
# Step 4: ✓ Auto-runs migration 003
# Step 5: ✓ Done! Database fully updated!

# NO EXTRA COMMANDS NEEDED!
# User just restored, migrations auto-applied!
```

**Key Point:** User doesn't need to know about auto-replay system. They just restore, everything happens automatically!

## Safety Requirements

- Always ask for confirmation before replaying migrations
- Stop immediately if any migration fails
- Show clear progress indicators
- Log all actions
- Handle missing migration files gracefully
- Validate backup file format before processing

## Error Messages

Provide clear error messages for:

- Backup file not found
- Invalid backup file format
- Migration file not found
- Migration execution failed
- Missing environment variables

## Output Examples

**Success:**

```
==========================================================
AUTO-REPLAY COMPLETED
Successfully replayed: 3/3
==========================================================
```

**Partial Success:**

```
✓ Successfully replayed: 2/3
✗ Failed to replay: 003_add_constraints
⚠ Auto-replay stopped due to error
```

## Additional Requirements

- Use type hints where appropriate
- Include docstrings for all functions
- Handle keyboard interrupts gracefully
- Support both Windows and Linux path separators
- Make it compatible with existing migration template structure

## CRITICAL: Seamless User Experience

**THE GOAL:** User should not need to learn new commands or think about migrations.

**What user does:**

```bash
python restore_from_backup.py backup.json
```

**What happens automatically (behind the scenes):**

1. Restore database ✓
2. Check migration history ✓
3. Find missing migrations ✓
4. Ask confirmation once ✓
5. Auto-run all missing migrations ✓
6. Done ✓

**User experience:**

- Restore = ONE command
- Migrations = AUTO-applied
- NO extra steps
- NO manual tracking
- Just works! ✓

**Implementation:**

- Integrate auto-replay directly into restore_from_backup.py
- Make it transparent to the user
- Handle all complexity behind the scenes
- Only show user-friendly messages

## Testing Scenarios to Consider

1. Fresh start (no history)
2. Restore to old backup (multiple migrations to replay)
3. Restore to recent backup (no migrations to replay)
4. Migration file missing
5. Migration execution fails
6. Invalid backup file
7. Interrupted replay (Ctrl+C)

Please create all three files with complete, production-ready code. Make sure the code is robust, well-documented, and easy to understand.

---

**End of prompt - paste this to an AI assistant to generate the complete system**
