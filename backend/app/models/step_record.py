from sqlalchemy import Column, Integer, Float, Date, DateTime, ForeignKey, String 
from sqlalchemy.sql import func
from app.database import Base

class StepRecord(Base):
    __tablename__ = "step_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    steps = Column(Integer, nullable=False)
    distance_km = Column(Float, nullable=True)
    calories_burned = Column(Float, nullable=True)
    source = Column(String, default="healthkit")
    created_at = Column(DateTime(timezone=True), server_default=func.now())