from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Time
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class BloodPressureMeasurement(Base):
    __tablename__ = "blood_pressure_measurement"

    id = Column(Integer, primary_key=True, index=True)
    tracking_id = Column(Integer, ForeignKey("blood_pressure_tracking.id", ondelete="CASCADE"), nullable=False, index=True)
    measurement_time = Column(Time, nullable=False)  # Ölçüm saati (örn: 08:00, 10:00)
    systolic = Column(Integer, nullable=True)  # Sistolik (Büyük tansiyon)
    diastolic = Column(Integer, nullable=True)  # Diyastolik (Küçük tansiyon)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    tracking = relationship("BloodPressureTracking", back_populates="measurements")

