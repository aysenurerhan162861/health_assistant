from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.lab_report_schema import LabReportCreate, LabReportResponse
from app.services.lab_report_service import create_lab_report, get_lab_reports_by_patient
from app.services.pdf_parser_service import parse_pdf_file
import shutil
import os

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
