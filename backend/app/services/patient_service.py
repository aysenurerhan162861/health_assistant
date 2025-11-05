# app/services/patient_service.py
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.doctor_patient import DoctorPatient
from app.models.user import User


def select_doctor_for_patient(db: Session, doctor_id: int, patient_id: int, note: str = None):
    """
    Hasta bir doktor seçtiğinde yeni ilişki kaydı oluşturur.
    Aynı doktor-hasta çifti daha önce eklenmişse tekrar eklemez.
    """
    existing = (
        db.query(DoctorPatient)
        .filter(DoctorPatient.doctor_id == doctor_id, DoctorPatient.patient_id == patient_id)
        .first()
    )

    if existing:
        return existing  # zaten varsa yeniden ekleme

    dp = DoctorPatient(
        doctor_id=doctor_id,
        patient_id=patient_id,
        status="beklemede",
        note=note,
    )

    db.add(dp)
    try:
        db.commit()
        db.refresh(dp)
    except IntegrityError:
        db.rollback()
        raise
    return dp


def get_pending_patients(db: Session, doctor_id: int):
    """
    Doktorun onay bekleyen hastalarını getirir.
    """
    results = (
        db.query(DoctorPatient, User)
        .join(User, DoctorPatient.patient_id == User.id)
        .filter(DoctorPatient.doctor_id == doctor_id, DoctorPatient.status == "beklemede")
        .all()
    )

    patients = []
    for dp, user in results:
        patients.append({
            "id": dp.id,
            "patient_id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "profile_image": user.profile_image,
            "status": dp.status,
            "note": dp.note,
        })
    return patients


def approve_patient(db: Session, doctor_patient_id: int):
    """
    Doktor, hastayı onayladığında status='onaylandı' olarak günceller.
    """
    dp = db.query(DoctorPatient).get(doctor_patient_id)
    if dp:
        dp.status = "onaylandı"
        db.commit()
        db.refresh(dp)
        return dp
    return None


def reject_patient(db: Session, doctor_patient_id: int):
    """
    Doktor, hastayı reddettiğinde status='reddedildi' olarak günceller.
    """
    dp = db.query(DoctorPatient).get(doctor_patient_id)
    if dp:
        dp.status = "reddedildi"
        db.commit()
        db.refresh(dp)
        return dp
    return None


def get_doctor_patients(db: Session, doctor_id: int, status: str = "onaylandı"):
    """
    Doktorun onaylanmış hastalarını getirir.
    """
    results = (
        db.query(DoctorPatient, User)
        .join(User, DoctorPatient.patient_id == User.id)
        .filter(DoctorPatient.doctor_id == doctor_id, DoctorPatient.status == status)
        .all()
    )

    patients = []
    for dp, user in results:
        patients.append({
            "id": dp.id,
            "patient_id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "profile_image": user.profile_image,
            "status": dp.status,
            "note": dp.note,
        })
    return patients

def get_selected_doctor(db: Session, patient_id: int):
    """
    Hastanın seçtiği doktoru ve ilişki durumunu getirir.
    """
    result = (
        db.query(DoctorPatient, User)
        .join(User, DoctorPatient.doctor_id == User.id)
        .filter(DoctorPatient.patient_id == patient_id)
        .first()
    )

    if result:
        dp, doctor = result
        return {
            "doctor_id": doctor.id,
            "doctor_name": doctor.name,
            "doctor_email": doctor.email,
            "status": dp.status,
            "note": dp.note,
        }
    return None