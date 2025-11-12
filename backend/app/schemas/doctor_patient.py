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
    note: Optional[str]
    

    model_config = {
        "from_attributes": True  # Pydantic V2 için orm_mode yerine
    }

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