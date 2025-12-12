from app.models.message import Message
from app.database import SessionLocal
from sqlalchemy.orm import Session
from typing import List
from app.models.user import User
from sqlalchemy import func

def save_message(room: str, sender_id: int, receiver_id: int, sender_name: str, text: str) -> Message:
    db: Session = SessionLocal()
    try:
        msg = Message(
            room=room,
            sender_id=sender_id,
            receiver_id=receiver_id,
            sender_name=sender_name,
            text=text
        )
        db.add(msg)
        db.commit()
        db.refresh(msg)
        return msg
    finally:
        db.close()

def get_history_by_room(room: str, limit: int = 200) -> List[Message]:
    db: Session = SessionLocal()
    try:
        return db.query(Message)\
                 .filter(Message.room == room)\
                 .order_by(Message.created_at.asc())\
                 .limit(limit)\
                 .all()
    finally:
        db.close()

def get_last_senders(user_id: int, db: Session):
    results = (
        db.query(Message.sender_id, func.max(Message.created_at).label("last_time"))
        .filter(Message.receiver_id == user_id)
        .group_by(Message.sender_id)
        .all()
    )

    out = []
    for sender_id, _ in results:
        unread_count = (
            db.query(func.count(Message.id))
            .filter(
                Message.sender_id == sender_id,
                Message.receiver_id == user_id,
                Message.read == 0
            )
            .scalar()
        )
        sender_name_row = db.query(User.name).filter(User.id == sender_id).first()
        sender_name = sender_name_row[0] if sender_name_row else "Unknown"
        out.append({
            "sender_id": sender_id,
            "sender_name": sender_name,
            "unread_count": unread_count
        })
    return out


