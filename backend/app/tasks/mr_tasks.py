import os
import sys
import json
import numpy as np
import nibabel as nib
import torch
import torch.nn.functional as F
from scipy.ndimage import zoom

from app.celery_app import celery_app
from app.database import SessionLocal

# ML klasörünü path'e ekle
ML_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'ml')
sys.path.insert(0, os.path.abspath(ML_DIR))
from model import AttentionUNet3D

# ── Model bilgilerini yükle ──────────────────────────────────────────
INFO_PATH = os.path.join(ML_DIR, 'model_info.json')
CKPT_PATH = os.path.join(ML_DIR, 'att_unet_multimodal_best.pt')

with open(INFO_PATH) as f:
    MODEL_INFO = json.load(f)

TARGET_SHAPE = tuple(MODEL_INFO['target_shape'])  # (64, 64, 32)
THRESHOLD    = MODEL_INFO['threshold']             # 0.4
MODALITIES   = MODEL_INFO['modalities']            # ['dwi', 'adc']

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
_model = AttentionUNet3D(
    in_ch=MODEL_INFO['input_channels'],  # 2
    out_ch=1,
    base=MODEL_INFO['base_filters']
).to(device)
_ckpt = torch.load(CKPT_PATH, map_location=device)
_model.load_state_dict(_ckpt['model_state_dict'])
_model.eval()
print(f"[Celery Worker] Multimodal model yüklendi — Modaliteler: {MODALITIES} | Cihaz: {device}")


# ── Yardımcı fonksiyonlar ────────────────────────────────────────────
def _normalize(img: np.ndarray) -> np.ndarray:
    img = img.astype(np.float32)
    mn, mx = img.min(), img.max()
    return (img - mn) / (mx - mn + 1e-8)


def _resize(vol: np.ndarray, target: tuple) -> np.ndarray:
    factors = [t / s for t, s in zip(target, vol.shape)]
    return zoom(vol, factors, order=1)


def _skull_strip(file_path: str) -> np.ndarray:
    """
    HD-BET ile skull stripping uygula.
    Başarısız olursa intensity threshold fallback kullanır.
    """
    try:
        import tempfile, os
        from hd_bet.run import run_hd_bet

        with tempfile.TemporaryDirectory() as tmpdir:
            out_path = os.path.join(tmpdir, "stripped.nii.gz")
            run_hd_bet(file_path, out_path, device="cuda" if torch.cuda.is_available() else "cpu",
                       do_tta=False, keep_existing_brain_mask=False, overwrite_existing=True)
            vol = nib.load(out_path).get_fdata()
            print(f"[Task] HD-BET skull stripping tamamlandı")
            return vol
    except Exception as e:
        print(f"[Task] HD-BET başarısız ({e}), threshold fallback kullanılıyor...")
        from scipy.ndimage import binary_fill_holes, binary_erosion
        vol = nib.load(file_path).get_fdata()
        if vol.ndim == 4:
            vol = vol[..., 0]
        thresh = np.percentile(vol[vol > 0], 15) if vol.max() > 0 else 0
        mask = binary_fill_holes(vol > thresh)
        mask = binary_erosion(mask, iterations=2)
        return vol * mask


def _load_volume(file_path: str) -> np.ndarray:
    """NIfTI yükle, skull strip, normalize et, hedef şekle getir."""
    vol = _skull_strip(file_path)
    if vol.ndim == 4:
        vol = vol[..., 0]
    vol = _normalize(vol)
    vol = _resize(vol, TARGET_SHAPE)
    return vol.astype(np.float32)


def _generate_comment(lesion_detected: bool, lesion_volume: float, confidence: float) -> str:
    if not lesion_detected:
        return (
            "MR görüntüsünde anlamlı bir lezyon tespit edilmemiştir. "
            "Klinik bulgularla birlikte değerlendirilmesi önerilir."
        )
    severity = (
        "küçük"  if lesion_volume < 500  else
        "orta"   if lesion_volume < 2000 else
        "büyük"
    )
    return (
        f"MR görüntüsünde {severity} boyutta olası bir lezyon tespit edilmiştir "
        f"(yaklaşık {int(lesion_volume)} voksel, güven skoru: {confidence:.2f}). "
        f"Kesin tanı için nöroloji uzmanı değerlendirmesi önerilir. "
        f"Bu sonuç yalnızca yardımcı karar destek aracıdır."
    )


def _generate_attention_map(tensor: torch.Tensor, scan_id: int) -> str | None:
    """
    Attention U-Net'in att4 gate'inden ısı haritası üret.
    Multimodal tensor (1, 2, H, W, D) — DWI kanalı (0) görselleştirilir.
    """
    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt

        attention_maps = []

        def hook_fn(module, input, output):
            attention_maps.append(output.detach().cpu())

        hook = _model.att4.psi.register_forward_hook(hook_fn)
        with torch.no_grad():
            _ = _model(tensor)
        hook.remove()

        if not attention_maps:
            return None

        # att4 çıktısı: (1, 1, H, W, D) → squeeze → (H, W, D)
        attn = attention_maps[0].squeeze().numpy()

        # En aktif axial slice
        slice_scores = attn.sum(axis=(0, 1)) if attn.ndim == 3 else attn.sum(axis=(1, 2))
        best_slice   = int(np.argmax(slice_scores))

        if attn.ndim == 3:
            attn_2d = attn[:, :, best_slice]
        else:
            attn_2d = attn

        attn_2d = (attn_2d - attn_2d.min()) / (attn_2d.max() - attn_2d.min() + 1e-8)

        # DWI kanalını (kanal 0) görsel için kullan
        orig_vol = tensor.cpu().squeeze().numpy()  # (2, H, W, D)
        dwi_vol  = orig_vol[0]                     # (H, W, D)
        z_idx    = min(best_slice, dwi_vol.shape[2] - 1)
        orig_2d  = dwi_vol[:, :, z_idx]

        # ADC kanalı
        adc_vol = orig_vol[1]
        adc_2d  = adc_vol[:, :, z_idx]

        # Boyut eşitle
        if orig_2d.shape != attn_2d.shape:
            attn_2d = zoom(attn_2d, [orig_2d.shape[0] / attn_2d.shape[0],
                                      orig_2d.shape[1] / attn_2d.shape[1]], order=1)

        # Görselleştir: DWI | ADC | Attention overlay | Odak yoğunluğu
        fig, axes = plt.subplots(1, 4, figsize=(16, 4))
        fig.patch.set_facecolor('#1a1a2e')

        axes[0].imshow(orig_2d.T, cmap='gray', origin='lower')
        axes[0].set_title('DWI', color='white', fontsize=11)
        axes[0].axis('off')

        axes[1].imshow(adc_2d.T, cmap='gray', origin='lower')
        axes[1].set_title('ADC', color='white', fontsize=11)
        axes[1].axis('off')

        axes[2].imshow(orig_2d.T, cmap='gray', origin='lower')
        axes[2].imshow(attn_2d.T, cmap='jet', alpha=0.5, origin='lower')
        axes[2].set_title('Attention Haritası (XAI)', color='white', fontsize=11)
        axes[2].axis('off')

        im = axes[3].imshow(attn_2d.T, cmap='jet', origin='lower')
        axes[3].set_title('Odak Yoğunluğu', color='white', fontsize=11)
        axes[3].axis('off')
        plt.colorbar(im, ax=axes[3], fraction=0.046, pad=0.04)

        plt.suptitle(f'Açıklanabilir AI — DWI+ADC | Slice {best_slice}',
                     color='white', fontsize=13, y=1.02)
        plt.tight_layout()

        gradcam_dir  = os.path.join("uploads", "mr_gradcam")
        os.makedirs(gradcam_dir, exist_ok=True)
        gradcam_path = os.path.join(gradcam_dir, f"gradcam_{scan_id}.png")
        plt.savefig(gradcam_path, dpi=120, bbox_inches='tight',
                    facecolor='#1a1a2e', edgecolor='none')
        plt.close()

        print(f"[Task] Attention haritası kaydedildi: {gradcam_path}")
        return gradcam_path

    except Exception as e:
        print(f"[Task] Attention haritası oluşturulamadı: {e}")
        import traceback
        traceback.print_exc()
        return None


# ── Ana Celery Task ──────────────────────────────────────────────────
@celery_app.task(bind=True, name="mr_tasks.analyze_mr", acks_late=True)
def analyze_mr(self, scan_id: int, file_paths: dict, patient_id: int):
    """
    Multimodal MR görüntüsünü analiz eden arka plan görevi.

    Args:
        scan_id:    DB'deki MrScan id
        file_paths: {'dwi': '...', 'adc': '...'}
        patient_id: Hasta user id
    """
    db = SessionLocal()
    try:
        from app.models.mr_scan import MrScan
        from app.services.notification_service import notify
        from app.models.doctor_patient import DoctorPatient

        print(f"[Task] analyze_mr başladı — scan_id: {scan_id}")
        print(f"[Task] Dosyalar: DWI={file_paths.get('dwi')} | ADC={file_paths.get('adc')}")

        # ── 1. Her iki modaliteyi yükle ──────────────────────────────
        dwi_path = file_paths.get('dwi')
        adc_path = file_paths.get('adc')

        if not dwi_path or not adc_path:
            raise ValueError(f"Eksik modalite — file_paths: {file_paths}")

        dwi = _load_volume(dwi_path)
        adc = _load_volume(adc_path)

        orig_shape = nib.load(dwi_path).get_fdata().shape[:3]
        print(f"[Task] DWI shape: {dwi.shape} | ADC shape: {adc.shape}")

        # ── 2. Stack → tensor (1, 2, H, W, D) ───────────────────────
        volume = np.stack([dwi, adc], axis=0)  # (2, H, W, D)
        tensor = torch.tensor(volume, dtype=torch.float32).unsqueeze(0).to(device)

        # ── 3. Model inference ───────────────────────────────────────
        print("[Task] Model inference başlıyor...")
        with torch.no_grad():
            logits = _model(tensor)
            probs  = torch.sigmoid(logits).cpu().numpy()[0, 0]
        print("[Task] Model inference tamamlandı!")

        mask = (probs > THRESHOLD).astype(np.float32)

        # Orijinal boyuta geri getir
        factors   = [o / t for o, t in zip(orig_shape, TARGET_SHAPE)]
        mask_orig = zoom(mask, factors, order=0)
        mask_orig = (mask_orig > 0.5).astype(np.float32)

        # ── 4. Metrikler ─────────────────────────────────────────────
        lesion_volume   = float(mask_orig.sum())
        lesion_detected = lesion_volume > 10
        confidence      = float(probs[mask > THRESHOLD].mean()) if mask.sum() > 0 else 0.0
        print(f"[Task] Lezyon: {lesion_detected}, Hacim: {lesion_volume:.1f}, Güven: {confidence:.4f}")

        # ── 5. Maskeyi kaydet ────────────────────────────────────────
        mask_dir  = os.path.join("uploads", "mr_masks")
        os.makedirs(mask_dir, exist_ok=True)
        mask_path = os.path.join(mask_dir, f"mask_{scan_id}.npy")
        np.save(mask_path, mask_orig)

        # ── 6. Attention haritası üret (XAI) ─────────────────────────
        print("[Task] Attention haritası üretiliyor...")
        gradcam_path = _generate_attention_map(tensor, scan_id)

        # ── 7. DB güncelle ───────────────────────────────────────────
        scan = db.query(MrScan).filter(MrScan.id == scan_id).first()
        if scan:
            scan.lesion_detected = lesion_detected
            scan.lesion_volume   = lesion_volume
            scan.dice_confidence = round(confidence, 4)
            scan.mask_path       = mask_path
            scan.gradcam_path    = gradcam_path
            scan.ai_comment      = _generate_comment(lesion_detected, lesion_volume, confidence)
            scan.status          = "done"
            scan.result_data     = {
                "lesion_detected": lesion_detected,
                "lesion_volume":   lesion_volume,
                "dice_confidence": round(confidence, 4),
                "model":           MODEL_INFO["model_name"],
                "modalities":      MODALITIES,
                "val_dice":        MODEL_INFO["val_dice"],
                "threshold":       THRESHOLD,
                "gradcam":         gradcam_path is not None,
            }
            db.commit()
            print(f"[Task] DB güncellendi — status: done")

        # ── 8. Bildirimleri gönder ───────────────────────────────────
        doctor_links = db.query(DoctorPatient).filter(
            DoctorPatient.patient_id == patient_id,
            DoctorPatient.status == "onaylandı"
        ).all()
        for link in doctor_links:
            notify(
                db=db,
                user_id=link.doctor_id,
                event="mr_analyzed",
                title="MR Analizi Tamamlandı",
                body=f"Hastanızın MR analizi hazır: "
                     f"{'⚠️ Lezyon tespit edildi' if lesion_detected else '✅ Lezyon tespit edilmedi'}",
                metadata={"mr_scan_id": scan_id}
            )

        notify(
            db=db,
            user_id=patient_id,
            event="mr_analyzed",
            title="MR Analiziniz Hazır",
            body="MR görüntünüzün analizi tamamlandı. Sonuçları görmek için tıklayın.",
            metadata={"mr_scan_id": scan_id}
        )

        print(f"[Task] analyze_mr tamamlandı — scan_id: {scan_id}")
        return {"status": "done", "scan_id": scan_id, "lesion_detected": lesion_detected}

    except Exception as e:
        print(f"[Task] HATA: {str(e)}")
        import traceback
        traceback.print_exc()
        scan = db.query(MrScan).filter(MrScan.id == scan_id).first()
        if scan:
            scan.status     = "error"
            scan.ai_comment = f"Analiz hatası: {str(e)}"
            db.commit()
        raise

    finally:
        db.close()