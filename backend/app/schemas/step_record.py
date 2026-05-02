from pydantic import BaseModel
from datetime import date
from typing import Optional

class StepRecordCreate(BaseModel):
    date: date
    steps: int
    distance_km: Optional[float] = None
    calories_burned: Optional[float] = None
    source: Optional[str] = "healthkit"

class StepRecordResponse(BaseModel):
    id: int
    user_id: int
    date: date
    steps: int
    distance_km: Optional[float]
    calories_burned: Optional[float]
    source: str

    class Config:
        from_attributes = True