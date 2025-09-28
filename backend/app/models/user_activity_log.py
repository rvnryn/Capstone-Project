from sqlalchemy import Column, Integer, String, Text, TIMESTAMP
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()


class UserActivityLog(Base):
    __tablename__ = "user_activity_log"
    activity_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, index=True, nullable=True)
    action_type = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    activity_date = Column(TIMESTAMP, nullable=True)
    report_date = Column(TIMESTAMP, nullable=True)
    user_name = Column(String, nullable=True)
    role = Column(String, nullable=True)

    def __repr__(self):
        return f"<UserActivityLog(user_id={self.user_id}, action_type={self.action_type}, description={self.description}, activity_date={self.activity_date}, report_date={self.report_date}, user_name={self.user_name}, role={self.role})>"
