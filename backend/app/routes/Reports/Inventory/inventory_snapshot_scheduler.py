from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from datetime import datetime, date, timezone
from app.supabase import get_db
from app.models.inventory_snapshot import InventorySnapshot
from app.models.user_activity_log import UserActivityLog
from fastapi_utils.tasks import repeat_every
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Track last snapshot date to avoid duplicates
last_snapshot_date = None


async def create_inventory_snapshot(db: AsyncSession, snapshot_date: date = None) -> dict:
    """
    Create a snapshot of current inventory state.
    Can be called manually or by scheduler.

    Args:
        db: Database session
        snapshot_date: Date for the snapshot (defaults to today)

    Returns:
        Dictionary with snapshot statistics
    """
    try:
        if snapshot_date is None:
            snapshot_date = datetime.now(timezone.utc).date()

        logger.info(f"Creating inventory snapshot for {snapshot_date}")

        # Check if snapshot already exists for this date
        check_query = text("""
            SELECT COUNT(*) as count
            FROM inventory_snapshots
            WHERE snapshot_date = :snapshot_date
        """)
        result = await db.execute(check_query, {"snapshot_date": snapshot_date})
        existing_count = result.scalar()

        if existing_count > 0:
            logger.warning(f"Snapshot already exists for {snapshot_date}, skipping...")
            return {
                "status": "skipped",
                "message": f"Snapshot for {snapshot_date} already exists",
                "snapshot_date": str(snapshot_date),
                "items_count": existing_count
            }

        # Fetch all current inventory items with calculated total_value
        inventory_query = text("""
            SELECT
                item_id,
                item_name,
                category,
                stock_quantity,
                stock_status,
                unit_cost,
                (stock_quantity * COALESCE(unit_cost, 0)) as total_value,
                batch_date,
                expiration_date
            FROM inventory
        """)

        inventory_result = await db.execute(inventory_query)
        inventory_items = inventory_result.fetchall()

        if not inventory_items:
            logger.info(f"No inventory items found for snapshot on {snapshot_date}")
            return {
                "status": "success",
                "message": "No inventory items to snapshot",
                "snapshot_date": str(snapshot_date),
                "items_count": 0
            }

        # Create snapshot records
        snapshots_created = 0
        for item in inventory_items:
            # Convert string dates to date objects if necessary
            batch_date = item.batch_date
            if isinstance(batch_date, str):
                batch_date = datetime.strptime(batch_date, "%Y-%m-%d").date()

            expiration_date = item.expiration_date
            if isinstance(expiration_date, str):
                expiration_date = datetime.strptime(expiration_date, "%Y-%m-%d").date()

            snapshot = InventorySnapshot(
                snapshot_date=snapshot_date,
                item_id=item.item_id,
                item_name=item.item_name,
                category=item.category,
                stock_quantity=float(item.stock_quantity) if item.stock_quantity else 0.0,
                stock_status=item.stock_status,
                unit_cost=item.unit_cost,
                total_value=item.total_value,
                batch_date=batch_date,
                expiration_date=expiration_date,
                created_at=datetime.now(timezone.utc)
            )
            db.add(snapshot)
            snapshots_created += 1

        await db.commit()

        logger.info(f"Successfully created {snapshots_created} inventory snapshots for {snapshot_date}")

        # Log activity
        try:
            # Use timezone-naive datetime for activity_date and report_date
            # since user_activity_log uses TIMESTAMP WITHOUT TIME ZONE
            now_naive = datetime.now(timezone.utc).replace(tzinfo=None)
            activity_log = UserActivityLog(
                user_id=0,  # System user
                action_type="inventory snapshot",
                description=f"System created inventory snapshot for {snapshot_date} ({snapshots_created} items)",
                activity_date=now_naive,
                report_date=now_naive,
                user_name="System",
                role="System"
            )
            db.add(activity_log)
            await db.commit()
        except Exception as e:
            logger.warning(f"Failed to log snapshot activity: {e}")

        return {
            "status": "success",
            "message": f"Snapshot created successfully",
            "snapshot_date": str(snapshot_date),
            "items_count": snapshots_created
        }

    except Exception as e:
        await db.rollback()
        logger.exception(f"Error creating inventory snapshot: {e}")
        raise


@router.post("/inventory-snapshot/create")
async def manual_create_snapshot(
    snapshot_date: str = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Manually trigger creation of an inventory snapshot.
    Useful for testing or creating historical snapshots.

    Args:
        snapshot_date: Optional date string (YYYY-MM-DD). Defaults to today.
    """
    try:
        if snapshot_date:
            target_date = datetime.strptime(snapshot_date, "%Y-%m-%d").date()
        else:
            target_date = datetime.now(timezone.utc).date()

        result = await create_inventory_snapshot(db, target_date)
        return result

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid date format. Use YYYY-MM-DD: {str(e)}"
        )
    except Exception as e:
        logger.exception(f"Error in manual snapshot creation: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create snapshot: {str(e)}"
        )


@router.get("/inventory-snapshot/dates")
async def get_snapshot_dates(db: AsyncSession = Depends(get_db)):
    """
    Get list of all available snapshot dates.
    Useful for frontend to show available historical reports.
    """
    try:
        query = text("""
            SELECT
                snapshot_date,
                COUNT(*) as items_count,
                MIN(created_at) as created_at
            FROM inventory_snapshots
            GROUP BY snapshot_date
            ORDER BY snapshot_date DESC
        """)

        result = await db.execute(query)
        snapshots = [dict(row._mapping) for row in result.fetchall()]

        return {
            "snapshots": snapshots,
            "total_snapshots": len(snapshots)
        }

    except Exception as e:
        logger.exception(f"Error fetching snapshot dates: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch snapshot dates: {str(e)}"
        )


# Scheduled job: Create daily snapshot at midnight
@router.on_event("startup")
@repeat_every(seconds=86400, wait_first=True)  # Run every 24 hours
async def scheduled_daily_snapshot():
    """
    Scheduled job to create daily inventory snapshots at midnight.
    Runs once per day to capture end-of-day inventory state.
    """
    global last_snapshot_date

    try:
        from app.supabase import SessionLocal

        today = datetime.now(timezone.utc).date()

        # Check if we already ran today
        if last_snapshot_date == today:
            logger.info(f"Snapshot already created for {today}, skipping...")
            return

        logger.info(f"Starting scheduled inventory snapshot for {today}")

        async with SessionLocal() as db:
            result = await create_inventory_snapshot(db, today)

            if result["status"] in ["success", "skipped"]:
                last_snapshot_date = today
                logger.info(f"Scheduled snapshot completed: {result['message']}")
            else:
                logger.error(f"Scheduled snapshot failed: {result.get('message', 'Unknown error')}")

    except Exception as e:
        logger.exception(f"Error in scheduled daily snapshot: {e}")


@router.delete("/inventory-snapshot/{snapshot_date}")
async def delete_snapshot(
    snapshot_date: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete all snapshots for a specific date.
    Use with caution - this is permanent.
    """
    try:
        target_date = datetime.strptime(snapshot_date, "%Y-%m-%d").date()

        delete_query = text("""
            DELETE FROM inventory_snapshots
            WHERE snapshot_date = :snapshot_date
        """)

        result = await db.execute(delete_query, {"snapshot_date": target_date})
        await db.commit()

        deleted_count = result.rowcount

        logger.info(f"Deleted {deleted_count} snapshot records for {snapshot_date}")

        return {
            "status": "success",
            "message": f"Deleted {deleted_count} snapshot records",
            "snapshot_date": snapshot_date,
            "deleted_count": deleted_count
        }

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid date format. Use YYYY-MM-DD: {str(e)}"
        )
    except Exception as e:
        await db.rollback()
        logger.exception(f"Error deleting snapshot: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete snapshot: {str(e)}"
        )
