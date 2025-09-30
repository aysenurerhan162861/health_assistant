from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.user import UserCreate, UserLogin
from app.services.user_service import register_user, login_user
from app.database import get_db

router = APIRouter()

@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    res = register_user(db, user)
    # Eğer error varsa HTTPException fırlat
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    return res  # artık message ve user JSON olarak dönüyor

@router.post("/login")
def login(data: UserLogin, db: Session = Depends(get_db)):
    res = login_user(db, data)
    if res is None:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return res  # token ve user JSON olarak dönüyor
