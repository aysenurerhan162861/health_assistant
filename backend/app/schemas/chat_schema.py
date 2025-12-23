# backend/app/schemas/chat_schema.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    id: int
    user_id: int
    message: str
    response: str
    created_at: datetime
    
    class Config:
        from_attributes = True

