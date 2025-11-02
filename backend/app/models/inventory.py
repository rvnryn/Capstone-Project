from sqlalchemy import Column, Integer, String, Date, Float, Numeric
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.hybrid import hybrid_property

Base = declarative_base()


class Inventory(Base):
    __tablename__ = "inventory"
    item_id = Column(Integer, primary_key=True, index=True)
    item_name = Column(String)
    stock_status = Column(String)
    expiration_date = Column(Date)
    category = Column(String)
    batch_date = Column(Date)
    stock_quantity = Column("stock_quantity", Float)
    unit_cost = Column(Numeric(10, 2), nullable=True, default=0.00)  # Cost per unit

    @property
    def quantity(self):
        return self.stock_quantity

    @hybrid_property
    def total_value(self):
        """Calculate total value: stock_quantity * unit_cost"""
        if self.stock_quantity and self.unit_cost:
            return float(self.stock_quantity) * float(self.unit_cost)
        return 0.00

    def as_dict(self):
        # Use column.name for JSON key (DB column name) but column.key to access
        # the mapped Python attribute (this handles when Column(..., name='...')
        # maps a different attribute name).
        result = {c.name: getattr(self, c.key) for c in self.__table__.columns}
        # Add calculated field
        result['total_value'] = self.total_value
        return result
