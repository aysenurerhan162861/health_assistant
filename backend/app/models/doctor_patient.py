from sqlalchemy import Column, Integer, ForeignKey, String, Text, Boolean
from app.database import Base

class DoctorPatient(Base):
    __tablename__ = "doctor_patient"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    status = Column(String, default="beklemede")  # 'beklemede', 'onaylandı', 'reddedildi'
    note = Column(Text, nullable=True)  # opsiyonel, hasta açıklaması veya doktor notu
    meal_notification_enabled = Column(Boolean, default=True)  # Öğün takibi bildirimi (doktor-hasta özel)
