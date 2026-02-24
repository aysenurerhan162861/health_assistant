from fastapi import APIRouter, Depends, HTTPException, Body, status
from sqlalchemy.orm import Session
from app.schemas.user import UserCreate, UserLogin, UserUpdate, UserOut, StaffCreate
from app.services.user_service import register_user, login_user, get_current_user, hash_password, reset_staff_password_and_send_mail
from app.database import get_db
from app.models.user import User
from app.services.user_service import create_staff_user
from app.services.user_service import get_current_user
from pydantic import BaseModel

router = APIRouter()

class ChangePasswordRequest(BaseModel):
    new_password: str

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

    # dinamik olarak gelen verileri güncelle
    for field, value in data.dict(exclude_unset=True).items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user

@router.post("/create-staff", response_model=UserOut)
def create_staff(
    staff: StaffCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Sadece doktor kullanıcı ekleyebilir.")

    result = create_staff_user(
        db=db,
        name=staff.name,
        email=staff.email,
        role=staff.role,
        parent_id=current_user.id
    )

    # ✅ Hata kontrolünü güvenli hale getir
    if isinstance(result, dict) and "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    # ✅ Eğer result bir User nesnesiyse burası sorunsuz çalışır
    return result

@router.post("/change-password-first-login")
def change_password_first_login(
    data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.must_change_password:
        raise HTTPException(status_code=400, detail="Şifre değişikliği gerek yok.")

    current_user.password = hash_password(data.new_password)
    current_user.must_change_password = False
    db.commit()
    db.refresh(current_user)

    return {"message": "Şifre başarıyla değiştirildi"}

@router.put("/staff/update/me", response_model=UserOut)
def update_own_profile(
    user_in: StaffCreate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Sadece alt kullanıcı (doctor hariç) kendi profilini güncelleyebilir
    if current_user.role.lower() == "doctor":
        raise HTTPException(status_code=403, detail="Doktorlar bu işlemi yapamaz.")

    # Kullanıcıyı bul
    staff = db.query(User).filter(User.id == current_user.id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")

    # Alanları güncelle
    for key, value in user_in.dict(exclude_unset=True).items():
        setattr(staff, key, value)

    db.commit()
    db.refresh(staff)
    return staff

@router.post("/team/resend-mail/{staff_id}")
def resend_staff_mail(
    staff_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sadece doktor bu işlemi yapabilir."
        )

    return reset_staff_password_and_send_mail(
        db=db,
        staff_id=staff_id,
        doctor_id=current_user.id
    )