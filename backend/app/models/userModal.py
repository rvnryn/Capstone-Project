from sqlalchemy import Column, Integer, String, Text, TIMESTAMP
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, index=True)
    auth_id = Column(String, unique=True, index=True)
    name = Column(String)
    email = Column(String)
    user_role = Column(String)