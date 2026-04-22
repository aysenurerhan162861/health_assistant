from datetime import date, time, datetime
from typing import List, Optional
from sqlalchemy.orm import Session, selectinload
from app.models.blood_pressure_tracking import BloodPressureTracking
from app.models.blood_pressure_measurement import BloodPressureMeasurement
from app.models.user import User
from app.models.doctor_patient import DoctorPatient


def parse_time(time_str: str) -> time:
    """'HH:MM' formatındaki string'i time objesine çevirir."""
    parts = time_str.split(":")
    if len(parts) != 2:
        raise ValueError("Zaman formatı 'HH:MM' olmalıdır.")
    return time(int(parts[0]), int(parts[1]))


def generate_measurement_times(start_time_str: str, end_time_str: str, period_hours: int) -> List[str]:
    """
    Başlangıç ve bitiş saatleri arasında periyoda göre ölçüm saatlerini oluşturur.
    Örnek: 08:00 - 20:00, periyot 2 saat -> ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00']
    """
    start = parse_time(start_time_str)
    end = parse_time(end_time_str)
    
    # Start ve end'i dakikaya çevir
    start_minutes = start.hour * 60 + start.minute
    end_minutes = end.hour * 60 + end.minute
    
    if start_minutes >= end_minutes:
        raise ValueError("Bitiş saati başlangıç saatinden sonra olmalıdır.")
    
    period_minutes = period_hours * 60
    times = []
    
    current_minutes = start_minutes
    while current_minutes <= end_minutes:
        hours = current_minutes // 60
        minutes = current_minutes % 60
        times.append(f"{hours:02d}:{minutes:02d}")
        current_minutes += period_minutes
    
    return times


def create_blood_pressure_tracking(
    db: Session,
    patient: User,
    tracking_date: date,
    start_time_str: str,
    end_time_str: str,
    period_hours: int,
    measurements: List[dict],
    send_notification: bool = False,
) -> BloodPressureTracking:
    """
    Yeni bir tansiyon takibi oluşturur.
    measurements: [{"measurement_time": "08:00", "systolic": 120, "diastolic": 80}, ...]
    """
    # Zaman formatlarını kontrol et
    start_time = parse_time(start_time_str)
    end_time = parse_time(end_time_str)
    
    if period_hours <= 0:
        raise ValueError("Periyot 0'dan büyük olmalıdır.")
    
    # Ölçüm saatlerini oluştur
    expected_times = generate_measurement_times(start_time_str, end_time_str, period_hours)
    
    # Tracking kaydını oluştur
    tracking = BloodPressureTracking(
        patient_id=patient.id,
        date=tracking_date,
        start_time=start_time,
        end_time=end_time,
        period_hours=period_hours,
        is_completed="eksik",
    )
    db.add(tracking)
    db.flush()  # ID'yi almak için
    
    # Ölçümleri oluştur
    measurement_dict = {m["measurement_time"]: m for m in measurements}
    completed_count = 0
    
    for expected_time in expected_times:
        measurement_data = measurement_dict.get(expected_time, {})
        measurement = BloodPressureMeasurement(
            tracking_id=tracking.id,
            measurement_time=parse_time(expected_time),
            systolic=measurement_data.get("systolic"),
            diastolic=measurement_data.get("diastolic"),
        )
        db.add(measurement)
        
        # Eğer hem sistolik hem diyastolik doldurulmuşsa tamamlanmış say
        if measurement.systolic is not None and measurement.diastolic is not None:
            completed_count += 1
    
    # Tüm ölçümler doldurulmuşsa tamamlandı olarak işaretle
    if completed_count == len(expected_times):
        tracking.is_completed = "tamamlandı"
    
    db.commit()
    db.refresh(tracking)
    
    # Bildirim gönder
    if send_notification:
        from app.services.notification_service import notify

        # Onaylı doktorları bul
        doctor_links = db.query(DoctorPatient).filter(
            DoctorPatient.patient_id == patient.id,
            DoctorPatient.status == "onaylandı"
        ).all()

        for link in doctor_links:
            notify(
                db=db,
                user_id=link.doctor_id,
                event="blood_pressure_completed",
                title="Tansiyon Takibi Tamamlandı",
                body="Hastanız günlük tansiyon takibini tamamladı.",
                metadata={"tracking_id": tracking.id, "patient_id": patient.id}
            )

        # Aktif asistanlara bildirim
        try:
            from app.models.assistant_patient_permission import AssistantPatientPermission
            assistants = db.query(AssistantPatientPermission).filter(
                AssistantPatientPermission.patient_id == patient.id,
                AssistantPatientPermission.status == "active"
            ).all()
            for ap in assistants:
                notify(
                    db=db,
                    user_id=ap.assistant_id,
                    event="blood_pressure_completed",
                    title="Hasta Tansiyon Tamamladı",
                    body="Takip ettiğiniz hasta günlük tansiyon takibini tamamladı.",
                    metadata={"tracking_id": tracking.id, "patient_id": patient.id}
                )
        except Exception:
            pass

    return tracking


def get_blood_pressure_trackings(db: Session, patient_id: int) -> List[BloodPressureTracking]:
    """Hastanın tüm tansiyon takiplerini getirir."""
    return (
        db.query(BloodPressureTracking)
        .options(selectinload(BloodPressureTracking.measurements))
        .filter(BloodPressureTracking.patient_id == patient_id)
        .order_by(BloodPressureTracking.date.desc(), BloodPressureTracking.created_at.desc())
        .all()
    )


def get_blood_pressure_tracking_by_id(
    db: Session,
    tracking_id: int,
    patient_id: Optional[int] = None,
) -> Optional[BloodPressureTracking]:
    """Belirli bir tansiyon takibini getirir."""
    query = (
        db.query(BloodPressureTracking)
        .options(selectinload(BloodPressureTracking.measurements))
        .filter(BloodPressureTracking.id == tracking_id)
    )
    
    if patient_id:
        query = query.filter(BloodPressureTracking.patient_id == patient_id)
    
    return query.first()


def update_blood_pressure_tracking(
    db: Session,
    tracking_id: int,
    patient_id: int,
    measurements: List[dict],
    send_notification: bool = False,
) -> BloodPressureTracking:
    """
    Mevcut bir tansiyon takibini günceller.
    measurements: [{"measurement_time": "08:00", "systolic": 120, "diastolic": 80}, ...]
    """
    tracking = get_blood_pressure_tracking_by_id(db, tracking_id, patient_id)
    if not tracking:
        raise ValueError("Tansiyon takibi bulunamadı.")
    
    # Mevcut ölçümleri getir
    existing_measurements = {
        f"{m.measurement_time.hour:02d}:{m.measurement_time.minute:02d}": m
        for m in tracking.measurements
    }
    
    # Ölçümleri güncelle veya oluştur
    completed_count = 0
    
    for measurement_data in measurements:
        measurement_time_str = measurement_data["measurement_time"]
        measurement_time = parse_time(measurement_time_str)
        
        if measurement_time_str in existing_measurements:
            # Mevcut ölçümü güncelle
            measurement = existing_measurements[measurement_time_str]
            measurement.systolic = measurement_data.get("systolic")
            measurement.diastolic = measurement_data.get("diastolic")
        else:
            # Yeni ölçüm oluştur
            measurement = BloodPressureMeasurement(
                tracking_id=tracking.id,
                measurement_time=measurement_time,
                systolic=measurement_data.get("systolic"),
                diastolic=measurement_data.get("diastolic"),
            )
            db.add(measurement)
        
        # Tamamlanmış say
        if measurement.systolic is not None and measurement.diastolic is not None:
            completed_count += 1
    
    # Tüm ölçümleri yeniden yükle ve tamamlanma durumunu kontrol et
    db.flush()  # Yeni eklenen ölçümleri DB'ye yaz
    db.refresh(tracking)
    
    # Tüm ölçümlerin tamamlanma durumunu kontrol et
    total_measurements = len(tracking.measurements)
    if total_measurements == 0:
        tracking.is_completed = "eksik"
    else:
        # Tüm ölçümlerin hem sistolik hem diyastolik değerleri var mı kontrol et
        all_completed = all(
            m.systolic is not None and m.diastolic is not None
            for m in tracking.measurements
        )
        tracking.is_completed = "tamamlandı" if all_completed else "eksik"
    
    db.commit()
    db.refresh(tracking)
    
    # Bildirim gönder
    if send_notification:
        from app.services.notification_service import notify

        doctor_links = db.query(DoctorPatient).filter(
            DoctorPatient.patient_id == patient_id,
            DoctorPatient.status == "onaylandı"
        ).all()

        for link in doctor_links:
            notify(
                db=db,
                user_id=link.doctor_id,
                event="blood_pressure_completed",
                title="Tansiyon Takibi Tamamlandı",
                body="Hastanız günlük tansiyon takibini tamamladı.",
                metadata={"tracking_id": tracking.id, "patient_id": patient_id}
            )

        # Aktif asistanlara bildirim
        try:
            from app.models.assistant_patient_permission import AssistantPatientPermission
            assistants = db.query(AssistantPatientPermission).filter(
                AssistantPatientPermission.patient_id == patient_id,
                AssistantPatientPermission.status == "active"
            ).all()
            for ap in assistants:
                notify(
                    db=db,
                    user_id=ap.assistant_id,
                    event="blood_pressure_completed",
                    title="Hasta Tansiyon Tamamladı",
                    body="Takip ettiğiniz hasta günlük tansiyon takibini tamamladı.",
                    metadata={"tracking_id": tracking.id, "patient_id": patient_id}
                )
        except Exception:
            pass

    return tracking


def get_doctor_blood_pressure_trackings(db: Session, doctor_id: int) -> List[BloodPressureTracking]:
    """
    Doktorun onaylı tüm hastalarının tansiyon takiplerini getirir.
    """
    from app.models.doctor_patient import DoctorPatient
    
    trackings = (
        db.query(BloodPressureTracking)
        .options(selectinload(BloodPressureTracking.measurements))
        .join(DoctorPatient, BloodPressureTracking.patient_id == DoctorPatient.patient_id)
        .filter(DoctorPatient.doctor_id == doctor_id)
        .filter(DoctorPatient.status == "onaylandı")
        .order_by(BloodPressureTracking.date.desc(), BloodPressureTracking.created_at.desc())
        .all()
    )
    return trackings


def get_doctor_patient_blood_pressure_trackings(
    db: Session,
    doctor_id: int,
    patient_id: int,
) -> List[BloodPressureTracking]:
    """
    Doktorun onaylı hastasının tansiyon takiplerini getirir.
    Önce doktor-hasta ilişkisini kontrol eder.
    """
    from app.models.doctor_patient import DoctorPatient
    
    # Doktor-hasta ilişkisini kontrol et
    relation = (
        db.query(DoctorPatient)
        .filter(
            DoctorPatient.doctor_id == doctor_id,
            DoctorPatient.patient_id == patient_id,
            DoctorPatient.status == "onaylandı"
        )
        .first()
    )
    
    if not relation:
        raise ValueError("Bu hasta size ait değil veya onaylanmamış.")
    
    trackings = (
        db.query(BloodPressureTracking)
        .options(
            selectinload(BloodPressureTracking.measurements),
            selectinload(BloodPressureTracking.patient)
        )
        .filter(BloodPressureTracking.patient_id == patient_id)
        .order_by(BloodPressureTracking.date.desc(), BloodPressureTracking.created_at.desc())
        .all()
    )
    return trackings

