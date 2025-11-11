from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.assistant_patient_permission import AssistantPatientPermission
from app.models.user import User


# 🟢 Asistana hasta izni verme
def grant_permission(db: Session, doctor_id: int, assistant_id: int, patient_id: int):
    existing = db.query(AssistantPatientPermission).filter_by(
        doctor_id=doctor_id,
        assistant_id=assistant_id,
        patient_id=patient_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Bu izin zaten mevcut")

    permission = AssistantPatientPermission(
        doctor_id=doctor_id,
        assistant_id=assistant_id,
        patient_id=patient_id
    )
    db.add(permission)
    db.commit()
    db.refresh(permission)
    return permission


# 🔵 Asistanın hastalarını listeleme
def get_assistant_patients(db: Session, assistant_id: int):
    # 1️⃣ Asistanın izin verdiği hastaları alıyoruz (sadece aktif olanlar)
    permissions = db.query(AssistantPatientPermission).filter_by(
        assistant_id=assistant_id,
        status="active"
    ).all()

    if not permissions:
        return []  # izinli hasta yoksa boş liste dön

    # 2️⃣ İzinli hasta ID'lerini çıkarıyoruz
    patient_ids = [p.patient_id for p in permissions]

    # 3️⃣ User tablosundan bu ID'lere karşılık gelen hastaları çekiyoruz
    patients = db.query(User).filter(User.id.in_(patient_ids)).all()

    return patients

# 🔴 Doktorun izni kaldırması
def revoke_permission(db: Session, doctor_id: int, assistant_id: int, patient_id: int):
    permission = db.query(AssistantPatientPermission).filter_by(
        doctor_id=doctor_id,
        assistant_id=assistant_id,
        patient_id=patient_id
    ).first()

    if not permission:
        raise HTTPException(status_code=404, detail="İzin bulunamadı")

    db.delete(permission)
    db.commit()
    return {"message": "İzin başarıyla kaldırıldı"}
