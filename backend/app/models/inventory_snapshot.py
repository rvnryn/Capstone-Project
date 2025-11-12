from sqlalchemy import Column, Integer, String, Date, Float, Numeric, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime, timezone

Base = declarative_base()


class InventorySnapshot(Base):
    """
    Daily snapshot of inventory state for historical reporting.
    Captures the state of all inventory items at a specific point in time.
    """
    __tablename__ = "inventory_snapshots"

    snapshot_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    snapshot_date = Column(Date, nullable=False, index=True)  # Date of the snapshot
    item_id = Column(Integer, nullable=False, index=True)  # Reference to inventory item
    item_name = Column(String, nullable=False, index=True)
    category = Column(String)
    stock_quantity = Column(Float, nullable=False, default=0.0)
    stock_status = Column(String)  # Out Of Stock, Critical, Low, Normal
    unit_cost = Column(Numeric(10, 2), nullable=True, default=0.00)
    total_value = Column(Numeric(12, 2), nullable=True)  # stock_quantity * unit_cost
    batch_date = Column(Date)
    expiration_date = Column(Date)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    def as_dict(self):
        return {c.name: getattr(self, c.key) for c in self.__table__.columns}
