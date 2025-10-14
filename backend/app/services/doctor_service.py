from sqlalchemy.orm import Session
from app.models.user import User
from app.models.doctor_patient import DoctorPatient
from app.models.doctor_team import DoctorTeam
from app.schemas.user import UserCreate

def get_doctor_patients_service(db: Session, doctor: User):
    patient_ids = db.query(DoctorPatient.patient_id).filter(DoctorPatient.doctor_id == doctor.id).all()
    patient_ids = [pid[0] for pid in patient_ids]
    return db.query(User).filter(User.id.in_(patient_ids)).all()

def add_team_member_service(db: Session, doctor: User, user_in: UserCreate):
    new_user = User(
        name=user_in.name,
        email=user_in.email,
        password=user_in.password,
        role=user_in.role.value
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    team_entry = DoctorTeam(
        doctor_id=doctor.id,
        member_id=new_user.id,
        role=new_user.role,
        permissions={}
    )
    db.add(team_entry)
    db.commit()
    db.refresh(team_entry)

    return new_user

def delete_team_member_service(db: Session, doctor: User, member_id: int):
    # DoctorTeam tablosunda bu doctor-member ilişkisini bul
    team_entry = db.query(DoctorTeam).filter(
        DoctorTeam.doctor_id == doctor.id,
        DoctorTeam.member_id == member_id
    ).first()

    if not team_entry:
        raise ValueError("Alt kullanıcı bulunamadı veya size bağlı değil")

    # Kullanıcıyı ve DoctorTeam kaydını sil
    member = db.query(User).filter(User.id == member_id).first()
    if not member:
        raise ValueError("Alt kullanıcı bulunamadı")

    db.delete(team_entry)
    db.delete(member)
    db.commit()

    return {"message": "Alt kullanıcı başarıyla silindi"}