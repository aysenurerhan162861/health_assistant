from pydantic import BaseModel
from datetime import datetime

class MessageCreate(BaseModel):
    room: str
    sender_id: int
    receiver_id: int | None = None
    sender_name: str | None = None
    text: str

class MessageResponse(BaseModel):
    id: int
    room: str
    sender_id: int
    receiver_id: int | None
    sender_name: str | None
    text: str
    created_at: datetime
    read: int

    class Config:
        from_attributes = True
