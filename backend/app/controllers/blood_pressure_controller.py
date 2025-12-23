from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from app.database import get_db
from app.services.user_service import get_current_user
from app.models.user import User, UserRole
from app.services.blood_pressure_service import (
    create_blood_pressure_tracking,
    get_blood_pressure_trackings,
    get_blood_pressure_tracking_by_id,
    update_blood_pressure_tracking,
    get_doctor_blood_pressure_trackings,
    get_doctor_patient_blood_pressure_trackings,
)
from app.schemas.blood_pressure_schema import (
    BloodPressureTrackingCreate,
    BloodPressureTrackingResponse,
    BloodPressureTrackingListResponse,
    BloodPressureTrackingUpdateComment,
)

router = APIRouter(tags=["Blood Pressure"])


def _is_citizen(user: User) -> bool:
    role = user.role
    if isinstance(role, UserRole):
        return role == UserRole.CITIZEN
    return str(role).lower() == "citizen"


def _is_doctor(user: User) -> bool:
    role = user.role
    if isinstance(role, UserRole):
        return role == UserRole.DOCTOR
    return str(role).lower() == "doctor"


@router.post("/create", response_model=BloodPressureTrackingResponse)
def create_tracking(
    tracking_data: BloodPressureTrackingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Yeni bir tansiyon takibi oluşturur (sadece kayıt, bildirim göndermez)."""
    if not _is_citizen(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sadece hastalar tansiyon takibi oluşturabilir."
        )
    
    try:
        tracking = create_blood_pressure_tracking(
            db=db,
            patient=current_user,
            tracking_date=tracking_data.date,
            start_time_str=tracking_data.start_time,
            end_time_str=tracking_data.end_time,
            period_hours=tracking_data.period_hours,
            measurements=[
                {
                    "measurement_time": m.measurement_time,
                    "systolic": m.systolic,
                    "diastolic": m.diastolic,
                }
                for m in tracking_data.measurements
            ],
            send_notification=False,
        )
        
        # Response için ölçümleri formatla
        return _format_tracking_response(tracking)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        ) from exc


@router.post("/{tracking_id}/send-to-doctor", response_model=BloodPressureTrackingResponse)
def send_to_doctor(
    tracking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Tansiyon takibini doktora gönderir (bildirim gönderir)."""
    if not _is_citizen(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sadece hastalar tansiyon takibini doktora gönderebilir."
        )
    
    tracking = get_blood_pressure_tracking_by_id(db, tracking_id, current_user.id)
    if not tracking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tansiyon takibi bulunamadı."
        )
    
    try:
        # Ölçümleri formatla
        measurements = [
            {
                "measurement_time": f"{m.measurement_time.hour:02d}:{m.measurement_time.minute:02d}",
                "systolic": m.systolic,
                "diastolic": m.diastolic,
            }
            for m in tracking.measurements
        ]
        
        # Güncelle ve bildirim gönder
        tracking = update_blood_pressure_tracking(
            db=db,
            tracking_id=tracking_id,
            patient_id=current_user.id,
            measurements=measurements,
            send_notification=True,
        )
        
        return _format_tracking_response(tracking)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        ) from exc


@router.put("/{tracking_id}", response_model=BloodPressureTrackingResponse)
def update_tracking(
    tracking_id: int,
    tracking_data: BloodPressureTrackingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mevcut bir tansiyon takibini günceller (sadece kayıt, bildirim göndermez)."""
    if not _is_citizen(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sadece hastalar tansiyon takibini güncelleyebilir."
        )
    
    try:
        tracking = update_blood_pressure_tracking(
            db=db,
            tracking_id=tracking_id,
            patient_id=current_user.id,
            measurements=[
                {
                    "measurement_time": m.measurement_time,
                    "systolic": m.systolic,
                    "diastolic": m.diastolic,
                }
                for m in tracking_data.measurements
            ],
            send_notification=False,
        )
        
        return _format_tracking_response(tracking)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        ) from exc


@router.get("/my", response_model=List[BloodPressureTrackingListResponse])
def get_my_trackings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Hastanın tüm tansiyon takiplerini listeler."""
    if not _is_citizen(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sadece hastalar tansiyon takiplerini görebilir."
        )
    
    trackings = get_blood_pressure_trackings(db, current_user.id)
    
    result = []
    for tracking in trackings:
        completed_count = sum(
            1 for m in tracking.measurements
            if m.systolic is not None and m.diastolic is not None
        )
        result.append({
            "id": tracking.id,
            "date": tracking.date,
            "start_time": f"{tracking.start_time.hour:02d}:{tracking.start_time.minute:02d}",
            "end_time": f"{tracking.end_time.hour:02d}:{tracking.end_time.minute:02d}",
            "period_hours": tracking.period_hours,
            "measurement_count": len(tracking.measurements),
            "completed_count": completed_count,
            "is_completed": tracking.is_completed,
            "created_at": tracking.created_at,
        })
    
    return result


@router.get("/{tracking_id}", response_model=BloodPressureTrackingResponse)
def get_tracking(
    tracking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Belirli bir tansiyon takibini getirir."""
    if not _is_citizen(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sadece hastalar tansiyon takibini görebilir."
        )
    
    tracking = get_blood_pressure_tracking_by_id(db, tracking_id, current_user.id)
    if not tracking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tansiyon takibi bulunamadı."
        )
    
    return _format_tracking_response(tracking)


@router.get("/doctor/all", response_model=List[BloodPressureTrackingResponse])
def get_all_doctor_trackings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Doktorun onaylı tüm hastalarının tansiyon takiplerini getirir."""
    if not _is_doctor(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sadece doktorlar erişebilir."
        )
    
    trackings = get_doctor_blood_pressure_trackings(db, current_user.id)
    return [_format_tracking_response(t, include_patient=True) for t in trackings]


@router.get("/doctor/patients/{patient_id}/trackings", response_model=List[BloodPressureTrackingResponse])
def get_patient_trackings_for_doctor(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Doktor, onaylı hastasının tansiyon takiplerini görüntüler."""
    if not _is_doctor(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sadece doktorlar erişebilir."
        )
    
    try:
        trackings = get_doctor_patient_blood_pressure_trackings(db, current_user.id, patient_id)
        return [_format_tracking_response(t, include_patient=True) for t in trackings]
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        ) from exc


@router.patch("/{tracking_id}/doctor-comment", response_model=BloodPressureTrackingResponse)
def update_doctor_comment(
    tracking_id: int,
    comment_data: BloodPressureTrackingUpdateComment,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Doktor, tansiyon takibine yorum ekler/günceller."""
    if not _is_doctor(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sadece doktorlar yorum ekleyebilir."
        )
    
    # Doktor-hasta ilişkisini kontrol et
    from app.models.doctor_patient import DoctorPatient
    
    tracking = get_blood_pressure_tracking_by_id(db, tracking_id)
    if not tracking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tansiyon takibi bulunamadı."
        )
    
    relation = (
        db.query(DoctorPatient)
        .filter(
            DoctorPatient.doctor_id == current_user.id,
            DoctorPatient.patient_id == tracking.patient_id,
            DoctorPatient.status == "onaylandı"
        )
        .first()
    )
    
    if not relation:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu hasta size ait değil veya onaylanmamış."
        )
    
    tracking.doctor_comment = comment_data.doctor_comment
    db.commit()
    db.refresh(tracking)
    
    # Bildirim gönder
    from app.services.notification_service import notify
    notify(
        db=db,
        user_id=tracking.patient_id,
        event="doctor_comment",
        title="Doktor Yorum Ekledi",
        body=f"{current_user.name} tansiyon takibiniz için yorum yaptı.",
        metadata={"tracking_id": tracking.id}
    )
    
    return _format_tracking_response(tracking, include_patient=True)


def _format_tracking_response(tracking, include_patient: bool = False) -> BloodPressureTrackingResponse:
    """Tracking objesini response formatına çevirir."""
    from app.schemas.doctor_patient import PatientOut
    
    patient_data = None
    if include_patient and tracking.patient:
        patient_data = PatientOut(
            id=tracking.patient.id,
            name=tracking.patient.name,
            email=tracking.patient.email,
            phone=tracking.patient.phone,
            age=tracking.patient.age,
            gender=tracking.patient.gender,
            note=getattr(tracking.patient, 'note', None),
            blood_type=tracking.patient.blood_type,
            chronic_diseases=tracking.patient.chronic_diseases,
            allergies=tracking.patient.allergies,
        )
    
    return BloodPressureTrackingResponse(
        id=tracking.id,
        patient_id=tracking.patient_id,
        date=tracking.date,
        start_time=f"{tracking.start_time.hour:02d}:{tracking.start_time.minute:02d}",
        end_time=f"{tracking.end_time.hour:02d}:{tracking.end_time.minute:02d}",
        period_hours=tracking.period_hours,
        is_completed=tracking.is_completed,
        doctor_comment=tracking.doctor_comment,
        created_at=tracking.created_at,
        updated_at=tracking.updated_at,
        measurements=[
            {
                "id": m.id,
                "tracking_id": m.tracking_id,
                "measurement_time": f"{m.measurement_time.hour:02d}:{m.measurement_time.minute:02d}",
                "systolic": m.systolic,
                "diastolic": m.diastolic,
                "created_at": m.created_at,
                "updated_at": m.updated_at,
            }
            for m in tracking.measurements
        ],
        patient=patient_data,
    )
