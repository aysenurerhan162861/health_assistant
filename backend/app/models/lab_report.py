from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class LabReport(Base):
    __tablename__ = "lab_reports"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    upload_date = Column(DateTime, default=datetime.utcnow)
    parsed_data = Column(JSON, nullable=True)  # PDF’ten çıkarılan değerler JSON formatında
    doctor_comment = Column(String, nullable=True)

    patient = relationship("User", back_populates="lab_reports")
    patient_id = Column(Integer, ForeignKey("users.id"))
    tests = relationship("LabTest", back_populates="lab_report", cascade="all, delete-orphan")
    viewed_by_doctor = Column(Boolean, default=False)
