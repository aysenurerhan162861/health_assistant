# app/controllers/patient_controller.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.services.patient_service import (
    select_doctor_for_patient,
    get_pending_patients,
    approve_patient,
    reject_patient,
    get_doctor_patients,
    get_selected_doctor,
    get_approved_patient_by_id
)
from app.database import get_db
from app.models.user import User
from app.services.user_service import get_current_user
from app.schemas.doctor_patient import PatientSelect, PatientOut, DoctorOut

router = APIRouter()

# 🩺 Hasta doktor seçiyor
@router.post("/select-doctor")
def select_doctor(
    payload: PatientSelect,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dp = select_doctor_for_patient(db, payload.doctor_id, current_user.id, payload.note)
    return {"message": "Doktor başarıyla seçildi", "status": dp.status}


# ⏳ Doktor onay bekleyen hastaları görüyor
@router.get("/pending", response_model=List[PatientOut])
def pending_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.lower() != "doctor":
        raise HTTPException(status_code=403, detail="Sadece doktorlar görebilir")
    return get_pending_patients(db, current_user.id)


# ✅ Doktor hastayı onaylıyor
@router.post("/approve/{dp_id}", response_model=PatientOut)
def approve(
    dp_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dp = approve_patient(db, dp_id, current_doctor_id=current_user.id)
    if not dp:
        raise HTTPException(status_code=404, detail="Hasta bulunamadı")

    patient = db.query(User).filter(User.id == dp.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Hasta bilgisi bulunamadı")

    return {
        "id": patient.id,
        "name": patient.name,
        "email": patient.email,
        "phone": patient.phone,
        "note": dp.note,
    }


# ❌ Doktor hastayı reddediyor
@router.post("/reject/{dp_id}", response_model=PatientOut)
def reject(
    dp_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dp = reject_patient(db, dp_id)
    if not dp:
        raise HTTPException(status_code=404, detail="Hasta bulunamadı")

    patient = db.query(User).filter(User.id == dp.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Hasta bilgisi bulunamadı")

    return {
        "id": patient.id,
        "name": patient.name,
        "email": patient.email,
        "phone": patient.phone,
        "note": dp.note,
    }


# 👩‍⚕️ Doktor kendi hastalarını listeliyor
@router.get("/my-patients", response_model=List[PatientOut])
def my_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.lower() != "doctor":
        raise HTTPException(status_code=403, detail="Sadece doktorlar görebilir")
    return get_doctor_patients(db, current_user.id)


# 👨‍⚕️ Sistemdeki tüm doktorları getir
@router.get("/doctors", response_model=List[DoctorOut])
def get_doctors(db: Session = Depends(get_db)):
    doctors = db.query(User).filter(User.role == "DOCTOR").all()
    return doctors


# 🟢 Doktorun onayladığı hastalar
@router.get("/approved", response_model=List[PatientOut])
def approved_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.lower() != "doctor":
        raise HTTPException(status_code=403, detail="Sadece doktorlar görebilir")

    patients = get_doctor_patients(db, current_user.id, status="onaylandı")
    return patients


@router.get("/my-doctor")
def get_my_doctor(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Hastanın seçtiği doktorun bilgilerini getirir.
    """
    doctor_info = get_selected_doctor(db, current_user.id)  # ✅ düzeltildi
    if not doctor_info:
        return {"message": "Henüz bir doktor seçmediniz."}
    return doctor_info

@router.get("/approved/{patient_id}")
def get_approved_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Doktora bağlı onaylanmış hastayı getirir.
    """
    if current_user.role.lower() != "doctor":
        raise HTTPException(status_code=403, detail="Sadece doktorlar görebilir")

    return get_approved_patient_by_id(db, current_user.id, patient_id)