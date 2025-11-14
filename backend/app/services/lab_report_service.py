# app/services/lab_report_service.py
from sqlalchemy.orm import Session
from app.models.lab_report import LabReport
from app.schemas.lab_report_schema import LabReportCreate
from datetime import datetime

def create_lab_report(db: Session, report_data: LabReportCreate) -> LabReport:
    """
    Yeni bir lab raporu oluşturur ve veritabanına ekler.
    """
    new_report = LabReport(
        patient_id=report_data.patient_id,
        file_name=report_data.file_name,
        file_path=report_data.file_path,
        parsed_data=report_data.parsed_data or {},  # boşsa JSON boş dict olsun
        doctor_comment=report_data.doctor_comment or None,
        upload_date=datetime.utcnow(),
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return new_report

def get_lab_reports_by_patient(db: Session, patient_id: int) -> list[LabReport]:
    """
    Verilen hasta ID'sine ait tüm lab raporlarını döner.
    """
    reports = db.query(LabReport).filter(LabReport.patient_id == patient_id).all()
    return reports
