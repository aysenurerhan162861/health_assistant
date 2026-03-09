from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import Optional

from app.models.assistant_patient_permission import AssistantPatientPermission
from app.models.user import User
from app.models.meal import Meal
from app.models.blood_pressure_tracking import BloodPressureTracking
from app.models.lab_report import LabReport
from app.models.mr_scan import MrScan


# â”€â”€ Ä°zin verme â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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


# â”€â”€ Ä°zin gÃ¼ncelleme (can_view_labs / can_view_mr) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
def update_permission(
    db: Session,
    doctor_id: int,
    assistant_id: int,
    patient_id: int,
    can_view_labs: Optional[bool] = None,
    can_view_mr: Optional[bool] = None,
):
    permission = db.query(AssistantPatientPermission).filter_by(
        doctor_id=doctor_id,
        assistant_id=assistant_id,
        patient_id=patient_id
    ).first()
    if not permission:
        raise HTTPException(status_code=404, detail="Ä°zin bulunamadÄ±.")
    if can_view_labs is not None:
        permission.can_view_labs = can_view_labs
    if can_view_mr is not None:
        permission.can_view_mr = can_view_mr
    db.commit()
    db.refresh(permission)
    return permission


# â”€â”€ Doktorun verdiÄŸi izinleri listeleme â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
def get_permissions_by_doctor(db: Session, doctor_id: int):
    permissions = db.query(AssistantPatientPermission).filter_by(
        doctor_id=doctor_id
    ).all()
    result = []
    for p in permissions:
        assistant = db.query(User).filter(User.id == p.assistant_id).first()
        patient   = db.query(User).filter(User.id == p.patient_id).first()
        result.append({
            "id":             p.id,
            "assistant_id":   p.assistant_id,
            "assistant_name": assistant.name if assistant else "-",
            "patient_id":     p.patient_id,
            "patient_name":   patient.name if patient else "-",
            "status":         p.status,
            "can_view_labs":  p.can_view_labs,
            "can_view_mr":    p.can_view_mr,
        })
    return result


# â”€â”€ AsistanÄ±n hasta listesi â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
def get_assistant_patients(db: Session, assistant_id: int):
    permissions = db.query(AssistantPatientPermission).filter_by(
        assistant_id=assistant_id,
        status="active"
    ).all()
    if not permissions:
        return []
    patient_ids = [p.patient_id for p in permissions]
    patients = db.query(User).filter(User.id.in_(patient_ids)).all()
    return patients


# â”€â”€ Ä°zni kaldÄ±rma â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
def revoke_permission(db: Session, doctor_id: int, assistant_id: int, patient_id: int):
    permission = db.query(AssistantPatientPermission).filter_by(
        doctor_id=doctor_id,
        assistant_id=assistant_id,
        patient_id=patient_id
    ).first()
    if not permission:
        raise HTTPException(status_code=404, detail="Ä°zin bulunamadÄ±")
    db.delete(permission)
    db.commit()
    return {"message": "Ä°zin baÅŸarÄ±yla kaldÄ±rÄ±ldÄ±"}


# â”€â”€ Ã–ÄŸÃ¼nler (tÃ¼m aktif izinli hastalar) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
def get_assistant_meals(db: Session, assistant_id: int):
    permissions = db.query(AssistantPatientPermission).filter_by(
        assistant_id=assistant_id,
        status="active"
    ).all()
    if not permissions:
        return []
    patient_ids = [p.patient_id for p in permissions]
    meals = (
        db.query(Meal)
        .filter(Meal.patient_id.in_(patient_ids))
        .order_by(Meal.meal_datetime.desc())
        .all()
    )
    result = []
    for meal in meals:
        patient = db.query(User).filter(User.id == meal.patient_id).first()
        meal_dict = {c.name: getattr(meal, c.name) for c in meal.__table__.columns}
        meal_dict["patient"] = {"id": patient.id, "name": patient.name} if patient else None
        result.append(meal_dict)
    return result


# â”€â”€ Tansiyon (tÃ¼m aktif izinli hastalar) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
def get_assistant_blood_pressure(db: Session, assistant_id: int):
    permissions = db.query(AssistantPatientPermission).filter_by(
        assistant_id=assistant_id,
        status="active"
    ).all()
    if not permissions:
        return []
    patient_ids = [p.patient_id for p in permissions]
    trackings = (
        db.query(BloodPressureTracking)
        .filter(BloodPressureTracking.patient_id.in_(patient_ids))
        .order_by(BloodPressureTracking.created_at.desc())
        .all()
    )
    result = []
    for t in trackings:
        patient = db.query(User).filter(User.id == t.patient_id).first()
        t_dict = {c.name: getattr(t, c.name) for c in t.__table__.columns}
        t_dict["patient"] = {"id": patient.id, "name": patient.name} if patient else None
        t_dict["measurements"] = [{"id": m.id, "measurement_time": str(m.measurement_time), "systolic": m.systolic, "diastolic": m.diastolic} for m in t.measurements]
        result.append(t_dict)
    return result


# ── Tahliller (can_view_labs=True olanlar) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
def get_assistant_labs(db: Session, assistant_id: int):
    permissions = db.query(AssistantPatientPermission).filter_by(
        assistant_id=assistant_id,
        status="active",
        can_view_labs=True
    ).all()
    if not permissions:
        return []
    patient_ids = [p.patient_id for p in permissions]
    reports = (
        db.query(LabReport)
        .filter(LabReport.patient_id.in_(patient_ids))
        .order_by(LabReport.upload_date.desc())
        .all()
    )
    result = []
    for r in reports:
        patient = db.query(User).filter(User.id == r.patient_id).first()
        r_dict = {c.name: getattr(r, c.name) for c in r.__table__.columns}
        r_dict["patient"] = {"id": patient.id, "name": patient.name} if patient else None
        result.append(r_dict)
    return result


# â”€â”€ MR TaramalarÄ± (can_view_mr=True olanlar) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
def get_assistant_mr_scans(db: Session, assistant_id: int):
    permissions = db.query(AssistantPatientPermission).filter_by(
        assistant_id=assistant_id,
        status="active",
        can_view_mr=True
    ).all()
    if not permissions:
        return []
    patient_ids = [p.patient_id for p in permissions]
    scans = (
        db.query(MrScan)
        .filter(MrScan.patient_id.in_(patient_ids))
        .order_by(MrScan.upload_date.desc())
        .all()
    )
    result = []
    for s in scans:
        patient = db.query(User).filter(User.id == s.patient_id).first()
        s_dict = {c.name: getattr(s, c.name) for c in s.__table__.columns}
        s_dict["patient"] = {"id": patient.id, "name": patient.name} if patient else None
        result.append(s_dict)
    return result
