from sqlalchemy import Column, Integer, String, Enum, Boolean, Text, ForeignKey
from app.database import Base
from enum import Enum as PyEnum
from sqlalchemy.types import Date
from sqlalchemy.orm import relationship


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

    phone = Column(String, nullable=True)
    birth_date = Column(Date, nullable=True)
    gender = Column(String, nullable=True)
    city = Column(String, nullable=True)
    district = Column(String, nullable=True)
    neighborhood = Column(String, nullable=True)
    blood_type = Column(String, nullable=True)
    chronic_diseases = Column(String, nullable=True)
    allergies = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)

    branch = Column(String)
    experience = Column(Integer)
    institution = Column(String)
    diploma_no = Column(String)
    certifications = Column(Text)  # JSON veya comma-separated string
    about = Column(Text)

    parent_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    parent = relationship("User", remote_side=[id])

    
