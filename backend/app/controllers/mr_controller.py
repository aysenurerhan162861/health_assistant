import os
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database import get_db
from app.models.mr_scan import MrScan
from app.models.doctor_patient import DoctorPatient
from app.schemas.mr_schema import MrScanResult, MrScanList
from app.utils.auth import verify_token
from app.models.user import User
from fastapi.responses import FileResponse

router = APIRouter()

UPLOAD_DIR = "uploads/mr_scans"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".nii", ".nii.gz", ".dcm", ".zip"}


def get_current_user_id(
    token_header: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> int:
    if not token_header:
        raise HTTPException(status_code=401, detail="Token gerekli.")
    token = token_header.replace("Bearer ", "")
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Geçersiz token.")
    email = payload.get("sub")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
    return user.id


def _is_allowed(filename: str) -> bool:
    fn = filename.lower()
    return (fn.endswith(".nii") or fn.endswith(".nii.gz") or
            fn.endswith(".dcm") or fn.endswith(".zip"))


@router.get("/{scan_id}/gradcam")
def get_gradcam(scan_id: int, db: Session = Depends(get_db)):
    scan = db.query(MrScan).filter(MrScan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="MR taraması bulunamadı.")
    if not scan.gradcam_path or not os.path.exists(scan.gradcam_path):
        raise HTTPException(status_code=404, detail="Attention haritası henüz oluşturulmadı.")
    return FileResponse(scan.gradcam_path, media_type="image/png")


@router.post("/upload", response_model=MrScanResult)
async def upload_mr_scan(
    patient_id: int = Form(...),
    files: List[UploadFile] = File(default=...),
    db: Session = Depends(get_db)
):
    """
    Desteklenen formatlar:
    - .nii / .nii.gz  — direkt NIfTI
    - .dcm            — DICOM dosyaları (birden fazla)
    - .zip            — DICOM'ları içeren ZIP arşivi

    Sistem DWI ve ADC sekanslarını otomatik tespit eder.
    """
    from app.services.mr_selector import select_dwi_adc_pair
    from app.services.dicom_converter import convert_dicoms, extract_zip_and_convert

    # ── 1. Dosyaları kaydet ──────────────────────────────────────────
    saved_nii:  List[str] = []
    saved_dcm:  List[str] = []
    saved_zip:  List[str] = []
    rejected:   List[str] = []

    for file in files:
        if not _is_allowed(file.filename):
            rejected.append(file.filename)
            continue

        dest = os.path.join(UPLOAD_DIR, f"{patient_id}_{file.filename}")
        with open(dest, "wb") as f:
            shutil.copyfileobj(file.file, f)

        fn = file.filename.lower()
        if fn.endswith(".nii") or fn.endswith(".nii.gz"):
            saved_nii.append(dest)
        elif fn.endswith(".dcm"):
            saved_dcm.append(dest)
        elif fn.endswith(".zip"):
            saved_zip.append(dest)

    if not saved_nii and not saved_dcm and not saved_zip:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Geçerli dosya bulunamadı. "
                f"Desteklenen formatlar: .nii, .nii.gz, .dcm, .zip. "
                f"Reddedilen: {', '.join(rejected)}"
            )
        )

    # ── 2. DICOM → NIfTI çevirme ─────────────────────────────────────
    nifti_dir = os.path.join(UPLOAD_DIR, f"{patient_id}_converted")

    if saved_dcm:
        print(f"[upload] {len(saved_dcm)} DICOM dosyası NIfTI'ye çevriliyor...")
        converted = convert_dicoms(saved_dcm, nifti_dir)
        saved_nii.extend(converted)
        # Orijinal DICOM'ları temizle
        for p in saved_dcm:
            try: os.remove(p)
            except OSError: pass

    if saved_zip:
        for zip_path in saved_zip:
            print(f"[upload] ZIP çıkarılıyor: {os.path.basename(zip_path)}")
            converted = extract_zip_and_convert(zip_path, nifti_dir)
            saved_nii.extend(converted)
            try: os.remove(zip_path)
            except OSError: pass

    if not saved_nii:
        raise HTTPException(
            status_code=422,
            detail="DICOM/ZIP dosyaları NIfTI'ye çevrilemedi. Lütfen geçerli MR görüntüleri yükleyin."
        )

    # ── 3. DWI + ADC çiftini seç ─────────────────────────────────────
   # ── 3. DWI + ADC çiftini seç ─────────────────────────────────────
    if len(saved_nii) == 1:
        file_paths = select_dwi_adc_pair(saved_nii)
        if file_paths is None or file_paths.get('error') == 'NO_DWI':
            for p in saved_nii:
                try:
                    os.remove(p)
                except OSError:
                    pass
            raise HTTPException(
                status_code=422,
                detail=(
                    "Bu MR paketinde inme analizi için gereken DWI sekansı bulunamadı. "
                    "Yüklediğiniz paket rutin beyin MR görüntülerini içeriyor. "
                    "İnme analizi için doktorunuzdan DWI ve ADC sekanslarını içeren "
                    "bir MR çektirmeniz gerekmektedir."
                )
            )
        selected_reason = "Tek DWI dosyası — DWI ve ADC olarak kullanıldı."
    else:
        file_paths = select_dwi_adc_pair(saved_nii)

        if file_paths is None or file_paths.get('error') == 'NO_DWI':
            for p in saved_nii:
                try:
                    os.remove(p)
                except OSError:
                    pass
            raise HTTPException(
                status_code=422,
                detail=(
                    "Bu MR paketinde inme analizi için gereken DWI (Diffusion Weighted Imaging) "
                    "sekansı bulunamadı. Yüklediğiniz paket rutin beyin MR görüntülerini içeriyor. "
                    "İnme analizi yapılabilmesi için doktorunuzdan DWI ve ADC sekanslarını içeren "
                    "bir MR çektirmeniz gerekmektedir."
                )
            )

        selected_reason = (
            f"{len(saved_nii)} dosya arasından otomatik seçildi — "
            f"DWI: {os.path.basename(file_paths['dwi'])} | "
            f"ADC: {os.path.basename(file_paths['adc'])}"
        )

    # Seçilmeyen dosyaları temizle
    selected = set(file_paths.values())
    for path in saved_nii:
        if path not in selected:
            try: os.remove(path)
            except OSError: pass

    # ── 4. DB kaydı ──────────────────────────────────────────────────
    scan = MrScan(
        patient_id=patient_id,
        file_name=files[0].filename,
        file_path=file_paths['dwi'],
        status="pending",
        ai_comment=selected_reason,
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)

    # ── 5. Doktor ve asistanlara bildirim ────────────────────────────
    from app.services.notification_service import notify_event
    from app.models.doctor_patient import DoctorPatient as _DP

    doctor_rel = db.query(_DP).filter(
        _DP.patient_id == patient_id,
        _DP.status == "onaylandı"
    ).first()
    if doctor_rel:
        await notify_event(
            db=db,
            user_id=doctor_rel.doctor_id,
            event_name="mr_uploaded",
            title="Hasta MR Görüntüsü Yükledi",
            body=f"Hasta #{patient_id} yeni bir MR görüntüsü yükledi."
        )
        try:
            from app.models.assistant_patient_permission import AssistantPatientPermission
            assistants = db.query(AssistantPatientPermission).filter(
                AssistantPatientPermission.patient_id == patient_id,
                AssistantPatientPermission.status == "active",
                AssistantPatientPermission.can_view_mr == True
            ).all()
            for ap in assistants:
                await notify_event(
                    db=db,
                    user_id=ap.assistant_id,
                    event_name="mr_uploaded",
                    title="Hasta MR Görüntüsü Yükledi",
                    body=f"Hasta #{patient_id} yeni bir MR görüntüsü yükledi."
                )
        except Exception:
            pass

    # ── 6. Celery task başlat ─────────────────────────────────────────
    from app.tasks.mr_tasks import analyze_mr
    analyze_mr.delay(scan.id, file_paths, patient_id)

    return scan


# ── Diğer endpoint'ler değişmedi ─────────────────────────────────────

@router.get("/patient/{patient_id}", response_model=list[MrScanList])
def get_patient_scans(patient_id: int, db: Session = Depends(get_db)):
    return (
        db.query(MrScan)
        .filter(MrScan.patient_id == patient_id)
        .order_by(MrScan.upload_date.desc())
        .all()
    )


@router.get("/doctor/me", response_model=list[MrScanList])
def get_my_patient_scans(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    return (
        db.query(MrScan)
        .join(DoctorPatient, MrScan.patient_id == DoctorPatient.patient_id)
        .filter(DoctorPatient.doctor_id == current_user_id)
        .filter(DoctorPatient.status == "onaylandı")
        .order_by(MrScan.upload_date.desc())
        .all()
    )


@router.get("/doctor/{doctor_id}", response_model=list[MrScanList])
def get_doctor_scans(doctor_id: int, db: Session = Depends(get_db)):
    return (
        db.query(MrScan)
        .join(DoctorPatient, MrScan.patient_id == DoctorPatient.patient_id)
        .filter(DoctorPatient.doctor_id == doctor_id)
        .filter(DoctorPatient.status == "onaylandı")
        .order_by(MrScan.upload_date.desc())
        .all()
    )


@router.patch("/{scan_id}/doctor-comment", response_model=MrScanResult)
def update_doctor_comment(
    scan_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    scan = db.query(MrScan).filter(MrScan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="MR taraması bulunamadı.")
    scan.doctor_comment = payload.get("doctor_comment", "")
    scan.viewed_by_doctor = True
    db.commit()
    db.refresh(scan)

    # 🔔 Hasta için bildirim
    try:
        doctor = db.query(User).filter(User.id == current_user_id).first()
        doctor_name = doctor.name if doctor else "Doktorunuz"
        from app.services.notification_service import notify
        notify(
            db=db,
            user_id=scan.patient_id,
            event="doctor_comment",
            title="Doktor Yorum Ekledi",
            body=f"{doctor_name} MR görüntünüz için yorum yaptı.",
            metadata={"scan_id": scan.id}
        )
    except Exception:
        pass

    return scan


@router.get("/{scan_id}", response_model=MrScanResult)
def get_scan_detail(scan_id: int, db: Session = Depends(get_db)):
    scan = db.query(MrScan).filter(MrScan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="MR taraması bulunamadı.")
    return scan


@router.get("/{scan_id}/file")
def download_mr_file(scan_id: int, db: Session = Depends(get_db)):
    scan = db.query(MrScan).filter(MrScan.id == scan_id).first()
    if not scan or not os.path.exists(scan.file_path):
        raise HTTPException(status_code=404, detail="Dosya bulunamadı.")
    return FileResponse(scan.file_path, filename=scan.file_name, media_type="application/octet-stream")