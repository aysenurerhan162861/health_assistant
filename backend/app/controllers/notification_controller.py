from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.services.user_service import get_current_user
from app.models.user import User
from app.models.notification import NotificationSetting, UserFcmToken, NotificationHistory
from app.schemas.notification_schema import NotificationSettingSchema, FcmTokenSchema, NotificationHistorySchema

router = APIRouter(
    tags=["Notifications"]
)

@router.get("/settings", response_model=List[NotificationSettingSchema])
def get_settings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Role bazlı default eventler
    role = (current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)).lower()
    if role in ("doctor", "doktor"):
        default_events = [
            "lab_uploaded",
            "meal_uploaded",
            "blood_pressure_completed",
            "mr_uploaded",
            "patient_selected_doctor",
        ]
    elif role in ("assistant", "asistan"):
        default_events = [
            "assistant_patient_assigned",
            "lab_uploaded",
            "meal_uploaded",
            "blood_pressure_completed",
            "mr_uploaded",
        ]
    else:  # citizen / hasta
        default_events = [
            "doctor_approved_patient",
            "doctor_comment",
        ]

    # Kullanıcının kayıtlı ayarlarını al
    settings = db.query(NotificationSetting).filter(NotificationSetting.user_id == current_user.id).all()
    existing_events = {s.event_name for s in settings}
    missing_events = [e for e in default_events if e not in existing_events]

    # Eksik eventleri DB'ye ekle
    for event in missing_events:
        new_setting = NotificationSetting(
            user_id=current_user.id,
            event_name=event,
            push_enabled=True,
            email_enabled=True
        )
        db.add(new_setting)
        settings.append(new_setting)

    if missing_events:
        db.commit()

    # Tüm eventleri döndür
    return [
        NotificationSettingSchema(
            event_name=s.event_name,
            push_enabled=s.push_enabled,
            email_enabled=s.email_enabled
        )
        for s in settings
        if s.event_name in default_events  # ekstra güvenlik
    ]

# Ayarları güncelle
@router.patch("/settings", response_model=NotificationSettingSchema)
def update_setting(setting: NotificationSettingSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_setting = db.query(NotificationSetting).filter(
        NotificationSetting.user_id == current_user.id, 
        NotificationSetting.event_name == setting.event_name
    ).first()
    if not db_setting:
        db_setting = NotificationSetting(
            user_id=current_user.id, 
            event_name=setting.event_name, 
            push_enabled=setting.push_enabled, 
            email_enabled=setting.email_enabled
        )
        db.add(db_setting)
    else:
        db_setting.push_enabled = setting.push_enabled
        db_setting.email_enabled = setting.email_enabled
    db.commit()
    db.refresh(db_setting)
    return NotificationSettingSchema(
        event_name=db_setting.event_name, 
        push_enabled=db_setting.push_enabled, 
        email_enabled=db_setting.email_enabled
    )

# FCM token kaydet
@router.post("/token")
def register_fcm_token(token_data: FcmTokenSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing_token = db.query(UserFcmToken).filter(
        UserFcmToken.user_id == current_user.id, 
        UserFcmToken.token == token_data.token
    ).first()
    if existing_token:
        return {"message": "Token zaten kayıtlı."}
    new_token = UserFcmToken(user_id=current_user.id, token=token_data.token)
    db.add(new_token)
    db.commit()
    db.refresh(new_token)
    return {"message": "Token kaydedildi."}

# Bildirim geçmişi
@router.get("/history", response_model=List[NotificationHistorySchema])
def get_notification_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    history = db.query(NotificationHistory).filter(
        NotificationHistory.user_id == current_user.id
    ).order_by(NotificationHistory.created_at.desc()).all()
    return [NotificationHistorySchema.from_orm(h) for h in history]  

@router.get("/unread", response_model=list[NotificationHistorySchema])
def get_unread_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    unread = db.query(NotificationHistory).filter(
        NotificationHistory.user_id == current_user.id,
        NotificationHistory.read == False  # Eğer NotificationHistory modelinde read alanı yoksa ekleyelim
    ).order_by(NotificationHistory.created_at.desc()).all()
    return unread

@router.patch("/mark_read/{notification_id}")
def mark_notification_read(notification_id: int, 
                           db: Session = Depends(get_db),
                           current_user: User = Depends(get_current_user)):
    notif = db.query(NotificationHistory).filter(
        NotificationHistory.id == notification_id,
        NotificationHistory.user_id == current_user.id
    ).first()

    if not notif:
        return {"message": "Bildirim bulunamadı"}

    notif.read = True
    db.commit()
    return {"message": "OK"}

