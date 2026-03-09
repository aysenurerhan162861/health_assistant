from sqlalchemy import Column, Integer, ForeignKey, String, Boolean
from app.database import Base

class AssistantPatientPermission(Base):
    __tablename__ = "assistant_patient_permission"

    id = Column(Integer, primary_key=True, index=True)
    assistant_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    doctor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    status = Column(String, default="active")
    can_view_labs = Column(Boolean, default=False)
    can_view_mr = Column(Boolean, default=False)
