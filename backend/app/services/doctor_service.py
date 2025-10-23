import secrets
from app.utils.email_service import send_email
from app.utils.auth import hash_password
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

def update_team_member_service(db: Session, doctor: User, member_id: int, user_in: UserCreate):
    # Alt kullanıcıyı bul
    user = db.query(User).filter(User.id == member_id).first()
    if not user:
        raise ValueError("Alt kullanıcı bulunamadı")

    # Doktora bağlı mı kontrol et
    team_entry = db.query(DoctorTeam).filter(
        DoctorTeam.doctor_id == doctor.id,
        DoctorTeam.member_id == member_id
    ).first()
    if not team_entry:
        raise ValueError("Bu kullanıcı size bağlı değil")

    # Alanları güncelle
    user.name = user_in.name
    user.email = user_in.email
    user.role = user_in.role.value  # Enum kullanıyorsa
    # gerekirse diğer alanlar eklenebilir

    db.commit()
    db.refresh(user)
    return user

def resend_staff_email(db: Session, member_id: int, doctor_id: int):
    """
    Alt kullanıcıya yeniden bilgilendirme maili gönderir.
    """
    # 1. Kullanıcıyı bul
    user = db.query(User).filter(User.id == member_id).first()
    if not user:
        return {"error": "Alt kullanıcı bulunamadı"}

    # 2. Kullanıcının doctor_team içinde olup olmadığını kontrol et
    team_entry = db.query(DoctorTeam).filter(
        DoctorTeam.doctor_id == doctor_id,
        DoctorTeam.member_id == member_id
    ).first()
    if not team_entry:
        return {"error": "Bu kullanıcı sizin ekibinizde değil"}

    # 3. Geçici şifre oluştur
    temp_password = secrets.token_urlsafe(8)
    user.password = hash_password(temp_password)
    user.must_change_password = True
    db.commit()
    db.refresh(user)

    # 4. Mail gönder
    send_email(
        to_email=user.email,
        subject="Kişisel Sağlık Asistanı - Şifre Hatırlatma",
        body=f"Merhaba {user.name},\n\nHesabınız için geçici şifreniz: {temp_password}\nİlk girişte şifrenizi değiştiriniz.\n\nSağlıklı günler!"
    )

    return {"message": "Bilgilendirme maili gönderildi ✅"}