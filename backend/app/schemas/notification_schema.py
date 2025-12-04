from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from datetime import datetime

class NotificationSettingSchema(BaseModel):
    event_name: str
    push_enabled: bool
    email_enabled: bool

class FcmTokenSchema(BaseModel):
    token: str

class NotificationHistorySchema(BaseModel):
    id: int
    user_id: int
    event_name: str
    title: str
    body: str
    extra_data: Optional[dict] = None   # 'metadata' değil, modeldeki isimle aynı olmalı
    created_at: datetime                 # datetime olarak bırak
    read: bool

    model_config = {
        "from_attributes": True          # Pydantic 2.x için zorunlu
    }