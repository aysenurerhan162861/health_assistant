from datetime import datetime, timedelta
from typing import Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from app.models.meal import Meal
from app.models.lab_report import LabReport
from app.gemini_client import analyze_meal, analyze_nutrition_trends
from app.models.user import User


def _latest_lab_report_summary(db: Session, patient_id: int) -> str:
    latest = (
        db.query(LabReport)
        .filter(LabReport.patient_id == patient_id)
        .order_by(LabReport.upload_date.desc())
        .first()
    )
    if not latest:
        return "Son tahlil bulunamadı."

    parsed = latest.parsed_data or {}
    return f"Son tahlil tarihi: {latest.upload_date}. Özet: {parsed}"


def create_meal(
    db: Session,
    *,
    patient: User,
    meal_type: str,
    meal_datetime: Optional[datetime],
    text_description: Optional[str],
    image_path: Optional[str],
) -> Meal:
    if ((not text_description) or (not text_description.strip())) and not image_path:
        raise ValueError("Metin veya fotoğraf zorunludur.")

    meal_dt = meal_datetime or datetime.utcnow()

    # İlk kayıtta AI analizi yapma; alanları boş bırak
    meal = Meal(
        patient_id=patient.id,
        meal_datetime=meal_dt,
        meal_type=meal_type,
        text_description=text_description,
        image_path=image_path,
        gemini_calorie=None,
        gemini_comment=None,
        doctor_comment=None,
    )
    db.add(meal)
    db.commit()
    db.refresh(meal)

    # 🔔 Bildirimler:
    #  - Doktorlara: Bildirim ayarlarına göre (meal_uploaded event'i kontrol edilir)
    #  - Hastaya: Bildirim ayarlarına göre (meal_uploaded event'i kontrol edilir)
    from app.models.doctor_patient import DoctorPatient
    from app.services.notification_service import notify
    
    # Onaylı doktorları bul (meal_notification_enabled kontrolü kaldırıldı, artık genel bildirim ayarları kullanılıyor)
    doctor_links = db.query(DoctorPatient).filter(
        DoctorPatient.patient_id == patient.id,
        DoctorPatient.status == "onaylandı"
    ).all()

    # Her doktora bildirim gönder (notify fonksiyonu kullanıcının bildirim ayarlarını kontrol edecek)
    for link in doctor_links:
        notify(
            db=db,
            user_id=link.doctor_id,
            event="meal_uploaded",
            title="Yeni Öğün Eklendi",
            body=f"Hastanız yeni bir öğün ekledi: {get_meal_type_label(meal_type)}",
            metadata={"meal_id": meal.id, "patient_id": patient.id}
        )

    # Hastanın kendisine bildirim gönder (notify fonksiyonu kullanıcının bildirim ayarlarını kontrol edecek)
    notify(
        db=db,
        user_id=patient.id,
        event="meal_uploaded",
        title="Öğünün kaydedildi",
        body=f"Yeni öğünün eklendi: {get_meal_type_label(meal_type)}",
        metadata={"meal_id": meal.id, "patient_id": patient.id}
    )

    return meal


def get_meal_type_label(meal_type: str) -> str:
    """Öğün tipini Türkçe'ye çevirir."""
    labels = {
        "sabah": "Sabah",
        "ogle": "Öğle",
        "aksam": "Akşam",
        "ara": "Ara Öğün",
        "diger": "Diğer",
    }
    return labels.get(meal_type, meal_type)


def analyze_meal_for_meal(
    db: Session,
    *,
    patient: User,
    meal_id: int,
) -> Meal:
    meal = db.query(Meal).filter(Meal.id == meal_id).first()
    if not meal:
        raise ValueError("Öğün bulunamadı.")
    if meal.patient_id != patient.id:
        raise ValueError("Bu öğün size ait değil.")

    try:
        lab_summary = _latest_lab_report_summary(db, patient.id)
        calorie, comment = analyze_meal(
            meal_type=meal.meal_type,
            text_description=meal.text_description,
            lab_report_summary=lab_summary,
            chronic_diseases=patient.chronic_diseases,
            allergies=patient.allergies,
            image_path=meal.image_path,
        )

        meal.gemini_calorie = calorie
        meal.gemini_comment = comment
        db.commit()
        db.refresh(meal)
    except Exception as e:
        # Gemini API hatası (kota, rate limit, vb.) durumunda
        # Öğünü boş bırak ama hata fırlat ki frontend'e bildir
        error_msg = str(e)
        if "quota" in error_msg.lower() or "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            raise ValueError("Gemini API kotası aşıldı veya rate limit'e takıldı. Lütfen daha sonra tekrar deneyin.")
        elif "403" in error_msg or "PERMISSION_DENIED" in error_msg:
            raise ValueError("Gemini API anahtarı geçersiz veya yetkisiz. Lütfen yöneticiye bildirin.")
        else:
            raise ValueError(f"AI analizi yapılamadı: {error_msg}")
    
    return meal


def list_meals(db: Session, patient_id: int):
    return (
        db.query(Meal)
        .filter(Meal.patient_id == patient_id)
        .order_by(Meal.meal_datetime.desc())
        .all()
    )


def update_meal_doctor_comment(db: Session, meal_id: int, doctor_comment: Optional[str]) -> Meal:
    meal = db.query(Meal).filter(Meal.id == meal_id).first()
    if not meal:
        raise ValueError("Öğün bulunamadı.")
    
    meal.doctor_comment = doctor_comment
    db.commit()
    db.refresh(meal)
    return meal


def get_doctor_patient_meals(db: Session, doctor_id: int, patient_id: int):
    """
    Doktorun onaylı hastasının öğünlerini getirir.
    Önce doktor-hasta ilişkisini kontrol eder.
    """
    from app.models.doctor_patient import DoctorPatient
    from sqlalchemy.orm import selectinload
    
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
    
    meals = (
        db.query(Meal)
        .filter(Meal.patient_id == patient_id)
        .options(selectinload(Meal.patient))
        .order_by(Meal.meal_datetime.desc())
        .all()
    )
    return meals


def get_doctor_meals(db: Session, doctor_id: int):
    """
    Doktorun onaylı tüm hastalarının öğünlerini getirir.
    Tahlil modülündeki get_lab_reports_by_doctor mantığı ile aynı.
    """
    from app.models.doctor_patient import DoctorPatient
    
    meals = (
        db.query(Meal)
        .join(DoctorPatient, Meal.patient_id == DoctorPatient.patient_id)
        .filter(DoctorPatient.doctor_id == doctor_id)
        .filter(DoctorPatient.status == "onaylandı")
        .order_by(Meal.meal_datetime.desc())
        .all()
    )
    return meals


def get_nutrition_trends_analysis(
    db: Session,
    patient: User,
) -> Dict[str, Any]:
    """
    Son 30 günlük öğün verilerini analiz edip beslenme trend analizi yapar.
    """
    # Son 30 günün başlangıç tarihi
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    # Son 30 günlük öğünleri getir (kalori bilgisi olanlar)
    meals = (
        db.query(Meal)
        .filter(
            Meal.patient_id == patient.id,
            Meal.meal_datetime >= thirty_days_ago,
            Meal.gemini_calorie.isnot(None)  # Sadece analiz edilmiş öğünler
        )
        .all()
    )
    
    if not meals:
        # Yeterli veri yoksa boş analiz döndür
        return {
            "summary": "Son 30 günde analiz edilmiş öğün bulunamadı. Öğünlerinizi analiz ettirmek için 'Analiz Et' butonunu kullanabilirsiniz.",
            "positives": [],
            "warnings": ["Yeterli veri bulunamadı. Daha fazla öğün ekleyip analiz ettirin."],
            "recommendations": ["Öğünlerinizi düzenli olarak kaydedin ve analiz ettirin."],
            "statistics": {
                "avg_daily_calories": 0,
                "total_meals": 0,
                "unique_days": 0,
                "breakfast_skipped": 30,
                "protein_ratio": 0,
                "carb_ratio": 0,
                "fat_ratio": 0,
                "daily_calories_trend": [],
                "meal_counts": {
                    "sabah": 0,
                    "ogle": 0,
                    "aksam": 0,
                    "ara": 0,
                    "diger": 0,
                },
            }
        }
    
    # Ortalama günlük kalori hesapla
    total_calories = sum(meal.gemini_calorie for meal in meals if meal.gemini_calorie)
    # Farklı gün sayısını hesapla
    unique_days = len(set(meal.meal_datetime.date() for meal in meals))
    avg_daily_calories = total_calories / unique_days if unique_days > 0 else 0
    
    # Makro besin dağılımı için basit bir tahmin yapalım
    # Gerçek uygulamada bu veriler öğün açıklamalarından çıkarılabilir
    # Şimdilik standart bir dağılım kullanıyoruz (gerçekte AI'dan alınabilir)
    # Protein: %20, Karbonhidrat: %50, Yağ: %30 (ortalama Türk diyeti)
    protein_ratio = 20.0
    carb_ratio = 50.0
    fat_ratio = 30.0
    
    # Kahvaltı atlanan gün sayısını hesapla
    # Son 30 günün her bir günü için kahvaltı var mı kontrol et
    breakfast_meals = [
        meal for meal in meals 
        if meal.meal_type == "sabah"
    ]
    breakfast_days = set(meal.meal_datetime.date() for meal in breakfast_meals)
    total_days = 30
    breakfast_skipped = total_days - len(breakfast_days)
    
    # Tahlil özeti
    lab_summary = _latest_lab_report_summary(db, patient.id)
    
    # Günlük kalori trendi hesapla (son 7 gün için)
    daily_calories = {}
    for meal in meals:
        date_key = meal.meal_datetime.date().isoformat()
        if date_key not in daily_calories:
            daily_calories[date_key] = 0
        if meal.gemini_calorie:
            daily_calories[date_key] += meal.gemini_calorie
    
    # Son 7 günün kalori verilerini hazırla
    last_7_days = []
    for i in range(6, -1, -1):
        date = (datetime.utcnow() - timedelta(days=i)).date()
        date_key = date.isoformat()
        last_7_days.append({
            "date": date_key,
            "calories": daily_calories.get(date_key, 0)
        })
    
    # Toplam öğün sayıları
    meal_counts = {
        "sabah": len([m for m in meals if m.meal_type == "sabah"]),
        "ogle": len([m for m in meals if m.meal_type == "ogle"]),
        "aksam": len([m for m in meals if m.meal_type == "aksam"]),
        "ara": len([m for m in meals if m.meal_type == "ara"]),
        "diger": len([m for m in meals if m.meal_type == "diger"]),
    }
    
    # Gemini AI ile trend analizi yap
    try:
        analysis = analyze_nutrition_trends(
            ortalama_kalori=round(avg_daily_calories, 1),
            protein_orani=protein_ratio,
            karbonhidrat_orani=carb_ratio,
            yag_orani=fat_ratio,
            kahvalti_atlanan=breakfast_skipped,
            hastaliklar=patient.chronic_diseases,
            tahlil_ozeti=lab_summary,
        )
        
        # İstatistikleri de ekle
        analysis["statistics"] = {
            "avg_daily_calories": round(avg_daily_calories, 1),
            "total_meals": len(meals),
            "unique_days": unique_days,
            "breakfast_skipped": breakfast_skipped,
            "protein_ratio": protein_ratio,
            "carb_ratio": carb_ratio,
            "fat_ratio": fat_ratio,
            "daily_calories_trend": last_7_days,
            "meal_counts": meal_counts,
        }
        
        return analysis
    except Exception as e:
        # AI analizi başarısız olursa basit bir özet döndür
        error_msg = str(e)
        if "quota" in error_msg.lower() or "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            # İstatistikleri hesapla ama AI analizi olmadan döndür
            daily_calories = {}
            for meal in meals:
                date_key = meal.meal_datetime.date().isoformat()
                if date_key not in daily_calories:
                    daily_calories[date_key] = 0
                if meal.gemini_calorie:
                    daily_calories[date_key] += meal.gemini_calorie
            
            last_7_days = []
            for i in range(6, -1, -1):
                date = (datetime.utcnow() - timedelta(days=i)).date()
                date_key = date.isoformat()
                last_7_days.append({
                    "date": date_key,
                    "calories": daily_calories.get(date_key, 0)
                })
            
            meal_counts = {
                "sabah": len([m for m in meals if m.meal_type == "sabah"]),
                "ogle": len([m for m in meals if m.meal_type == "ogle"]),
                "aksam": len([m for m in meals if m.meal_type == "aksam"]),
                "ara": len([m for m in meals if m.meal_type == "ara"]),
                "diger": len([m for m in meals if m.meal_type == "diger"]),
            }
            
            total_calories = sum(meal.gemini_calorie for meal in meals if meal.gemini_calorie)
            unique_days = len(set(meal.meal_datetime.date() for meal in meals))
            avg_daily_calories = total_calories / unique_days if unique_days > 0 else 0
            
            breakfast_meals = [meal for meal in meals if meal.meal_type == "sabah"]
            breakfast_days = set(meal.meal_datetime.date() for meal in breakfast_meals)
            breakfast_skipped = 30 - len(breakfast_days)
            
            return {
                "summary": "Analiz şu anda yapılamıyor. Lütfen daha sonra tekrar deneyin.",
                "positives": [],
                "warnings": ["AI analizi geçici olarak kullanılamıyor."],
                "recommendations": ["Lütfen daha sonra tekrar deneyin."],
                "statistics": {
                    "avg_daily_calories": round(avg_daily_calories, 1),
                    "total_meals": len(meals),
                    "unique_days": unique_days,
                    "breakfast_skipped": breakfast_skipped,
                    "protein_ratio": protein_ratio,
                    "carb_ratio": carb_ratio,
                    "fat_ratio": fat_ratio,
                    "daily_calories_trend": last_7_days,
                    "meal_counts": meal_counts,
                }
            }
        else:
            raise ValueError(f"Trend analizi yapılamadı: {error_msg}")

