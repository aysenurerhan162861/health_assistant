# app/schemas/user.py
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.user import UserRole

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: UserRole
    # opsiyonel alanlar
    diploma_number: Optional[str] = None
    workplace: Optional[str] = None
    specialization: Optional[str] = None
    profile_image: Optional[str] = None   # Base64 ya da URL olarak tutulabilir

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: int
    name: Optional[str] = None
    email: str
    role: UserRole
    diploma_number: Optional[str] = None
    workplace: Optional[str] = None
    specialization: Optional[str] = None
    profile_image: Optional[str] = None

    model_config = {
        "from_attributes": True
    }

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None  # opsiyonel