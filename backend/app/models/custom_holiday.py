from sqlalchemy import Column, Integer, String, Date, Text
from .base import Base


class CustomHoliday(Base):
    __tablename__ = "custom_holidays"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, unique=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)

    def __repr__(self):
        return f"<CustomHoliday(date={self.date}, name={self.name})>"
