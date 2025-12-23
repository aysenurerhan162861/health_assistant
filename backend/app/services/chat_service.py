# backend/app/services/chat_service.py
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy import or_, and_
from app.models.chat_message import ChatMessage
from app.models.message import Message
from app.models.user import User
from app.models.blood_pressure_tracking import BloodPressureTracking
from app.models.meal import Meal
from app.models.lab_report import LabReport
from app.services.blood_pressure_service import get_blood_pressure_trackings
from app.services.meal_service import list_meals
from app.gemini_client import get_chat_response
from app.database import SessionLocal


def get_patient_health_summary(db: Session, user_id: int) -> Dict[str, Any]:
    """
    Kullanıcının sağlık verilerini toplar ve özetler.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {}
    
    summary = {
        "patient_info": {
            "name": user.name,
            "age": user.age,
            "gender": user.gender,
            "blood_type": user.blood_type,
            "chronic_diseases": user.chronic_diseases or "Belirtilmemiş",
            "allergies": user.allergies or "Belirtilmemiş",
        },
        "blood_pressure": [],
        "meals": [],
        "lab_reports": [],
    }
    
    # Son 30 günlük tansiyon takiplerini al
    try:
        trackings = get_blood_pressure_trackings(db, user_id)
        recent_trackings = [
            t for t in trackings 
            if t.date and t.date >= (datetime.now().date() - timedelta(days=30))
        ]
        
        for tracking in recent_trackings[:10]:  # Son 10 takip
            try:
                measurements = [
                    {
                        "time": f"{m.measurement_time.hour:02d}:{m.measurement_time.minute:02d}",
                        "systolic": m.systolic,
                        "diastolic": m.diastolic,
                    }
                    for m in (tracking.measurements or [])
                    if m.systolic is not None and m.diastolic is not None
                ]
                if measurements:
                    summary["blood_pressure"].append({
                        "date": tracking.date.isoformat() if tracking.date else "",
                        "measurements": measurements,
                        "is_completed": tracking.is_completed,
                    })
            except Exception as e:
                print(f"Tansiyon ölçüm hatası: {e}")
                continue
    except Exception as e:
        print(f"Tansiyon takip hatası: {e}")
    
    # Son 30 günlük öğünleri al
    recent_meals = []
    try:
        meals = list_meals(db, user_id)
        recent_meals = [
            m for m in meals
            if m.meal_datetime and m.meal_datetime >= (datetime.now() - timedelta(days=30))
        ]
    except Exception as e:
        print(f"Öğün listesi hatası: {e}")
    
    for meal in recent_meals[:20]:  # Son 20 öğün
        summary["meals"].append({
            "date": meal.meal_datetime.isoformat(),
            "type": meal.meal_type,
            "description": meal.text_description or "",
            "calorie": meal.gemini_calorie,
            "comment": meal.gemini_comment or "",
        })
    
    # Son tahlilleri al (doğrudan veritabanı sorgusu - döngüsel import'u önlemek için)
    lab_reports = (
        db.query(LabReport)
        .filter(LabReport.patient_id == user_id)
        .order_by(LabReport.upload_date.desc())
        .limit(5)
        .all()
    )
    
    recent_reports = lab_reports
    
    for report in recent_reports:
        parsed_data = report.parsed_data or {}
        summary["lab_reports"].append({
            "date": report.upload_date.isoformat(),
            "file_name": report.file_name,
            "parsed_data": parsed_data,
        })
    
    return summary


def format_health_summary_for_ai(summary: Dict[str, Any]) -> str:
    """
    Sağlık özetini AI'ya gönderilecek formata çevirir.
    """
    text = "=== HASTA SAĞLIK ÖZETİ ===\n\n"
    
    # Hasta bilgileri
    info = summary.get("patient_info", {})
    text += f"Hasta Bilgileri:\n"
    text += f"- Ad: {info.get('name', 'N/A')}\n"
    text += f"- Yaş: {info.get('age', 'N/A')}\n"
    text += f"- Cinsiyet: {info.get('gender', 'N/A')}\n"
    text += f"- Kan Grubu: {info.get('blood_type', 'N/A')}\n"
    text += f"- Kronik Hastalıklar: {info.get('chronic_diseases', 'Belirtilmemiş')}\n"
    text += f"- Alerjiler: {info.get('allergies', 'Belirtilmemiş')}\n\n"
    
    # Tansiyon özeti
    bp_data = summary.get("blood_pressure", [])
    if bp_data:
        text += f"Tansiyon Takibi (Son {len(bp_data)} kayıt):\n"
        for bp in bp_data[:5]:  # Son 5 kayıt
            date_str = bp.get("date", "")
            measurements = bp.get("measurements", [])
            if measurements:
                avg_sys = sum(m.get("systolic", 0) for m in measurements) / len(measurements)
                avg_dia = sum(m.get("diastolic", 0) for m in measurements) / len(measurements)
                text += f"- {date_str}: Ortalama {avg_sys:.0f}/{avg_dia:.0f} mmHg ({len(measurements)} ölçüm)\n"
        text += "\n"
    else:
        text += "Tansiyon Takibi: Henüz kayıt yok.\n\n"
    
    # Öğün özeti
    meals = summary.get("meals", [])
    if meals:
        text += f"Öğün Geçmişi (Son {len(meals)} kayıt):\n"
        for meal in meals[:10]:  # Son 10 öğün
            meal_type = meal.get("type", "")
            calorie = meal.get("calorie")
            text += f"- {meal.get('date', '')[:10]} {meal_type}: "
            if calorie:
                text += f"{calorie} kcal"
            text += "\n"
        text += "\n"
    else:
        text += "Öğün Geçmişi: Henüz kayıt yok.\n\n"
    
    # Tahlil özeti
    lab_reports = summary.get("lab_reports", [])
    if lab_reports:
        text += f"Tahlil Raporları (Son {len(lab_reports)} kayıt):\n"
        for report in lab_reports:
            text += f"- {report.get('date', '')[:10]}: {report.get('file_name', 'N/A')}\n"
            parsed = report.get("parsed_data", {})
            if parsed.get("tests"):
                text += "  Testler: " + ", ".join([t.get("name", "") for t in parsed.get("tests", [])[:5]]) + "\n"
        text += "\n"
    else:
        text += "Tahlil Raporları: Henüz kayıt yok.\n\n"
    
    return text


def get_chat_history(db: Session, user_id: int, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Kullanıcının son sohbet geçmişini getirir.
    Her mesaj çifti (user + assistant) sıralı olarak döner.
    """
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == user_id)
        .order_by(ChatMessage.created_at.asc())
        .limit(limit)
        .all()
    )
    
    # Her mesaj için user ve assistant çifti oluştur
    history = []
    for msg in messages:
        history.append({
            "role": "user",
            "content": msg.message,
        })
        history.append({
            "role": "assistant",
            "content": msg.response,
        })
    
    return history


def save_chat_message(db: Session, user_id: int, message: str, response: str) -> ChatMessage:
    """
    Sohbet mesajını veritabanına kaydeder.
    """
    chat_msg = ChatMessage(
        user_id=user_id,
        message=message,
        response=response,
    )
    db.add(chat_msg)
    db.commit()
    db.refresh(chat_msg)
    return chat_msg


# ============================================
# WebSocket Chat Fonksiyonları (Doktor-Hasta mesajlaşması için)
# ============================================

def save_message(room: str, sender_id: int, receiver_id: int, sender_name: str, text: str) -> Message:
    """
    WebSocket chat mesajını veritabanına kaydeder.
    """
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
    """
    Belirli bir oda (room) için mesaj geçmişini getirir.
    """
    db: Session = SessionLocal()
    try:
        messages = (
            db.query(Message)
            .filter(Message.room == room)
            .order_by(Message.created_at.asc())
            .limit(limit)
            .all()
        )
        return messages
    finally:
        db.close()


def get_history_by_users(doctor_id: int, patient_id: int, limit: int = 200) -> List[Message]:
    """
    Doktor ve hasta arasındaki mesaj geçmişini getirir.
    """
    db: Session = SessionLocal()
    try:
        # İki yönlü mesajlaşma: (doctor->patient) OR (patient->doctor)
        messages = (
            db.query(Message)
            .filter(
                or_(
                    and_(Message.sender_id == doctor_id, Message.receiver_id == patient_id),
                    and_(Message.sender_id == patient_id, Message.receiver_id == doctor_id)
                )
            )
            .order_by(Message.created_at.asc())
            .limit(limit)
            .all()
        )
        return messages
    finally:
        db.close()


def get_last_senders(user_id: int, db: Session) -> List[Dict[str, Any]]:
    """
    Kullanıcının son mesajlaştığı kişileri getirir (hasta tarafı için).
    Okunmamış mesaj sayısını da hesaplar.
    """
    # Her sender_id için okunmamış mesaj sayısını hesapla
    from sqlalchemy import func
    
    unread_counts = (
        db.query(
            Message.sender_id,
            Message.sender_name,
            func.count(Message.id).label("unread_count")
        )
        .filter(Message.receiver_id == user_id, Message.read == 0)
        .group_by(Message.sender_id, Message.sender_name)
        .all()
    )
    
    # Son mesajlaştığı sender_id'leri bul (okunmuş mesajlar dahil)
    last_messages = (
        db.query(Message)
        .filter(Message.receiver_id == user_id)
        .order_by(Message.created_at.desc())
        .all()
    )
    
    # Benzersiz sender_id'leri ve isimlerini topla
    seen_senders = {}
    for msg in last_messages:
        if msg.sender_id not in seen_senders:
            seen_senders[msg.sender_id] = {
                "sender_id": msg.sender_id,
                "sender_name": msg.sender_name or "Bilinmeyen",
                "unread_count": 0,  # Varsayılan olarak 0
            }
    
    # Okunmamış mesaj sayılarını ekle
    for count_result in unread_counts:
        sender_id = count_result.sender_id
        if sender_id in seen_senders:
            seen_senders[sender_id]["unread_count"] = count_result.unread_count
        else:
            # Eğer sadece okunmamış mesaj varsa ama okunmuş mesaj yoksa
            seen_senders[sender_id] = {
                "sender_id": sender_id,
                "sender_name": count_result.sender_name or "Bilinmeyen",
                "unread_count": count_result.unread_count,
            }
    
    return list(seen_senders.values())
