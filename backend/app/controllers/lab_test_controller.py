from fastapi import APIRouter, Depends, UploadFile, File, Form, Body, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.lab_report_schema import LabReportCreate, LabReportResponse
from app.services.lab_report_service import create_lab_report, get_lab_reports_by_patient, get_lab_reports_by_doctor
from app.models.lab_test import LabTest
from app.models.user import User
from app.services.user_service import get_current_user
import shutil
import os
import json

router = APIRouter(tags=["Lab Reports"])
UPLOAD_DIR = "uploads/lab_reports"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.patch("/mark_test_viewed/{test_id}", response_model=dict)
def mark_test_viewed(test_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Access forbidden")
    
    test = db.query(LabTest).filter(LabTest.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Lab test not found")
    
    test.viewed_by_doctor = True
    db.commit()
    db.refresh(test)
    return {"success": True, "test_id": test.id}
