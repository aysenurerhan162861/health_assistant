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
CKPT_PATH = os.path.join(ML_DIR, 'att_unet_best.pt')

with open(INFO_PATH) as f:
    MODEL_INFO = json.load(f)

TARGET_SHAPE = tuple(MODEL_INFO['target_shape'])  # (64, 64, 32)
THRESHOLD    = MODEL_INFO['threshold']             # 0.5

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
_model = AttentionUNet3D(in_ch=1, out_ch=1, base=MODEL_INFO['base_filters']).to(device)
_ckpt  = torch.load(CKPT_PATH, map_location=device)
_model.load_state_dict(_ckpt['model_state_dict'])
_model.eval()
print(f"[Celery Worker] Model yüklendi — Cihaz: {device}")


# ── Yardımcı fonksiyonlar ────────────────────────────────────────────
def _normalize(img: np.ndarray) -> np.ndarray:
    img = img.astype(np.float32)
    mn, mx = img.min(), img.max()
    return (img - mn) / (mx - mn + 1e-8)


def _resize(vol: np.ndarray, target: tuple) -> np.ndarray:
    factors = [t / s for t, s in zip(target, vol.shape)]
    return zoom(vol, factors, order=1)


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
    En aktif axial slice'ı PNG olarak kaydeder.
    """
    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
        import matplotlib.cm as cm

        attention_maps = []

        def hook_fn(module, input, output):
            attention_maps.append(output.detach().cpu())

        # att4 gate'inin psi (sigmoid) çıktısını yakala
        hook = _model.att4.psi.register_forward_hook(hook_fn)

        with torch.no_grad():
            _ = _model(tensor)

        hook.remove()

        if not attention_maps:
            return None

        # att4 çıktısı: (1, 1, D, H, W) → squeeze → (D, H, W)
        attn = attention_maps[0].squeeze().numpy()  # (D, H, W) veya (H, W, D)

        # En aktif axial slice'ı bul (z ekseninde sum)
        slice_scores = attn.sum(axis=(0, 1)) if attn.ndim == 3 else attn.sum(axis=(1, 2))
        best_slice = int(np.argmax(slice_scores))

        # 2D harita al
        if attn.ndim == 3:
            attn_2d = attn[:, :, best_slice] if attn.shape[2] == attn.shape[2] else attn[best_slice]
        else:
            attn_2d = attn

        # Normalize et
        attn_2d = (attn_2d - attn_2d.min()) / (attn_2d.max() - attn_2d.min() + 1e-8)

        # Orijinal görüntünün aynı slice'ını al
        orig_slice = tensor.cpu().squeeze().numpy()
        if orig_slice.ndim == 3:
            # Attention map boyutuna göre slice seç
            z_idx = min(best_slice, orig_slice.shape[2] - 1)
            orig_2d = orig_slice[:, :, z_idx]
        else:
            orig_2d = orig_slice

        # Boyutları eşitle
        if orig_2d.shape != attn_2d.shape:
            attn_2d_resized = zoom(attn_2d, [orig_2d.shape[0] / attn_2d.shape[0],
                                              orig_2d.shape[1] / attn_2d.shape[1]], order=1)
        else:
            attn_2d_resized = attn_2d

        # Görselleştir: MR + ısı haritası overlay
        fig, axes = plt.subplots(1, 3, figsize=(12, 4))
        fig.patch.set_facecolor('#1a1a2e')

        # Sol: Orijinal MR
        axes[0].imshow(orig_2d.T, cmap='gray', origin='lower')
        axes[0].set_title('MR Görüntüsü', color='white', fontsize=11)
        axes[0].axis('off')

        # Orta: Attention haritası
        axes[1].imshow(orig_2d.T, cmap='gray', origin='lower')
        axes[1].imshow(attn_2d_resized.T, cmap='jet', alpha=0.5, origin='lower')
        axes[1].set_title('Attention Haritası (XAI)', color='white', fontsize=11)
        axes[1].axis('off')

        # Sağ: Sadece ısı haritası
        im = axes[2].imshow(attn_2d_resized.T, cmap='jet', origin='lower')
        axes[2].set_title('Odak Yoğunluğu', color='white', fontsize=11)
        axes[2].axis('off')
        plt.colorbar(im, ax=axes[2], fraction=0.046, pad=0.04)

        plt.suptitle(f'Açıklanabilir AI — Slice {best_slice}', color='white', fontsize=13, y=1.02)
        plt.tight_layout()

        # Kaydet
        gradcam_dir = os.path.join("uploads", "mr_gradcam")
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
def analyze_mr(self, scan_id: int, file_path: str, patient_id: int):
    """
    MR görüntüsünü analiz eden arka plan görevi.
    """
    db = SessionLocal()
    try:
        from app.models.mr_scan import MrScan
        from app.services.notification_service import notify
        from app.models.doctor_patient import DoctorPatient

        print(f"[Task] analyze_mr başladı — scan_id: {scan_id}")

        # ── 1. Görüntüyü yükle ──────────────────────────────────────
        print(f"[Task] Dosya yükleniyor: {file_path}")
        vol = nib.load(file_path).get_fdata()
        if vol.ndim == 4:
            vol = vol[..., 0]
        orig_shape = vol.shape
        print(f"[Task] Shape: {orig_shape}")

        vol = _normalize(vol)
        vol = _resize(vol, TARGET_SHAPE)
        print(f"[Task] Resize tamamlandı: {vol.shape}")

        # ── 2. Model çalıştır ────────────────────────────────────────
        print("[Task] Model inference başlıyor...")
        tensor = torch.tensor(vol, dtype=torch.float32).unsqueeze(0).unsqueeze(0).to(device)
        with torch.no_grad():
            logits = _model(tensor)
            probs  = torch.sigmoid(logits).cpu().numpy()[0, 0]
        print("[Task] Model inference tamamlandı!")

        mask = (probs > THRESHOLD).astype(np.float32)

        # Orijinal boyuta geri getir
        factors   = [o / t for o, t in zip(orig_shape, TARGET_SHAPE)]
        mask_orig = zoom(mask, factors, order=0)
        mask_orig = (mask_orig > 0.5).astype(np.float32)

        # ── 3. Metrikler ─────────────────────────────────────────────
        lesion_volume   = float(mask_orig.sum())
        lesion_detected = lesion_volume > 10
        confidence      = float(probs[mask > THRESHOLD].mean()) if mask.sum() > 0 else 0.0
        print(f"[Task] Lezyon: {lesion_detected}, Hacim: {lesion_volume:.1f}, Güven: {confidence:.4f}")

        # ── 4. Maskeyi kaydet ────────────────────────────────────────
        mask_dir  = os.path.join("uploads", "mr_masks")
        os.makedirs(mask_dir, exist_ok=True)
        mask_path = os.path.join(mask_dir, f"mask_{scan_id}.npy")
        np.save(mask_path, mask_orig)

        # ── 5. Attention haritası üret (XAI) ─────────────────────────
        print("[Task] Attention haritası üretiliyor...")
        gradcam_path = _generate_attention_map(tensor, scan_id)

        # ── 6. DB güncelle ───────────────────────────────────────────
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
                "val_dice":        MODEL_INFO["val_dice"],
                "gradcam":         gradcam_path is not None,
            }
            db.commit()
            print(f"[Task] DB güncellendi — status: done")

        # ── 7. Bildirimleri gönder ───────────────────────────────────
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