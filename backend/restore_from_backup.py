"""
Emergency Restore Script
Use this to manually restore from a backup file if automated restore fails
"""

import sys
import json
import os
from dotenv import load_dotenv
from supabase import create_client
from datetime import datetime

# Load environment variables
load_dotenv()

def restore(backup_file):
    """
    Restore database from backup file
    
    Args:
        backup_file: Path to the backup JSON file
    """
    try:
        # Check if file exists
        if not os.path.exists(backup_file):
            print(f"✗ Backup file not found: {backup_file}")
            return False
        
        # Load backup data
        print(f"\n{'='*60}")
        print(f"EMERGENCY RESTORE")
        print(f"{'='*60}\n")
        print(f"Loading backup file: {backup_file}")
        
        with open(backup_file, 'r') as f:
            backup_data = json.load(f)
        
        print(f"Migration: {backup_data.get('migration', 'Unknown')}")
        print(f"Timestamp: {backup_data.get('timestamp', 'Unknown')}")
        print(f"Tables: {', '.join(backup_data.get('tables', {}).keys())}")
        
        # Ask for confirmation
        confirmation = input(f"\nProceed with restore? This will overwrite current data. (yes/no): ").strip().lower()
        if confirmation not in ['yes', 'y']:
            print("\n⚠ Restore cancelled by user.")
            return False
        
        # Connect to Supabase
        SUPABASE_URL = os.getenv("SUPABASE_URL")
        SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
        
        if not SUPABASE_URL or not SUPABASE_KEY:
            print("✗ Supabase credentials not found in environment variables")
            return False
        
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("\n✓ Connected to Supabase")
        
        # Restore each table
        print(f"\n{'='*60}")
        print("Restoring Tables")
        print(f"{'='*60}\n")
        
        for table_name, records in backup_data.get("tables", {}).items():
            if not records:
                print(f"⚠ No records to restore for {table_name}")
                continue
            
            try:
                print(f"\nRestoring {table_name}...")
                print(f"  Records to restore: {len(records)}")
                
                # Restore in batches
                batch_size = 100
                total_batches = (len(records) + batch_size - 1) // batch_size
                
                for i in range(0, len(records), batch_size):
                    batch = records[i:i + batch_size]
                    supabase.table(table_name).upsert(batch).execute()
                    batch_num = i // batch_size + 1
                    print(f"  ✓ Batch {batch_num}/{total_batches} restored")
                
                print(f"✓ Successfully restored {len(records)} records to {table_name}")
                
            except Exception as e:
                print(f"✗ Error restoring {table_name}: {e}")
                import traceback
                traceback.print_exc()
                return False
        
        # Success
        print(f"\n{'='*60}")
        print("✓ RESTORE COMPLETED SUCCESSFULLY")
        print(f"{'='*60}\n")
        return True
        
    except Exception as e:
        print(f"\n✗ Restore failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def list_backups():
    """List all available backup files"""
    backup_dir = "backups"
    
    if not os.path.exists(backup_dir):
        print("No backups directory found")
        return
    
    backup_files = [f for f in os.listdir(backup_dir) if f.endswith('.json')]
    
    if not backup_files:
        print("No backup files found")
        return
    
    print(f"\n{'='*60}")
    print("Available Backup Files")
    print(f"{'='*60}\n")
    
    for i, filename in enumerate(sorted(backup_files, reverse=True), 1):
        filepath = os.path.join(backup_dir, filename)
        size = os.path.getsize(filepath)
        size_mb = size / (1024 * 1024)
        modified = datetime.fromtimestamp(os.path.getmtime(filepath))
        
        print(f"{i}. {filename}")
        print(f"   Size: {size_mb:.2f} MB")
        print(f"   Modified: {modified.strftime('%Y-%m-%d %H:%M:%S')}")
        print()

def main():
    if len(sys.argv) < 2:
        print("Emergency Restore Script")
        print("="*60)
        print("\nUsage:")
        print("  python restore_from_backup.py <backup_file>")
        print("  python restore_from_backup.py --list")
        print("\nExamples:")
        print("  python restore_from_backup.py backups/backup_add_unit_cost_20241116_143022.json")
        print("  python restore_from_backup.py --list")
        print()
        return
    
    if sys.argv[1] == "--list":
        list_backups()
        return
    
    backup_file = sys.argv[1]
    success = restore(backup_file)
    
    exit(0 if success else 1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠ Restore interrupted by user.")
        exit(1)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
