import os
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.mr_scan import MrScan
from app.models.doctor_patient import DoctorPatient
from app.schemas.mr_schema import MrScanResult, MrScanList
from app.utils.auth import verify_token
from app.models.user import User
from fastapi.responses import FileResponse

router = APIRouter()

UPLOAD_DIR = "uploads/mr_scans"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def get_current_user_id(
    token_header: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> int:
    if not token_header:
        raise HTTPException(status_code=401, detail="Token gerekli.")
    token = token_header.replace("Bearer ", "")
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Geçersiz token.")
    email = payload.get("sub")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
    return user.id

@router.get("/{scan_id}/gradcam")
def get_gradcam(scan_id: int, db: Session = Depends(get_db)):
    """Attention haritası (XAI görselleştirme) PNG döndür."""
    scan = db.query(MrScan).filter(MrScan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="MR taraması bulunamadı.")
    if not scan.gradcam_path or not os.path.exists(scan.gradcam_path):
        raise HTTPException(status_code=404, detail="Attention haritası henüz oluşturulmadı.")
    return FileResponse(scan.gradcam_path, media_type="image/png")


@router.post("/upload", response_model=MrScanResult)
async def upload_mr_scan(
    patient_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not (file.filename.endswith(".nii") or file.filename.endswith(".nii.gz")):
        raise HTTPException(status_code=400, detail="Sadece .nii veya .nii.gz dosyaları kabul edilir.")

    file_path = os.path.join(UPLOAD_DIR, f"{patient_id}_{file.filename}")
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    scan = MrScan(
        patient_id=patient_id,
        file_name=file.filename,
        file_path=file_path,
        status="pending"
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)

    from app.tasks.mr_tasks import analyze_mr
    analyze_mr.delay(scan.id, file_path, patient_id)

    return scan


@router.get("/patient/{patient_id}", response_model=list[MrScanList])
def get_patient_scans(patient_id: int, db: Session = Depends(get_db)):
    return (
        db.query(MrScan)
        .filter(MrScan.patient_id == patient_id)
        .order_by(MrScan.upload_date.desc())
        .all()
    )

@router.get("/doctor/me", response_model=list[MrScanList])
def get_my_patient_scans(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Token'daki doktorun onaylı hastalarına ait tüm MR taramalarını listele."""
    return (
        db.query(MrScan)
        .join(DoctorPatient, MrScan.patient_id == DoctorPatient.patient_id)
        .filter(DoctorPatient.doctor_id == current_user_id)
        .filter(DoctorPatient.status == "onaylandı")
        .order_by(MrScan.upload_date.desc())
        .all()
    )


@router.get("/doctor/{doctor_id}", response_model=list[MrScanList])
def get_doctor_scans(doctor_id: int, db: Session = Depends(get_db)):
    return (
        db.query(MrScan)
        .join(DoctorPatient, MrScan.patient_id == DoctorPatient.patient_id)
        .filter(DoctorPatient.doctor_id == doctor_id)
        .filter(DoctorPatient.status == "onaylandı")
        .order_by(MrScan.upload_date.desc())
        .all()
    )

@router.patch("/{scan_id}/doctor-comment", response_model=MrScanResult)
def update_doctor_comment(
    scan_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Doktor yorumu ekle veya güncelle."""
    scan = db.query(MrScan).filter(MrScan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="MR taraması bulunamadı.")
    scan.doctor_comment = payload.get("doctor_comment", "")
    scan.viewed_by_doctor = True
    db.commit()
    db.refresh(scan)
    return scan


@router.get("/{scan_id}", response_model=MrScanResult)
def get_scan_detail(scan_id: int, db: Session = Depends(get_db)):
    scan = db.query(MrScan).filter(MrScan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="MR taraması bulunamadı.")
    return scan

@router.get("/{scan_id}/file")
def download_mr_file(scan_id: int, db: Session = Depends(get_db)):
    scan = db.query(MrScan).filter(MrScan.id == scan_id).first()
    if not scan or not os.path.exists(scan.file_path):
        raise HTTPException(status_code=404, detail="Dosya bulunamadı.")
    return FileResponse(scan.file_path, filename=scan.file_name, media_type="application/octet-stream")