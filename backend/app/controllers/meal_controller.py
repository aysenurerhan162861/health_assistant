from datetime import datetime
import os
import shutil
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.user_service import get_current_user
from app.services.meal_service import (
    create_meal,
    list_meals,
    analyze_meal_for_meal,
    update_meal_doctor_comment,
    get_doctor_patient_meals,
    get_doctor_meals,
    get_nutrition_trends_analysis,
)
from app.schemas.meal_schema import MealResponse, MealUpdateComment
from app.schemas.doctor_patient import MealNotificationSetting
from app.models.doctor_patient import DoctorPatient
from app.models.user import User, UserRole

router = APIRouter(tags=["Meals"])

UPLOAD_DIR = "uploads/meals"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_MEAL_TYPES = {"sabah", "ogle", "aksam", "ara", "diger"}


def _is_citizen(user: User) -> bool:
    role = user.role
    if isinstance(role, UserRole):
        return role == UserRole.CITIZEN
    return str(role).lower() == "citizen"


def _is_doctor(user: User) -> bool:
    role = user.role
    if isinstance(role, UserRole):
        return role == UserRole.DOCTOR
    return str(role).lower() == "doctor"


def _parse_meal_datetime(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="meal_datetime ISO formatında olmalı (örnek: 2025-12-15T08:30:00)",
        )


@router.post("/create", response_model=MealResponse)
async def add_meal(
    meal_type: str = Form(...),
    text_description: Optional[str] = Form(None),
    meal_datetime: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Sadece hasta rolü için izin ver
    if not _is_citizen(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sadece hastalar öğün ekleyebilir.")

    normalized_meal_type = meal_type.strip().lower()
    if normalized_meal_type not in ALLOWED_MEAL_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Geçersiz öğün tipi.")

    # Diğer seçeneğinde tarih-saat zorunlu
    parsed_meal_datetime = _parse_meal_datetime(meal_datetime)
    if normalized_meal_type == "diger" and not parsed_meal_datetime:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Diğer seçeneğinde tarih-saat zorunludur.")

    saved_image_path = None
    if image:
        if not image.filename:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Geçersiz dosya.")
        unique_name = f"{uuid.uuid4().hex}_{image.filename}"
        saved_image_path = os.path.join(UPLOAD_DIR, unique_name)
        with open(saved_image_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

    try:
        meal = create_meal(
            db=db,
            patient=current_user,
            meal_type=normalized_meal_type,
            meal_datetime=parsed_meal_datetime,
            text_description=text_description,
            image_path=saved_image_path,
        )
    except ValueError as exc:
        # Geri sarma: foto kaydedildiyse ama hata olduysa sil
        if saved_image_path and os.path.exists(saved_image_path):
            os.remove(saved_image_path)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    # 🔔 Doktor ve asistanlara bildirim
    from app.services.notification_service import notify_event
    from app.models.doctor_patient import AssistantPermission

    doctor_relation = db.query(DoctorPatient).filter(
        DoctorPatient.patient_id == current_user.id,
        DoctorPatient.status == "onaylandı"
    ).first()
    if doctor_relation:
        await notify_event(
            db=db,
            user_id=doctor_relation.doctor_id,
            event_name="meal_uploaded",
            title="Hasta Öğün Ekledi",
            body=f"{current_user.name} yeni bir öğün kaydı ekledi."
        )
        # Asistanlara da bildirim
        try:
            from app.models.assistant_patient_permission import AssistantPatientPermission
            assistants = db.query(AssistantPatientPermission).filter(
                AssistantPatientPermission.patient_id == current_user.id,
                AssistantPatientPermission.status == "active"
            ).all()
            for ap in assistants:
                await notify_event(
                    db=db,
                    user_id=ap.assistant_id,
                    event_name="meal_uploaded",
                    title="Hasta Öğün Ekledi",
                    body=f"{current_user.name} yeni bir öğün kaydı ekledi."
                )
        except Exception:
            pass

    return meal


@router.get("/my", response_model=list[MealResponse])
def list_my_meals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not _is_citizen(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sadece hastalar öğünlerini görebilir.")
    return list_meals(db, current_user.id)


@router.post("/{meal_id}/analyze", response_model=MealResponse)
def analyze_meal_for_user_meal(
    meal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not _is_citizen(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sadece hastalar öğün analizi isteyebilir.")
    try:
        meal = analyze_meal_for_meal(db, patient=current_user, meal_id=meal_id)
        return meal
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        # Beklenmeyen hatalar için
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI analizi sırasında bir hata oluştu: {str(exc)}"
        ) from exc


@router.get("/doctor/all", response_model=list[MealResponse])
def get_all_doctor_meals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Doktorun onaylı tüm hastalarının öğünlerini getirir."""
    if not _is_doctor(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sadece doktorlar erişebilir.")
    
    return get_doctor_meals(db, current_user.id)


@router.get("/doctor/patients/{patient_id}/meals", response_model=list[MealResponse])
def get_patient_meals_for_doctor(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Doktor, onaylı hastasının öğünlerini görüntüler."""
    if not _is_doctor(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sadece doktorlar erişebilir.")
    
    try:
        meals = get_doctor_patient_meals(db, current_user.id, patient_id)
        return meals
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.patch("/{meal_id}/doctor-comment", response_model=MealResponse)
def update_doctor_comment(
    meal_id: int,
    comment_data: MealUpdateComment,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Doktor, öğüne yorum ekler/günceller."""
    if not _is_doctor(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sadece doktorlar yorum ekleyebilir.")
    
    try:
        meal = update_meal_doctor_comment(db, meal_id, comment_data.doctor_comment)
        
        # 🔔 Bildirim: Hasta için
        from app.services.notification_service import notify
        notify(
            db=db,
            user_id=meal.patient_id,
            event="doctor_comment",
            title="Doktor Yorum Ekledi",
            body=f"{current_user.name} öğününüz için yorum yaptı.",
            metadata={"meal_id": meal.id}
        )
        
        return meal
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/doctor/patients/{patient_id}/meal-notification", response_model=MealNotificationSetting)
def get_meal_notification_setting(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Doktor, hastası için öğün bildirim ayarını getirir."""
    if not _is_doctor(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sadece doktorlar erişebilir.")
    
    relation = (
        db.query(DoctorPatient)
        .filter(
            DoctorPatient.doctor_id == current_user.id,
            DoctorPatient.patient_id == patient_id,
            DoctorPatient.status == "onaylandı"
        )
        .first()
    )
    
    if not relation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bu hasta size ait değil veya onaylanmamış.")
    
    return MealNotificationSetting(
        meal_notification_enabled=relation.meal_notification_enabled if hasattr(relation, 'meal_notification_enabled') else True
    )


@router.patch("/doctor/patients/{patient_id}/meal-notification", response_model=MealNotificationSetting)
def update_meal_notification_setting(
    patient_id: int,
    setting: MealNotificationSetting,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Doktor, hastası için öğün bildirim ayarını günceller."""
    if not _is_doctor(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sadece doktorlar erişebilir.")
    
    relation = (
        db.query(DoctorPatient)
        .filter(
            DoctorPatient.doctor_id == current_user.id,
            DoctorPatient.patient_id == patient_id,
            DoctorPatient.status == "onaylandı"
        )
        .first()
    )
    
    if not relation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bu hasta size ait değil veya onaylanmamış.")
    
    relation.meal_notification_enabled = setting.meal_notification_enabled
    db.commit()
    db.refresh(relation)
    
    return MealNotificationSetting(meal_notification_enabled=relation.meal_notification_enabled)


@router.get("/trends/analysis")
def get_nutrition_trends(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Hastanın son 30 günlük beslenme trend analizini getirir."""
    if not _is_citizen(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sadece hastalar erişebilir.")
    
    try:
        analysis = get_nutrition_trends_analysis(db, current_user)
        return analysis
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Trend analizi sırasında bir hata oluştu: {str(exc)}"
        ) from exc


@router.get("/trends/analysis/{patient_id}")
def get_patient_nutrition_trends(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Doktor, hastasının son 30 günlük beslenme trend analizini getirir."""
    if not _is_doctor(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sadece doktorlar erişebilir.")
    
    # Doktor-hasta ilişkisini kontrol et
    from app.models.doctor_patient import DoctorPatient
    relation = (
        db.query(DoctorPatient)
        .filter(
            DoctorPatient.doctor_id == current_user.id,
            DoctorPatient.patient_id == patient_id,
            DoctorPatient.status == "onaylandı"
        )
        .first()
    )
    
    if not relation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bu hasta size ait değil veya onaylanmamış."
        )
    
    # Hasta bilgisini getir
    patient = db.query(User).filter(User.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hasta bulunamadı.")
    
    try:
        analysis = get_nutrition_trends_analysis(db, patient)
        return analysis
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Trend analizi sırasında bir hata oluştu: {str(exc)}"
        ) from exc

