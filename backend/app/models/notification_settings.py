from sqlalchemy import Column, Integer, Boolean, String, Text
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class NotificationSettings(Base):
    __tablename__ = "notification_settings"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False, unique=True)
    low_stock_enabled = Column(Boolean, default=True)
    low_stock_method = Column(Text, default='["inapp"]')  # Store as JSON string
    expiration_enabled = Column(Boolean, default=True)
    expiration_days = Column(Integer, default=3)
    expiration_method = Column(Text, default='["inapp"]')  # Store as JSON string

    def as_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}
