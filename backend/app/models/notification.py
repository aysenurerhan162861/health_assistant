from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
from sqlalchemy.dialects.postgresql import JSONB

# Kullanıcı Bildirim Ayarları
class NotificationSetting(Base):
    __tablename__ = "notification_settings"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    event_name = Column(String, nullable=False)  # Örn: lab_uploaded, doctor_comment
    push_enabled = Column(Boolean, default=True)
    email_enabled = Column(Boolean, default=True)
    user = relationship("User", backref="notification_settings")

# Kullanıcı Cihaz Push Tokenları
class UserFcmToken(Base):
    __tablename__ = "user_fcm_tokens"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    token = Column(String, nullable=False, unique=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = relationship("User", backref="fcm_tokens")

# Gönderilen Bildirim Geçmişi
class NotificationHistory(Base):
    __tablename__ = "notification_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    event_name = Column(String, nullable=False)
    title = Column(String, nullable=False)
    body = Column(String, nullable=False)
    extra_data = Column(JSON, nullable=True)  # eski 'metadata' yerine
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", backref="notifications")
    read = Column(Boolean, default=False)
