from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
import json
from typing import Dict, Optional, Set
from app.models.message import Message
from app.models.user import User
from app.services.chat_service import save_message, get_history_by_room, get_last_senders, get_history_by_users
from app.services.user_service import get_user_by_email
from app.utils.auth import verify_token
from app.database import get_db


router = APIRouter()

# user_id -> WebSocket
active_connections: Dict[int, WebSocket] = {}

async def notify_via_ws(user_id: int, payload: dict):
    ws = active_connections.get(user_id)
    if ws:
        import json
        await ws.send_text(json.dumps(payload))

def make_room(doctor_id: int, patient_id: int) -> str:
    a, b = sorted([int(doctor_id), int(patient_id)])
    return f"chat_{a}_{b}"

def _safe_json_loads(s: str) -> Optional[dict]:
    try:
        return json.loads(s)
    except Exception:
        return None

@router.websocket("/ws/chat")
async def chat_socket(websocket: WebSocket, db: Session = Depends(get_db)):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001)
        return

    payload = verify_token(token)
    if not payload:
        await websocket.close(code=4002)
        return

    email = payload.get("sub")
    if not email:
        await websocket.close(code=4003)
        return

    user = get_user_by_email(db, email)
    if not user:
        await websocket.close(code=4004)
        return

    user_id = int(user.id)
    username = getattr(user, "name", getattr(user, "username", email))
    role = user.role  # 'doctor' veya 'patient'

    await websocket.accept()
    active_connections[user_id] = websocket
    print(f"User connected: {user_id}")

    await websocket.send_text(json.dumps({
        "type": "auth_ok",
        "user_id": user_id,
        "username": username
    }))

    try:
        while True:
            raw = await websocket.receive_text()
            data = _safe_json_loads(raw)
            if data is None:
                continue

            msg_type = data.get("type", "message")

            if msg_type == "message":
                doctor_id = int(data.get("doctor_id"))
                patient_id = int(data.get("patient_id"))
                text = data.get("text", "").strip()
                if not text:
                    continue

                room = make_room(doctor_id, patient_id)

                # Rol bazlı alıcı belirleme
                if role == "doctor":
                    actual_receiver_id = patient_id
                else:
                    actual_receiver_id = doctor_id

                # DB'ye kaydet
                saved = save_message(
                    room=room,
                    sender_id=user_id,
                    receiver_id=actual_receiver_id,
                    sender_name=username,
                    text=text
                )

                payload_out = {
                    "type": "message",
                    "id": getattr(saved, "id", None),
                    "room": room,
                    "sender_id": user_id,
                    "sender_name": username,
                    "text": text,
                    "created_at": getattr(saved, "created_at", None).isoformat() if getattr(saved, "created_at", None) else None
                }

                # Her iki tarafı bilgilendir (mesaj sayısı için type: "message")
                # Bu mesaj MessageNotificationPanel'de görünecek
                recv_ids: Set[int] = {doctor_id, patient_id}
                for rid in recv_ids:
                    target_ws = active_connections.get(rid)
                    if target_ws:
                        await target_ws.send_text(json.dumps(payload_out))
                
                # NOT: Mesaj bildirimleri için notify() çağırmıyoruz
                # Çünkü mesaj bildirimleri MessageNotificationPanel'de görünmeli
                # Normal bildirimler (lab_uploaded, meal_uploaded, vb.) NotificationPanel'de görünür

            elif msg_type == "history":
                doctor_id = int(data.get("doctor_id"))
                patient_id = int(data.get("patient_id"))
                print(f"History request: doctor_id={doctor_id}, patient_id={patient_id}, user_id={user_id}, role={role}")
                # İki yönlü geçmiş: (doctor->patient) OR (patient->doctor)
                msgs = get_history_by_users(doctor_id, patient_id)
                print(f"Found {len(msgs)} messages in history")

                out_msgs = [{
                    "id": m.id,
                    "sender_id": m.sender_id,
                    "sender_name": m.sender_name,
                    "receiver_id": m.receiver_id,
                    "text": m.text,
                    "created_at": m.created_at.isoformat(),
                } for m in msgs]

                await websocket.send_text(json.dumps({
                    "type": "history",
                    "messages": out_msgs
                }))
                print(f"History sent: {len(out_msgs)} messages")

    except WebSocketDisconnect:
        if user_id in active_connections:
            del active_connections[user_id]
        print(f"User disconnected: {user_id}")



@router.get("/last_senders/{user_id}")
def last_senders(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user.role == "doctor":
        # Doktor tarafı: her sender_id için okunmamış mesajları grupla
        query = (
            db.query(
                Message.sender_id,
                Message.sender_name,
                func.count(Message.id).label("unread_count")  # <- db.func yerine func kullan
            )
            .filter(Message.receiver_id == user_id, Message.read == 0)
            .group_by(Message.sender_id, Message.sender_name)
        )
        results = query.all()
        return [
            {"sender_id": r.sender_id, "sender_name": r.sender_name, "unread_count": r.unread_count}
            for r in results
        ]
    else:
        # Hasta tarafı: mevcut servis fonksiyonunu kullan
        return get_last_senders(user_id, db)
@router.post("/messages/mark_read")
def mark_messages_read(sender_id: int, receiver_id: int, db: Session = Depends(get_db)):
    db.query(Message).filter(
        Message.sender_id == sender_id,
        Message.receiver_id == receiver_id,
        Message.read == 0
    ).update({"read": 1})
    db.commit()
    return {"status": "ok"}