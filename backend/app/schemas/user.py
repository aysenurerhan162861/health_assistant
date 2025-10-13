# app/schemas/user.py
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.user import UserRole
from enum import Enum
from datetime import date

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
    phone: Optional[str] = None
    birth_date: Optional[date] = None
    gender: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    neighborhood: Optional[str] = None
    blood_type: Optional[str] = None
    chronic_diseases: Optional[str] = None
    allergies: Optional[str] = None
    photo_url: Optional[str] = None

    branch: Optional[str]
    experience: Optional[int]
    institution: Optional[str]
    diploma_no: Optional[str]
    certifications: Optional[str]
    about: Optional[str]

class UserRole(str, Enum):
    DOCTOR = "doctor"
    ASSISTANT = "assistant"
    SECRETARY = "secretary"

class StaffCreate(BaseModel):
    name: str
    email: EmailStr
    role: UserRole
    