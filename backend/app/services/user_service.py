from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin
from app.utils.auth import hash_password, verify_password, create_access_token
from datetime import timedelta
from app.config import ACCESS_TOKEN_EXPIRE_MINUTES

def register_user(db: Session, user_data: UserCreate):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        # Artık ValueError yerine mesaj döndürülüyor
        return {"error": "Bu email zaten kayıtlı, lütfen giriş yapınız."}
    
    hashed_pw = hash_password(user_data.password)
    user = User(
        name=user_data.name,
        email=user_data.email,
        password=hashed_pw,
        role=user_data.role
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
