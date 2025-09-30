from sqlalchemy import Column, Integer, String, Enum
from app.database import Base
from enum import Enum as PyEnum

class UserRole(str, PyEnum):
    CITIZEN = "citizen"
    DOCTOR = "doctor"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="citizen")
