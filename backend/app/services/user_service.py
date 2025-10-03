# app/services/user_service.py
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin
from app.utils.auth import hash_password, verify_password, create_access_token
from datetime import timedelta
from app.config import ACCESS_TOKEN_EXPIRE_MINUTES
from fastapi import Header, HTTPException, status, Depends
from app.utils.auth import verify_token
from app.database import get_db


def register_user(db: Session, user_data: UserCreate):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        return {"error": "Bu email zaten kayıtlı, lütfen giriş yapınız."}
    
    hashed_pw = hash_password(user_data.password)
    user = User(
        name=user_data.name,
        email=user_data.email,
        password=hashed_pw,
        role=user_data.role,
        diploma_number=user_data.diploma_number,
        workplace=user_data.workplace,
        specialization=user_data.specialization,
        profile_image=user_data.profile_image
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "Kayıt başarılı!", "user": user}


def login_user(db: Session, login_data: UserLogin):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password):
        return None
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(
        data={"sub": user.email}, 
        expires_delta=access_token_expires
    )
    return {"token": token, "user": user}

def get_current_user(token_header: str = Header(...), db: Session = Depends(get_db)):
    """
    Authorization header'dan token alır ve kullanıcıyı doğrular
    Header formatı: "Bearer <token>"
    """
    if not token_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token formatı hatalı. 'Bearer <token>' şeklinde olmalı."
        )
    token = token_header.split(" ")[1]
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz veya süresi dolmuş token."
        )
    user = db.query(User).filter(User.email == payload.get("sub")).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kullanıcı bulunamadı."
        )
    return user