# app/services/user_service.py
import secrets
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.doctor_team import DoctorTeam
from app.schemas.user import UserCreate, UserLogin
from app.utils.auth import hash_password, verify_password, create_access_token
from datetime import timedelta
from app.config import ACCESS_TOKEN_EXPIRE_MINUTES
from fastapi import Header, HTTPException, status, Depends
from app.utils.auth import verify_token
from app.database import get_db
from app.utils.email_service import send_email



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
    return { "token": token,
    "user": {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "must_change_password": user.must_change_password}
        }

def get_current_user(
    token_header: str = Header(..., alias="token-header"),
    db: Session = Depends(get_db)
):
    """
    'token-header' header'ından token alır ve kullanıcıyı doğrular
    Header formatı: "Bearer <token>"
    """

    # Debug: raw token log
    print("Raw token_header:", repr(token_header))

    # Header boş mu kontrolü
    if not token_header or not token_header.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token header eksik."
        )

    token_header = token_header.strip()

    # Bearer formatı kontrolü
    if not token_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token formatı hatalı. 'Bearer <token>' şeklinde olmalı."
        )

    # Token ayırma
    token_parts = token_header.split(" ")
    if len(token_parts) != 2 or not token_parts[1]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token eksik veya hatalı."
        )

    token = token_parts[1]
    print("token sadece:", token)

    # Token doğrulama
    payload = verify_token(token)
    print("payload:", payload)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz veya süresi dolmuş token."
        )

    # Kullanıcı veritabanında var mı kontrolü
    user = db.query(User).filter(User.email == payload.get("sub")).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kullanıcı bulunamadı."
        )

    return user

def create_staff_user(db: Session, name: str, email: str, role: str, parent_id: int):
    # 1️⃣ Mevcut mu kontrol
    existing = db.query(User).filter(User.email == email).first()

    if existing:
        # Eğer zaten doctor_team’de yoksa ekle
        team_entry = db.query(DoctorTeam).filter(
            DoctorTeam.doctor_id == parent_id,
            DoctorTeam.member_id == existing.id
        ).first()

        if team_entry:
            return {"error": "Bu kullanıcı zaten ekli."}

        # DoctorTeam kaydı oluştur
        new_team_entry = DoctorTeam(
            doctor_id=parent_id,
            member_id=existing.id,
            role=role,
            permissions={}
        )
        db.add(new_team_entry)
        db.commit()
        db.refresh(new_team_entry)

        # Mail gönderebilirsin, istersen
        send_email(
            to_email=email,
            subject="Kişisel Sağlık Asistanı Hesabınız Güncellendi",
            body=f"Merhaba {name},\n\nArtık tekrar alt kullanıcı olarak eklenmiş bulunuyorsunuz.\n\nSağlıklı günler!"
        )
        return existing

    # 2️⃣ Yeni kullanıcı oluştur (önceki flow)
    temp_password = secrets.token_urlsafe(8)
    hashed_pw = hash_password(temp_password)
    new_user = User(
        name=name,
        email=email,
        password=hashed_pw,
        role=role,
        must_change_password=True,
        parent_id=parent_id,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    team_entry = DoctorTeam(
        doctor_id=parent_id,
        member_id=new_user.id,
        role=new_user.role,
        permissions={}
    )
    db.add(team_entry)
    db.commit()
    db.refresh(team_entry)

    send_email(
        to_email=email,
        subject="Kişisel Sağlık Asistanı Hesabınız Oluşturuldu",
        body=f"Merhaba {name},\n\nHesabınız oluşturuldu.\nGeçici şifreniz: {temp_password}\nİlk girişte şifrenizi değiştiriniz.\n\nSağlıklı günler!"
    )

    return new_user