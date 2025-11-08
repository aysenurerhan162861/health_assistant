# app/services/patient_service.py
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.doctor_patient import DoctorPatient
from app.models.user import User
from fastapi import HTTPException



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


def approve_patient(db: Session, doctor_patient_id: int, current_doctor_id: int = None):
    """
    Doktor, hastayı onayladığında status='onaylandı' olarak günceller.
    Eğer ilişki yoksa yeni kayıt oluşturur.
    """
    dp = db.query(DoctorPatient).get(doctor_patient_id)

    # Eğer kayıt zaten varsa, sadece güncelle
    if dp:
        dp.status = "onaylandı"
        db.commit()
        db.refresh(dp)
        return dp

    # Eğer kayıt yoksa (örneğin hasta tablosunda var ama ilişki oluşmamışsa)
    # O zaman yeni ilişki oluştur
    patient = db.query(User).filter(User.id == doctor_patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Hasta bulunamadı")

    if not current_doctor_id:
        raise HTTPException(status_code=400, detail="Doktor kimliği gerekli")

    new_dp = DoctorPatient(
        doctor_id=current_doctor_id,
        patient_id=patient.id,
        status="onaylandı"
    )

    db.add(new_dp)
    db.commit()
    db.refresh(new_dp)
    return new_dp


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
    Hastanın seçtiği tüm doktorları getirir (onaylı, beklemede veya reddedildi).
    """
    results = (
        db.query(DoctorPatient, User)
        .join(User, DoctorPatient.doctor_id == User.id)
        .filter(DoctorPatient.patient_id == patient_id)
        .all()
    )

    doctors = []
    for dp, doctor in results:
        doctors.append({
            "id": dp.id,  # ✅ ekledik
            "doctor_id": doctor.id,
            "doctor_name": doctor.name,
            "doctor_email": doctor.email,
            "status": dp.status,
            "note": dp.note,
        })

    return doctors

def get_approved_patient_by_id(db: Session, doctor_id: int, patient_id: int):
    """
    Doktora ait onaylanmış hastayı getirir.
    """
    # Önce doktor-hasta ilişkisinin onaylı olup olmadığını kontrol et
    dp = (
        db.query(DoctorPatient)
        .filter(
            DoctorPatient.doctor_id == doctor_id,
            DoctorPatient.patient_id == patient_id,
            DoctorPatient.status == "onaylandı"
        )
        .first()
    )

    if not dp:
        raise HTTPException(status_code=404, detail="Onaylanmış hasta bulunamadı")

    # Hasta bilgilerini getir
    patient = db.query(User).filter(User.id == patient_id).first()

    if not patient:
        raise HTTPException(status_code=404, detail="Hasta bilgisi bulunamadı")

    # Dönen obje: hem hasta bilgileri hem not gibi ilişki detayları
    return {
        "id": patient.id,
        "name": patient.name,
        "email": patient.email,
        "phone": patient.phone,
        "age": patient.age,
        "gender": patient.gender,
        "chronic_diseases": patient.chronic_diseases,
        "note": dp.note,
    }

def delete_doctor_for_patient(db: Session, patient_id: int, doctor_id: int):
    """
    Hastanın kendi doktor bağlantısını silmesi.
    """
    link = (
        db.query(DoctorPatient)
        .filter(DoctorPatient.patient_id == patient_id, DoctorPatient.doctor_id == doctor_id)
        .first()
    )

    if not link:
        return None

    db.delete(link)
    db.commit()
    return True