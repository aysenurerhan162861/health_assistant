from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import assistant_service
from app.schemas.doctor_patient import GrantPermissionRequest

router = APIRouter(tags=["Assistants"])

@router.post("/{doctor_id}/grant_permission")
def grant_permission_to_assistant(
    doctor_id: int,
    request: GrantPermissionRequest,  # ✅ body ile al
    db: Session = Depends(get_db)
):
    permission = assistant_service.grant_permission(
        db, doctor_id, request.assistant_id, request.patient_id
    )
    return {"message": "Hasta asistana başarıyla atandı", "permission": permission}

# 🔵 Asistanın hastalarını görmesi
@router.get("/{assistant_id}/patients")
def get_assistant_patients(assistant_id: int, db: Session = Depends(get_db)):
    return assistant_service.get_assistant_patients(db, assistant_id)

# 🔴 İzni kaldırma
@router.delete("/{doctor_id}/revoke_permission")
def revoke_permission(
    doctor_id: int,
    request: GrantPermissionRequest,  # ✅ body ile alıyoruz
    db: Session = Depends(get_db)
):
    result = assistant_service.revoke_permission(
        db, 
        doctor_id, 
        request.assistant_id, 
        request.patient_id
    )
    return {"message": "Hasta asistan izni kaldırıldı", "result": result}

