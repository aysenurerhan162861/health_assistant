from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Meal(Base):
    __tablename__ = "meals"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    meal_datetime = Column(DateTime, nullable=False, default=datetime.utcnow)
    meal_type = Column(String, nullable=False)
    text_description = Column(Text, nullable=True)
    image_path = Column(String, nullable=True)
    gemini_calorie = Column(Integer, nullable=True)
    gemini_comment = Column(Text, nullable=True)
    doctor_comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    patient = relationship("User")

