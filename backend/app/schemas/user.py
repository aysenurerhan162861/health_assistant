from pydantic import BaseModel
from app.models.user import UserRole

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: UserRole

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: int
    name: str | None = None
    email: str
    role: UserRole

    model_config = {
        "from_attributes": True  # ✅ Pydantic v2 için doğru kullanım
    }
