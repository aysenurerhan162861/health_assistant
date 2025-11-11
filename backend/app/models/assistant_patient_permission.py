from sqlalchemy import Column, Integer, ForeignKey, String
from app.database import Base

class AssistantPatientPermission(Base):
    __tablename__ = "assistant_patient_permission"

    id = Column(Integer, primary_key=True, index=True)
    assistant_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    doctor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))  # izni veren doktor
    status = Column(String, default="active")  # 'onaylı' veya 'iptal'
