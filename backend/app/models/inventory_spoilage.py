from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()


class InventorySpoilage(Base):
    __tablename__ = "inventory_spoilage"

    spoilage_id = Column(Integer, primary_key=True, autoincrement=True)
    item_id = Column(Integer, nullable=False)
    item_name = Column(String, nullable=False)
    quantity_spoiled = Column(Float, nullable=False)
    spoilage_date = Column(Date, nullable=False)
    reason = Column(String, nullable=True)
    user_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

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
            "reason": self.reason,
            "user_id": self.user_id,
            "created_at": safe_iso(self.created_at),
            "updated_at": safe_iso(self.updated_at),
        }
