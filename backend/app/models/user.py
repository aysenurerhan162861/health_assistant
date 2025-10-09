from sqlalchemy import Column, Integer, String, Enum, Boolean
from app.database import Base
from enum import Enum as PyEnum


class UserRole(str, PyEnum):
    CITIZEN = "citizen"
    DOCTOR = "doctor"
    ASSISTANT = "assistant"
    SEKRETER = "sekreter"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.CITIZEN)
    profile_image = Column(String, nullable=True)       # kullanıcı fotoğrafı
    diploma_number = Column(String, nullable=True)      # sadece doktor için
    workplace = Column(String, nullable=True)           # doktorun görev yaptığı yer
    specialization = Column(String, nullable=True)      # doktorun uzmanlık alanı
    must_change_password = Column(Boolean, default=False)
    
