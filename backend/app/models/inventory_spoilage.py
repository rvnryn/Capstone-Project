from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Numeric
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.hybrid import hybrid_property
from datetime import datetime

Base = declarative_base()


class InventorySpoilage(Base):
    __tablename__ = "inventory_spoilage"

    spoilage_id = Column(Integer, primary_key=True, autoincrement=True)
    item_id = Column(Integer, nullable=False)
    item_name = Column(String, nullable=False)
    quantity_spoiled = Column(Float, nullable=False)
    spoilage_date = Column(Date, nullable=False)
    expiration_date = Column(Date, nullable=True)
    category = Column(String, nullable=True)
    batch_date = Column(Date, nullable=True)
    reason = Column(String, nullable=True)
    unit_cost = Column(Numeric(10, 2), nullable=True, default=0.00)  # Cost tracking
    user_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @hybrid_property
    def total_loss(self):
        """Calculate financial loss: quantity_spoiled * unit_cost"""
        if self.quantity_spoiled and self.unit_cost:
            return float(self.quantity_spoiled) * float(self.unit_cost)
        return 0.00

    def as_dict(self):
        def safe_iso(val):
            if val is None:
                return None
            if isinstance(val, str):
                return val
            try:
                return val.isoformat()
            except Exception:
                return str(val)

        return {
            "spoilage_id": self.spoilage_id,
            "item_id": self.item_id,
            "item_name": self.item_name,
            "quantity_spoiled": self.quantity_spoiled,
            "spoilage_date": safe_iso(self.spoilage_date),
            "expiration_date": safe_iso(self.expiration_date),  # NEW
            "category": self.category,  # NEW
            "batch_date": safe_iso(self.batch_date),  # NEW
            "reason": self.reason,
            "user_id": self.user_id,
            "created_at": safe_iso(self.created_at),
            "updated_at": safe_iso(self.updated_at),
        }
