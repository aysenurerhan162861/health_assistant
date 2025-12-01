from fastapi import APIRouter, Depends, UploadFile, File, Form, Body, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.lab_report_schema import LabReportCreate, LabReportResponse
from app.services.lab_report_service import create_lab_report, get_lab_reports_by_patient, get_lab_reports_by_doctor
from app.services.pdf_parser_service import parse_pdf_file
from app.models.lab_report import LabReport
from app.schemas.lab_report_schema import LabReportUpdateComment  
from app.models.user import User
from app.services.user_service import get_current_user
import shutil
import os
import json

router = APIRouter(tags=["Lab Reports"])
UPLOAD_DIR = "uploads/lab_reports"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=LabReportResponse)
def upload_lab_report(
    patient_id: int = Form(...),  # <- burayı Form(...) ile değiştir
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    parsed_data = parse_pdf_file(file_path)
    print("Parsed Data:", parsed_data)

     # PDF parse edilen testlere viewedByDoctor: False ekle
    for test in parsed_data.get("tests", []):
        test["viewedByDoctor"] = False

    report_data = LabReportCreate(
        patient_id=patient_id,
        file_name=file.filename,
        file_path=file_path,
        parsed_data=parsed_data,
    )

    report = create_lab_report(db, report_data)
    return report

@router.get("/patient/{patient_id}", response_model=list[LabReportResponse])
def list_patient_reports(patient_id: int, db: Session = Depends(get_db)):
    return get_lab_reports_by_patient(db, patient_id)

# 👨‍⚕️ Doktor açıklama ekliyor
@router.patch("/update_comment/{report_id}", response_model=LabReportResponse)
def update_comment(report_id: int, comment_data: LabReportUpdateComment, db: Session = Depends(get_db)):
    report = db.query(LabReport).filter(LabReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Lab report not found")
    report.doctor_comment = comment_data.doctor_comment
    db.commit()
    db.refresh(report)
    return report

@router.get("/doctor/my_patients", response_model=list[LabReportResponse])
def list_doctor_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Doktorun onaylı hastalarına ait tüm lab raporlarını döner.
    """
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Access forbidden")

    reports = get_lab_reports_by_doctor(db, current_user.id)
    return reports

@router.patch("/mark_viewed/{report_id}", response_model=dict)
def mark_lab_report_viewed(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Access forbidden")

    report = db.query(LabReport).filter(LabReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Lab report not found")

    parsed_data = report.parsed_data or {"tests": []}
    for test in parsed_data.get("tests", []):
        test["viewedByDoctor"] = True

    report.parsed_data = parsed_data
    db.commit()
    db.refresh(report)

    return {"success": True, "report_id": report.id}

@router.patch("/reports/{report_id}/mark_viewed", response_model=dict)
def mark_report_viewed(
    report_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Access forbidden")

    report = db.query(LabReport).filter(LabReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Lab report not found")

    report.viewed_by_doctor = True
    db.commit()
    db.refresh(report)

    return JSONResponse(content={"success": True, "report_id": report.id})
