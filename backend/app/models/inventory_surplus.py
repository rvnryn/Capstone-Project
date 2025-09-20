from sqlalchemy import Column, Integer, String, Date, Float
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class InventorySurplus(Base):
    __tablename__ = "inventory_surplus"
    item_id = Column(Integer, primary_key=True, index=True)
    item_name = Column(String)
    stock_status = Column(String)
    expiration_date = Column(Date)
    category = Column(String)
    batch_date = Column(Date)
    stock_quantity = Column("stock_quantity", Float)

    # Backwards-compatible alias
    @property
    def quantity(self):
        return self.stock_quantity

    # Add other fields as needed

    def as_dict(self):
        # Use column.name for JSON key (DB column name) but column.key to access
        # the mapped Python attribute (this handles when Column(..., name='...')
        # maps a different attribute name).
        return {c.name: getattr(self, c.key) for c in self.__table__.columns}
