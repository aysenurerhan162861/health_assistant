from app.models.notification import NotificationSetting, UserFcmToken, NotificationHistory
from app.utils.email_service import send_email
from sqlalchemy.orm import Session
from typing import Dict
import json
from app.controllers.chat_socket_controller import notify_via_ws

# 🔹 FCM gönderimi placeholder
# Gerçek proje için firebase_admin SDK ile değiştirilebilir
def send_push(token: str, title: str, body: str, data: dict = {}):
    print(f"[PUSH] {token} | {title} | {body} | {json.dumps(data)}")
    # Burada firebase_admin messaging kullanarak push gönderilebilir


def notify(
    db: Session,
    user_id: int,
    event: str,
    title: str,
    body: str,
    metadata: dict = None
):
    """
    Kullanıcıya bildirim gönderir:
    1️⃣ Bildirim ayarlarını kontrol eder
    2️⃣ Push gönderir
    3️⃣ Email gönderir
    4️⃣ History kaydı oluşturur
    """
    metadata = metadata or {}

    # Kullanıcının bildirim ayarlarını çek
    setting = db.query(NotificationSetting).filter(
        NotificationSetting.user_id == user_id,
        NotificationSetting.event_name == event
    ).first()

    # Eğer ayar yoksa default olarak hem push hem email açık
    push_enabled = setting.push_enabled if setting else True
    email_enabled = setting.email_enabled if setting else True

    # 1️⃣ Push gönder
    if push_enabled:
        tokens = db.query(UserFcmToken).filter(UserFcmToken.user_id == user_id).all()
        for token in tokens:
            send_push(token.token, title, body, metadata)

    # 2️⃣ Email gönder
    if email_enabled:
        from app.models.user import User
        user = db.query(User).filter(User.id == user_id).first()
        if user and user.email:
            send_email(user.email, title, body)

    # 3️⃣ History kaydı
    history = NotificationHistory(
        user_id=user_id,
        event_name=event,
        title=title,
        body=body,
        metadata=metadata
    )
    db.add(history)
    db.commit()


async def notify_event(
    db: Session,
    user_id: int,
    event_name: str,
    title: str,
    body: str,
    extra_data: dict = None
):
    from app.controllers.chat_socket_controller import notify_via_ws

    notif = NotificationHistory(
        user_id=user_id,
        event_name=event_name,
        title=title,
        body=body,
        extra_data=extra_data
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)

    print(f"Bildirim gönderildi: {title} -> {body}")

    # 🌟 Async WebSocket çağrısı
    await notify_via_ws(user_id, {
        "type": "notification",
        "event": event_name,
        "title": title,
        "body": body,
        "extra_data": extra_data,
        "id": notif.id,
        "created_at": notif.created_at.isoformat()
    })
    return notif