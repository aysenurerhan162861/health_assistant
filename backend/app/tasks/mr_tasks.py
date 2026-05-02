"""
backend/app/tasks/mr_tasks.py
V6 — FIXED CLINICAL ResUNet3D + Robust Decision Engine

✔ False positive azaltıldı
✔ Healthy case stabil hale getirildi
✔ Lesion selection improved (top-k + CC filtering)
✔ Adaptive threshold gating
✔ Voxel estimation stabilized
✔ Küçük şüphe alanları için klinik uyarı (V6.1)
"""

import os
import sys
import json
import numpy as np
import nibabel as nib
import torch

from scipy.ndimage import label, binary_erosion, binary_fill_holes

from app.celery_app import celery_app
from app.database import SessionLocal


# ─────────────────────────────
# MODEL LOAD
# ─────────────────────────────
ML_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'ml')
sys.path.insert(0, os.path.abspath(ML_DIR))

from model import ResUNet3D_DS

INFO_PATH = os.path.join(ML_DIR, 'model_info.json')
CKPT_PATH = os.path.join(ML_DIR, 'best_model.pt')

with open(INFO_PATH) as f:
    MODEL_INFO = json.load(f)

PATCH_SIZE = tuple(MODEL_INFO['patch_size'])
OVERLAP = MODEL_INFO.get('sliding_window_overlap', 0.5)

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

_model = ResUNet3D_DS(
    in_ch=MODEL_INFO['input_channels'],
    out_ch=1,
    filters=MODEL_INFO['filters'],
    dropout=0.0
).to(device)

_ckpt = torch.load(CKPT_PATH, map_location=device)
_model.load_state_dict(_ckpt['model_state_dict'])
_model.eval()

print(f"[V6] Model loaded | Patch: {PATCH_SIZE} | Device: {device}")


# ─────────────────────────────
# PREPROCESSING
# ─────────────────────────────
def _load_volume(file_path):
    vol = nib.load(file_path).get_fdata()
    if vol.ndim == 4:
        vol = vol[..., 0]

    brain = vol[vol > 0]
    if len(brain) == 0:
        return vol.astype(np.float32)

    p1, p99 = np.percentile(brain, [0.5, 99.5])
    vol = np.clip(vol, p1, p99)

    mean = brain.mean()
    std = brain.std() + 1e-8
    vol = (vol - mean) / std
    vol = np.clip(vol, -3, 3)

    return vol.astype(np.float32)


# ─────────────────────────────
# SLIDING WINDOW
# ─────────────────────────────
def sliding_window(dwi, adc):
    pd, ph, pw = PATCH_SIZE
    D, H, W = dwi.shape

    stride_d = max(1, int(pd * (1 - OVERLAP)))
    stride_h = max(1, int(ph * (1 - OVERLAP)))
    stride_w = max(1, int(pw * (1 - OVERLAP)))

    pred = np.zeros((D, H, W), np.float32)
    count = np.zeros((D, H, W), np.float32)

    with torch.no_grad():
        for d in range(0, max(1, D - pd + 1), stride_d):
            for h in range(0, max(1, H - ph + 1), stride_h):
                for w in range(0, max(1, W - pw + 1), stride_w):

                    dp = dwi[d:d+pd, h:h+ph, w:w+pw]
                    ap = adc[d:d+pd, h:h+ph, w:w+pw]

                    inp = np.stack([dp, ap], 0)
                    inp = torch.tensor(inp).unsqueeze(0).to(device)

                    out = _model(inp)
                    prob = torch.sigmoid(out).cpu().numpy()[0, 0]

                    pred[d:d+pd, h:h+ph, w:w+pw] += prob
                    count[d:d+pd, h:h+ph, w:w+pw] += 1

    return pred / np.maximum(count, 1e-6)


# ─────────────────────────────
# 🔥 FIXED DECISION ENGINE (V6)
# ─────────────────────────────
def decision_engine(prob_map):

    # CLEAN THRESHOLDS
    soft_mask = prob_map > 0.35
    hard_mask = prob_map > 0.60

    labeled, n = label(soft_mask)

    if n == 0:
        return False, 0.0, 0.0, None, 0

    # ── keep top 2 components (FIX FP issue)
    sizes = [(labeled == i).sum() for i in range(1, n + 1)]
    top_idx = np.argsort(sizes)[::-1][:2]

    final_mask = np.zeros_like(prob_map, dtype=bool)

    for i in top_idx:
        final_mask |= (labeled == (i + 1))

    voxel_count = float(final_mask.sum())
    confidence = float(prob_map[final_mask].mean())

    # robust statistics
    high_conf_voxels = float((prob_map > 0.6).sum())

    # ham sinyal sayısı (temizlemeden önce)
    raw_signal = int(soft_mask.sum())

    lesion = False

    # ── SAFE RULES (IMPORTANT FIX)
    if confidence > 0.68 and voxel_count > 60:
        lesion = True

    if high_conf_voxels > 120:
        lesion = True

    # suppress false positives (CRITICAL)
    if voxel_count < 25:
        lesion = False

    if confidence < 0.50:
        lesion = False

    # HEALTHY CONTROL (VERY IMPORTANT FIX)
    if high_conf_voxels < 30 and voxel_count < 80:
        lesion = False

    return lesion, voxel_count, confidence, final_mask, raw_signal


# ─────────────────────────────
# COMMENT GENERATOR (V6.1)
# ─────────────────────────────
def _generate_comment(lesion_detected, lesion_volume, confidence, raw_signal=0):
    if not lesion_detected and raw_signal > 0:
        return (
            "MR goruntusunde belirgin bir lezyon tespit edilmemistir, "
            "ancak kucuk suphe alanlari gozlenmistir. "
            "Klinik bulgularla birlikte degerlendirilmesi ve "
            "gerekirse kontrol MR cekilmesi onerilir."
        )
    if not lesion_detected:
        return (
            "MR goruntusunde anlamli bir lezyon tespit edilmemistir. "
            "Klinik bulgularla birlikte degerlendirilmesi onerilir."
        )
    severity = "kucuk" if lesion_volume < 500 else "orta" if lesion_volume < 2000 else "buyuk"
    return (
        f"MR goruntusunde {severity} boyutta olasi bir lezyon tespit edilmistir "
        f"(yaklasik {int(lesion_volume)} voksel, guven skoru: {confidence:.2f}). "
        f"Kesin tani icin noroloji uzmani degerlendirmesi onerilir. "
        f"Bu sonuc yalnizca yardimci karar destek aracidir."
    )


# ─────────────────────────────
# TASK
# ─────────────────────────────
@celery_app.task(bind=True, name="mr_tasks.analyze_mr")
def analyze_mr(self, scan_id, file_paths, patient_id):

    db = SessionLocal()

    try:
        from app.models.mr_scan import MrScan
        from app.services.notification_service import notify
        from app.models.doctor_patient import DoctorPatient

        dwi = _load_volume(file_paths['dwi'])
        adc = _load_volume(file_paths['adc'])

        pred = sliding_window(dwi, adc)

        lesion, voxel, conf, mask, raw_signal = decision_engine(pred)

        print(f"[V6] Lesion: {lesion} | Vox: {voxel:.1f} | Conf: {conf:.3f} | Raw: {raw_signal}")

        mask_path = f"uploads/mask_{scan_id}.npy"
        if mask is not None:
            np.save(mask_path, mask.astype(np.uint8))
        else:
            np.save(mask_path, np.zeros((1,), dtype=np.uint8))

        comment = _generate_comment(lesion, voxel, conf, raw_signal)

        scan = db.query(MrScan).filter(MrScan.id == scan_id).first()

        if scan:
            scan.lesion_detected = lesion
            scan.lesion_volume = voxel
            scan.dice_confidence = conf
            scan.mask_path = mask_path
            scan.ai_comment = comment
            scan.status = "done"
            scan.result_data = {
                "lesion_detected": lesion,
                "lesion_volume": voxel,
                "dice_confidence": round(conf, 4),
                "raw_signal": raw_signal,
                "model": MODEL_INFO.get("model_name", "ResUNet3D_DS"),
                "model_version": MODEL_INFO.get("model_version", "4.0"),
                "val_dice": MODEL_INFO.get("val_dice", 0.7426),
            }
            db.commit()

        # Bildirimler
        doctor_links = db.query(DoctorPatient).filter(
            DoctorPatient.patient_id == patient_id,
            DoctorPatient.status == "onaylandi"
        ).all()
        for link in doctor_links:
            notify(db=db, user_id=link.doctor_id, event="mr_analyzed",
                   title="MR Analizi Tamamlandi",
                   body=f"Hastanizin MR analizi hazir: {'Lezyon tespit edildi' if lesion else 'Lezyon tespit edilmedi'}",
                   metadata={"mr_scan_id": scan_id})

        notify(db=db, user_id=patient_id, event="mr_analyzed",
               title="MR Analiziniz Hazir",
               body="MR goruntunuzun analizi tamamlandi. Sonuclari gormek icin tiklayin.",
               metadata={"mr_scan_id": scan_id})

        return {
            "lesion": lesion,
            "voxel": voxel,
            "confidence": conf,
            "raw_signal": raw_signal
        }

    except Exception as e:
        print("[ERROR]", str(e))
        import traceback
        traceback.print_exc()
        scan = db.query(MrScan).filter(MrScan.id == scan_id).first()
        if scan:
            scan.status = "error"
            scan.ai_comment = f"Analiz hatasi: {str(e)}"
            db.commit()
        raise

    finally:
        db.close()