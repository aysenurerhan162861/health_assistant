# backend/app/models/message.py
from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from app.database import Base

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    room = Column(String, index=True, nullable=True)
    sender_id = Column(Integer, nullable=False)
    receiver_id = Column(Integer, nullable=True)
    sender_name = Column(String, nullable=True)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    read = Column(Integer, default=0)
