# backend/app/models/chat_message.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    message = Column(Text, nullable=False)  # Kullanıcı mesajı
    response = Column(Text, nullable=False)  # AI cevabı
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # İlişki
    user = relationship("User", backref="chat_messages")

