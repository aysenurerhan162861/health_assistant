from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.lab_report_schema import LabReportCreate, LabReportResponse, LabReportUpdateComment
from app.services.lab_report_service import create_lab_report, get_lab_reports_by_patient, get_lab_reports_by_doctor
from app.services.pdf_parser_service import parse_pdf_file
from app.models.lab_report import LabReport
from app.models.user import User
from app.models.doctor_patient import DoctorPatient
from app.services.user_service import get_current_user
from app.services.notification_service import notify_event
from fastapi.responses import JSONResponse, FileResponse
import shutil
import os

router = APIRouter(tags=["Lab Reports"])
UPLOAD_DIR = "uploads/lab_reports"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# -----------------------------
# Hasta tahlil yükleme
# -----------------------------
@router.post("/upload", response_model=LabReportResponse)
async def upload_lab_report(
    patient_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Dosya kontrolü
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    print(f"Uploading report for patient {patient_id}, file: {file.filename}")

    # Dosyayı kaydet
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # PDF parse
    parsed_data = parse_pdf_file(file_path) or {"tests": []}
    for test in parsed_data.get("tests", []):
        test["viewedByDoctor"] = False

    # DB kaydı
    report_data = LabReportCreate(
        patient_id=patient_id,
        file_name=file.filename,
        file_path=file_path,
        parsed_data=parsed_data,
    )
    report = create_lab_report(db, report_data)

    # 🔔 Doktor için bildirim
    doctor_relation = db.query(DoctorPatient).filter(DoctorPatient.patient_id == patient_id).first()
    if doctor_relation:
        await notify_event(   # ← burası artık await ediliyor
            db=db,
            user_id=doctor_relation.doctor_id,
            event_name="lab_uploaded",
            title="Yeni Tahlil Yüklendi",
            body=f"Hasta yeni bir tahlil yükledi: {file.filename}"
        )

    return report
# Hasta kendi raporlarını listeler
# -----------------------------
@router.get("/patient/{patient_id}", response_model=list[LabReportResponse])
def list_patient_reports(patient_id: int, db: Session = Depends(get_db)):
    return get_lab_reports_by_patient(db, patient_id)

# -----------------------------
# Doktor açıklama ekliyor
# -----------------------------
@router.patch("/update_comment/{report_id}", response_model=LabReportResponse)
def update_comment(
    report_id: int,
    comment_data: LabReportUpdateComment,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = db.query(LabReport).filter(LabReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Lab report not found")

    report.doctor_comment = comment_data.doctor_comment
    db.commit()
    db.refresh(report)

    # 🔔 Bildirim: Hasta için
    notify_event(
        db=db,
        user_id=report.patient_id,
        event_name="doctor_comment",
        title="Doktor Yorum Ekledi",
        body=f"{current_user.name} tahliliniz için yorum yaptı."
    )

    return report

# -----------------------------
# Doktorun kendi hastalarının raporları
# -----------------------------
@router.get("/doctor/my_patients", response_model=list[LabReportResponse])
def list_doctor_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Access forbidden")
    reports = get_lab_reports_by_doctor(db, current_user.id)
    return reports

# -----------------------------
# Doktor raporu işaretliyor (viewed)
# -----------------------------
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
    report.viewed_by_doctor = True
    db.commit()
    db.refresh(report)

    return {"success": True, "report_id": report.id}

@router.get("/unread_lab_count")
def unread_lab_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "doctor":
        return {"count": 0}

    count = (
        db.query(LabReport)
        .join(DoctorPatient, DoctorPatient.patient_id == LabReport.patient_id)
        .filter(DoctorPatient.doctor_id == current_user.id)
        .filter(LabReport.viewed_by_doctor.is_(False))
        .count()
    )

    return {"count": count}

@router.get("/file/{report_id}")
async def get_file(report_id: int, db: Session = Depends(get_db)):
    report = db.query(LabReport).filter(LabReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    file_path = f"/app/uploads/lab_reports/{report.file_name}"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        path=file_path,
        filename=report.file_name,
        media_type="application/pdf"   # ← BUNU EKLE
    )