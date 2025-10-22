from fastapi import APIRouter, Depends, HTTPException, Path, Body
from sqlalchemy.orm import Session
from typing import List
from app.schemas.user import UserCreate, UserOut, StaffCreate
from app.services.doctor_service import get_doctor_patients_service, add_team_member_service, delete_team_member_service, update_team_member_service
from app.database import get_db
from app.services.user_service import get_current_user
from app.models.user import User
from app.models.doctor_team import DoctorTeam

router = APIRouter()

@router.get("/patients", response_model=List[UserOut])
def get_patients(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role.lower() != "doctor":
        raise HTTPException(status_code=403, detail="Not authorized")
    return get_doctor_patients_service(db, current_user)

@router.post("/team/add", response_model=UserOut)
def add_team_member(user_in: UserCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role.lower() != "doctor":
        raise HTTPException(status_code=403, detail="Not authorized")
    return add_team_member_service(db, current_user, user_in)

@router.get("/my-staff", response_model=List[UserOut])
def get_my_staff(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Sadece doktorlar bu listeyi görebilir.")

    staff_members = (
        db.query(User)
        .join(DoctorTeam, DoctorTeam.member_id == User.id)
        .filter(DoctorTeam.doctor_id == current_user.id)
        .all()
    )
    return staff_members

@router.delete("/team/remove/{member_id}")
def remove_team_member(
    member_id: int = Path(..., description="Silinecek alt kullanıcının ID'si"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    # current_user.id = doctor_id
    team_members = db.query(DoctorTeam).filter(
        DoctorTeam.doctor_id == current_user.id,
        DoctorTeam.member_id == member_id
    ).all()

    if not team_members:
        raise HTTPException(status_code=404, detail="Alt kullanıcı bulunamadı veya size bağlı değil")

    # Tüm eşleşen kayıtları sil
    for member in team_members:
        db.delete(member)
    db.commit()
    return {"message": "Alt kullanıcı(lar) başarıyla silindi"}

@router.put("/team/update/{member_id}", response_model=UserOut)
def update_team_member(
    member_id: int = Path(..., description="Güncellenecek alt kullanıcının ID'si"),
    user_in: StaffCreate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.lower() != "doctor":
        raise HTTPException(status_code=403, detail="Not authorized")

    try:
        updated_user = update_team_member_service(db, current_user, member_id, user_in)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return updated_user
