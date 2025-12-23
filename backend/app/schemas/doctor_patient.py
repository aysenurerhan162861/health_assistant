# app/schemas/doctor_patient.py
from pydantic import BaseModel
from typing import Optional

class PatientSelect(BaseModel):
    doctor_id: int
    note: Optional[str]

class PatientOut(BaseModel):
    id: int
    name: str
    email: Optional[str]
    phone: Optional[str]
    age: Optional[int] = None
    gender: Optional[str] = None
    note: Optional[str] = None
    blood_type: Optional[str] = None
    chronic_diseases: Optional[str] = None
    allergies: Optional[str] = None

    model_config = {
        "from_attributes": True  # Pydantic V2 için orm_mode yerine
    }

class MealNotificationSetting(BaseModel):
    meal_notification_enabled: bool

class DoctorOut(BaseModel):
    id: int
    name: str
    email: Optional[str]

    model_config = {
        "from_attributes": True
    }

class GrantPermissionRequest(BaseModel):
    assistant_id: int
    patient_id: int