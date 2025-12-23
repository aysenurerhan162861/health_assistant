from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Time, Date, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class BloodPressureTracking(Base):
    __tablename__ = "blood_pressure_tracking"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    period_hours = Column(Integer, nullable=False)  # Periyot (saat cinsinden, örn: 1, 2, 3)
    is_completed = Column(String, default="eksik")  # "tamamlandı" veya "eksik"
    doctor_comment = Column(Text, nullable=True)  # Doktor açıklaması
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    patient = relationship("User", back_populates="blood_pressure_trackings")
    measurements = relationship("BloodPressureMeasurement", back_populates="tracking", cascade="all, delete-orphan")

