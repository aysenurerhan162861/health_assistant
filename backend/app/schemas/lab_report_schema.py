from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any
from app.schemas.doctor_patient import PatientOut

class LabReportBase(BaseModel):
    patient_id: int
    file_name: str
    file_path: str
    parsed_data: Optional[Dict[str, Any]] = None
    doctor_comment: Optional[str] = None


class LabReportCreate(LabReportBase):
    pass

class LabReportResponse(LabReportBase):
    id: int
    upload_date: datetime
    patient: Optional[PatientOut] = None 

    class Config:
        orm_mode = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
        
class LabReportUpdateComment(BaseModel):
    doctor_comment: str