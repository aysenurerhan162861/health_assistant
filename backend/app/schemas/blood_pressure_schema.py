from datetime import date, time, datetime
from typing import Optional, List
from pydantic import BaseModel
from app.schemas.doctor_patient import PatientOut


class BloodPressureMeasurementCreate(BaseModel):
    measurement_time: str  # "HH:MM" formatında
    systolic: Optional[int] = None
    diastolic: Optional[int] = None


class BloodPressureMeasurementResponse(BaseModel):
    id: int
    tracking_id: int
    measurement_time: str  # "HH:MM" formatında
    systolic: Optional[int]
    diastolic: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class BloodPressureTrackingCreate(BaseModel):
    date: date
    start_time: str  # "HH:MM" formatında
    end_time: str  # "HH:MM" formatında
    period_hours: int  # Periyot (saat cinsinden)
    measurements: List[BloodPressureMeasurementCreate]


class BloodPressureTrackingResponse(BaseModel):
    id: int
    patient_id: int
    date: date
    start_time: str  # "HH:MM" formatında
    end_time: str  # "HH:MM" formatında
    period_hours: int
    is_completed: str
    doctor_comment: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    measurements: List[BloodPressureMeasurementResponse] = []
    patient: Optional[PatientOut] = None

    class Config:
        orm_mode = True


class BloodPressureTrackingListResponse(BaseModel):
    id: int
    date: date
    start_time: str
    end_time: str
    period_hours: int
    measurement_count: int  # Toplam ölçüm sayısı
    completed_count: int  # Doldurulmuş ölçüm sayısı
    is_completed: str
    created_at: datetime

    class Config:
        orm_mode = True


class BloodPressureTrackingUpdateComment(BaseModel):
    doctor_comment: Optional[str] = None

