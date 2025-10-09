from sqlalchemy import Column, Integer, ForeignKey
from app.database import Base

class DoctorPatient(Base):
    __tablename__ = "doctor_patient"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
