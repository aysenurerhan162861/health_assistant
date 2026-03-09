from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Float, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class MrScan(Base):
    __tablename__ = "mr_scans"

    id               = Column(Integer, primary_key=True, index=True)
    patient_id       = Column(Integer, ForeignKey("users.id"), nullable=False)
    file_name        = Column(String,  nullable=False)
    file_path        = Column(String,  nullable=False)
    upload_date      = Column(DateTime, default=datetime.utcnow)

    # Model sonuçları
    lesion_detected  = Column(Boolean, nullable=True)
    lesion_volume    = Column(Float,   nullable=True)
    dice_confidence  = Column(Float,   nullable=True)
    mask_path        = Column(String,  nullable=True)
    gradcam_path     = Column(String,  nullable=True)   # ← YENİ

    # AI yorumu
    ai_comment       = Column(String,  nullable=True)
    doctor_comment   = Column(String,  nullable=True)

    # Durum: pending | done | error
    status           = Column(String,  default="pending")
    result_data      = Column(JSON,    nullable=True)
    viewed_by_doctor = Column(Boolean, default=False)

    # İlişki
    patient = relationship("User", back_populates="mr_scans")