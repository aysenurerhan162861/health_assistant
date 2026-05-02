from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, timedelta

from app.database import get_db
from app.models.step_record import StepRecord
from app.schemas.step_record import StepRecordCreate, StepRecordResponse

router = APIRouter(prefix="/api/steps", tags=["steps"])

API_KEY = "bap-healthkit-2026"

def verify_api_key(x_api_key: str = Header(None)):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Geçersiz API key")

@router.post("/sync", response_model=StepRecordResponse)
def sync_steps(
    data: StepRecordCreate,
    user_id: int,
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    existing = db.query(StepRecord).filter(
        StepRecord.user_id == user_id,
        StepRecord.date == data.date
    ).first()

    if existing:
        existing.steps = data.steps
        existing.distance_km = data.distance_km
        existing.calories_burned = data.calories_burned
        existing.source = data.source
        db.commit()
        db.refresh(existing)
        return existing

    new_record = StepRecord(
        user_id=user_id,
        date=data.date,
        steps=data.steps,
        distance_km=data.distance_km,
        calories_burned=data.calories_burned,
        source=data.source
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record

@router.get("/history", response_model=List[StepRecordResponse])
def get_step_history(
    user_id: int,
    days: int = 30,
    db: Session = Depends(get_db)
):
    start_date = date.today() - timedelta(days=days)
    records = db.query(StepRecord).filter(
        StepRecord.user_id == user_id,
        StepRecord.date >= start_date
    ).order_by(StepRecord.date.desc()).all()
    return records

@router.get("/today", response_model=Optional[StepRecordResponse])
def get_today_steps(
    user_id: int,
    db: Session = Depends(get_db)
):
    record = db.query(StepRecord).filter(
        StepRecord.user_id == user_id,
        StepRecord.date == date.today()
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Bugün için kayıt yok")
    return record

@router.post("/manual", response_model=StepRecordResponse)
def manual_step_entry(
    data: StepRecordCreate,
    user_id: int,
    db: Session = Depends(get_db)
):
    data.source = "manual"
    existing = db.query(StepRecord).filter(
        StepRecord.user_id == user_id,
        StepRecord.date == data.date
    ).first()

    if existing:
        existing.steps = data.steps
        existing.distance_km = data.distance_km
        existing.calories_burned = data.calories_burned
        existing.source = "manual"
        db.commit()
        db.refresh(existing)
        return existing

    new_record = StepRecord(
        user_id=user_id,
        date=data.date,
        steps=data.steps,
        distance_km=data.distance_km,
        calories_burned=data.calories_burned,
        source="manual"
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record