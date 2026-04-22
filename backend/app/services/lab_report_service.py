# app/services/lab_report_service.py
from sqlalchemy.orm import Session, selectinload
from app.models.lab_report import LabReport
from app.schemas.lab_report_schema import LabReportCreate
from datetime import datetime
from app.models.doctor_patient import DoctorPatient
from app.models.lab_test import LabTest

def create_lab_report(db: Session, report_data: LabReportCreate):
    parsed_data = report_data.parsed_data or {"tests": []}

    report = LabReport(
        patient_id=report_data.patient_id,
        file_name=report_data.file_name,
        file_path=report_data.file_path,
        parsed_data=parsed_data
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    # PDF'ten çıkarılan testleri LabTest olarak ekle
    for test in parsed_data.get("tests", []):
        lab_test = LabTest(
            lab_report_id=report.id,
            name=test["name"],
            value=str(test["value"]),
            unit=test.get("unit"),
            normal_range=test.get("normal_range"),
        )
        db.add(lab_test)
    db.commit()

    # Bildirimler async context'te (lab_report_controller) gönderiliyor.
    return report

def get_lab_reports_by_patient(db: Session, patient_id: int) -> list[LabReport]:
    """
    Verilen hasta ID'sine ait tüm lab raporlarını döner.
    """
    reports = db.query(LabReport).filter(LabReport.patient_id == patient_id).all()
    return reports

def get_lab_reports_by_doctor(db: Session, doctor_id: int) -> list[LabReport]:
    """
    Doktorun onaylı hastalarına ait tüm lab raporlarını döner.
    """
    reports = (
        db.query(LabReport)
        .join(DoctorPatient, LabReport.patient_id == DoctorPatient.patient_id)
        .filter(DoctorPatient.doctor_id == doctor_id)
        .filter(DoctorPatient.status == "onaylandı")  # sadece onaylı hastalar
        .options(selectinload(LabReport.patient))  # <-- Burayı ekledik!
        .all()
    )
    return reports

