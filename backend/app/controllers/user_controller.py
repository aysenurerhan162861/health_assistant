from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.user import UserCreate, UserLogin, UserUpdate, UserOut
from app.services.user_service import register_user, login_user, get_current_user
from app.database import get_db
from app.models.user import User


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

# Protected route
@router.get("/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role
    }

@router.post("/update", response_model=UserOut)
def update_user(
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    
    if data.name:
        user.name = data.name
    if data.email:
        user.email = data.email
    
    db.commit()
    db.refresh(user)
    return user