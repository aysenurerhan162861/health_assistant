from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.services import assistant_service
from app.schemas.doctor_patient import GrantPermissionRequest
from app.utils.auth import verify_token
from app.models.user import User

router = APIRouter(tags=["Assistants"])


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


def get_current_user(
    token_header: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
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
    return user


 #── Asistan veri endpoint'leri ───────────────────────────────────────

@router.get("/me/doctor")
def get_my_doctor(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Asistanın bağlı olduğu doktoru döner."""
    if not current_user.parent_id:
        raise HTTPException(status_code=404, detail="Bağlı doktor bulunamadı.")
    doctor = db.query(User).filter(User.id == current_user.parent_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doktor bulunamadı.")
    return {"doctor_id": doctor.id, "doctor_name": doctor.name}

@router.get("/me/meals")
def get_assistant_meals(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Asistanın izinli hastalarının öğünleri."""
    return assistant_service.get_assistant_meals(db, current_user_id)


@router.get("/me/blood-pressure")
def get_assistant_blood_pressure(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Asistanın izinli hastalarının tansiyon kayıtları."""
    return assistant_service.get_assistant_blood_pressure(db, current_user_id)


@router.get("/me/labs")
def get_assistant_labs(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Asistanın can_view_labs=True olan hastalarının tahlilleri."""
    return assistant_service.get_assistant_labs(db, current_user_id)


@router.get("/me/mr-scans")
def get_assistant_mr_scans(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Asistanın can_view_mr=True olan hastalarının MR'ları."""
    return assistant_service.get_assistant_mr_scans(db, current_user_id)

# ── Asistana hasta izni verme ────────────────────────────────────────
@router.post("/{doctor_id}/grant_permission")
def grant_permission_to_assistant(
    doctor_id: int,
    request: GrantPermissionRequest,
    db: Session = Depends(get_db)
):
    permission = assistant_service.grant_permission(
        db, doctor_id, request.assistant_id, request.patient_id
    )

    # 🔔 Asistana bildirim (sync notify)
    try:
        from app.services.notification_service import notify
        doctor = db.query(User).filter(User.id == doctor_id).first()
        doctor_name = doctor.name if doctor else f"Doktor #{doctor_id}"
        notify(
            db=db,
            user_id=request.assistant_id,
            event="assistant_patient_assigned",
            title="Yeni Hasta Erişimi",
            body=f"{doctor_name} size hasta #{request.patient_id} için erişim izni verdi."
        )
    except Exception:
        pass  # Bildirim başarısız olsa bile akışı bozma

    return {"message": "Hasta asistana başarıyla atandı", "permission": permission}


# ── Asistanın hastalarını görmesi ────────────────────────────────────
@router.get("/{assistant_id}/patients")
def get_assistant_patients(assistant_id: int, db: Session = Depends(get_db)):
    return assistant_service.get_assistant_patients(db, assistant_id)


# ── İzni kaldırma ────────────────────────────────────────────────────
@router.delete("/{doctor_id}/revoke_permission")
def revoke_permission(
    doctor_id: int,
    request: GrantPermissionRequest,
    db: Session = Depends(get_db)
):
    result = assistant_service.revoke_permission(
        db, doctor_id, request.assistant_id, request.patient_id
    )
    return {"message": "Hasta asistan izni kaldırıldı", "result": result}


# ── Tahlil/MR izni güncelleme (doktor yapar) ─────────────────────────
@router.patch("/{doctor_id}/update_permission")
def update_assistant_permission(
    doctor_id: int,
    request: dict,
    db: Session = Depends(get_db)
):
    """
    Body: { assistant_id, patient_id, can_view_labs, can_view_mr }
    """
    result = assistant_service.update_permission(
        db=db,
        doctor_id=doctor_id,
        assistant_id=request["assistant_id"],
        patient_id=request["patient_id"],
        can_view_labs=request.get("can_view_labs"),
        can_view_mr=request.get("can_view_mr"),
    )

    # 🔔 Asistana erişim yetkisi güncellemesi bildirimi
    try:
        from app.services.notification_service import notify
        doctor = db.query(User).filter(User.id == doctor_id).first()
        doctor_name = doctor.name if doctor else f"Doktor #{doctor_id}"
        patient_id = request["patient_id"]
        parts = []
        if request.get("can_view_labs") is not None:
            parts.append("tahlil" if request["can_view_labs"] else "tahlil erişimi kaldırıldı")
        if request.get("can_view_mr") is not None:
            parts.append("MR" if request["can_view_mr"] else "MR erişimi kaldırıldı")
        detail = ", ".join(parts) if parts else "erişim izni"
        notify(
            db=db,
            user_id=request["assistant_id"],
            event="assistant_patient_assigned",
            title="Erişim İzni Güncellendi",
            body=f"{doctor_name} hasta #{patient_id} için {detail} izninizi güncelledi."
        )
    except Exception:
        pass

    return {"message": "İzinler güncellendi", "permission": result}


# ── Asistanın izinlerini listeleme ───────────────────────────────────
@router.get("/{doctor_id}/permissions")
def get_doctor_assistant_permissions(doctor_id: int, db: Session = Depends(get_db)):
    """Doktorun verdiği tüm asistan izinlerini döner."""
    return assistant_service.get_permissions_by_doctor(db, doctor_id)


