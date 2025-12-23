from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.schemas.doctor_patient import PatientOut


class MealCreate(BaseModel):
    meal_type: str
    meal_datetime: Optional[datetime] = None
    text_description: Optional[str] = None


class MealUpdateComment(BaseModel):
    doctor_comment: Optional[str] = None


class MealResponse(BaseModel):
    id: int
    patient_id: int
    meal_datetime: datetime
    meal_type: str
    text_description: Optional[str]
    image_path: Optional[str]
    gemini_calorie: Optional[int]
    gemini_comment: Optional[str]
    doctor_comment: Optional[str]
    created_at: datetime
    updated_at: datetime
    patient: Optional[PatientOut] = None

    class Config:
        orm_mode = True

