from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.schemas.user import UserCreate, UserOut
from app.services.doctor_service import get_doctor_patients_service, add_team_member_service
from app.database import get_db
from app.services.user_service import get_current_user
from app.models.user import User

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
