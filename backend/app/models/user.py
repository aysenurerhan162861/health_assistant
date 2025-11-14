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
    
    # 👇 Profil bilgileri
    profile_image = Column(String, nullable=True)
    diploma_number = Column(String, nullable=True)
    workplace = Column(String, nullable=True)
    specialization = Column(String, nullable=True)
    must_change_password = Column(Boolean, default=False)

    # 👇 Kişisel / Hasta bilgileri
    phone = Column(String, nullable=True)
    birth_date = Column(Date, nullable=True)
    gender = Column(String, nullable=True)
    age = Column(Integer, nullable=True)  # 🔹 yeni eklenen alan
    city = Column(String, nullable=True)
    district = Column(String, nullable=True)
    neighborhood = Column(String, nullable=True)
    blood_type = Column(String, nullable=True)
    chronic_diseases = Column(String, nullable=True)
    allergies = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)

    # 👇 Doktor/Asistan özel alanları
    branch = Column(String, nullable=True)
    experience = Column(Integer, nullable=True)
    institution = Column(String, nullable=True)
    diploma_no = Column(String, nullable=True)
    certifications = Column(Text, nullable=True)  # JSON veya CSV string
    about = Column(Text, nullable=True)

    # 👇 Hiyerarşik ilişki (örneğin doktorun asistanı)
    parent_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    parent = relationship("User", remote_side=[id])

     # LabReport ilişkisi
    lab_reports = relationship("LabReport", back_populates="patient", cascade="all, delete-orphan")
