from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any


class MrScanCreate(BaseModel):
    patient_id: int
    file_name:  str
    file_path:  str


class PatientBasic(BaseModel):
    id:   int
    name: str

    class Config:
        from_attributes = True


class MrScanResult(BaseModel):
    id:               int
    patient_id:       int
    file_name:        str
    file_path:        str
    upload_date:      datetime
    lesion_detected:  Optional[bool]  = None
    lesion_volume:    Optional[float] = None
    dice_confidence:  Optional[float] = None
    mask_path:        Optional[str]   = None
    gradcam_path:     Optional[str]   = None   # ← YENİ
    ai_comment:       Optional[str]   = None
    doctor_comment:   Optional[str]   = None
    status:           str             = "pending"
    result_data:      Optional[Any]   = None
    viewed_by_doctor: bool            = False
    patient:          Optional[PatientBasic] = None

    class Config:
        from_attributes = True


class MrScanList(BaseModel):
    id:               int
    patient_id:       int
    file_name:        str
    upload_date:      datetime
    lesion_detected:  Optional[bool]  = None
    lesion_volume:    Optional[float] = None
    dice_confidence:  Optional[float] = None
    gradcam_path:     Optional[str]   = None   # ← YENİ
    status:           str
    viewed_by_doctor: bool            = False
    ai_comment:       Optional[str]   = None
    doctor_comment:   Optional[str]   = None
    patient:          Optional[PatientBasic] = None

    class Config:
        from_attributes = True