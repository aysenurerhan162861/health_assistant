from sqlalchemy import Column, Integer, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from app.database import Base

class DoctorTeam(Base):
    __tablename__ = "doctor_team"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    member_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    role = Column(String)  # "assistant" veya "secretary"
    permissions = Column(JSONB, default={})
