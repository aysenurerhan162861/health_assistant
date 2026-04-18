"""
app/services/dicom_converter.py

DICOM dosyalarını NIfTI'ye çevirir.
dcm2niix kullanır — JSON sidecar otomatik üretilir.
"""

import os
import shutil
import subprocess
import tempfile
import zipfile
from typing import List
import pydicom
import json


def _run_dcm2niix(input_dir: str, output_dir: str) -> List[str]:
    """
    dcm2niix çalıştır, üretilen .nii.gz dosyalarının listesini döndür.
    """
    result = subprocess.run([
        "dcm2niix",
        "-z", "y",          # gzip sıkıştır
        "-b", "y",          # JSON sidecar üret
        "-f", "%s_%p_%t",   # dosya adı: seri_no + protokol + tarih
        "-o", output_dir,
        input_dir
    ], capture_output=True, text=True, timeout=120)

    print(f"[dcm2niix] stdout: {result.stdout[-500:]}")
    if result.returncode != 0:
        print(f"[dcm2niix] stderr: {result.stderr[-300:]}")

    nii_files = [
        os.path.join(output_dir, f)
        for f in os.listdir(output_dir)
        if f.endswith(".nii.gz") or f.endswith(".nii")
    ]
    return nii_files


def convert_dicoms(dcm_paths: List[str], dest_dir: str) -> List[str]:
    """
    .dcm dosyalarını geçici klasöre kopyala, dcm2niix ile çevir.

    Args:
        dcm_paths: Yüklenen .dcm dosyalarının path listesi
        dest_dir:  NIfTI dosyalarının kaydedileceği klasör

    Returns:
        Üretilen .nii / .nii.gz dosyalarının listesi
    """
    if not dcm_paths:
        return []

    os.makedirs(dest_dir, exist_ok=True)

    with tempfile.TemporaryDirectory() as tmp_in:
        # DICOM'ları geçici klasöre kopyala
        for path in dcm_paths:
            shutil.copy(path, os.path.join(tmp_in, os.path.basename(path)))

        nii_files = _run_dcm2niix(tmp_in, dest_dir)
        print(f"[dcm2niix] {len(dcm_paths)} DICOM → {len(nii_files)} NIfTI")
        return nii_files


def extract_zip_and_convert(zip_path: str, dest_dir: str) -> List[str]:


    os.makedirs(dest_dir, exist_ok=True)

    with tempfile.TemporaryDirectory() as tmp_zip:
        with zipfile.ZipFile(zip_path, 'r') as z:
            z.extractall(tmp_zip)

        dcm_files = []
        nii_files_in_zip = []

        for root, dirs, files in os.walk(tmp_zip):
            for f in files:
                path = os.path.join(root, f)
                if f.lower().endswith('.dcm') or '.' not in f:
                    dcm_files.append(path)
                elif f.lower().endswith('.dcm') or '.' not in f:
                    dcm_files.append(path)
                elif f.lower().endswith('.nii.gz') or f.lower().endswith('.nii'):
                    nii_files_in_zip.append(path)
        if nii_files_in_zip:
            print(f"[dcm2niix] ZIP içinde {len(nii_files_in_zip)} NIfTI bulundu, direkt kullanılıyor")
            result = []
            for src in nii_files_in_zip:
                dst = os.path.join(dest_dir, os.path.basename(src))
                shutil.copy(src, dst)
                result.append(dst)
            return result

        if not dcm_files:
            print("[dcm2niix] ZIP içinde DICOM bulunamadı")
            return []

        print(f"[dcm2niix] ZIP'te {len(dcm_files)} DICOM bulundu")

        # dcm2niix ile çevir
        nii_files = _run_dcm2niix(tmp_zip, dest_dir)

        # JSON sidecar'ları zenginleştir
        _enrich_json_sidecars(dest_dir, tmp_zip)

        return nii_files
    
def _enrich_json_sidecars(nifti_dir: str, dcm_source_dir: str):
    """
    dcm2niix'in ürettiği JSON sidecar'lara eksik DICOM tag'lerini ekle.
    SeriesNumber eşleşmesi ile doğru seri bulunur.
    """


    # Her NIfTI için JSON sidecar bul
    for fname in os.listdir(nifti_dir):
        if not (fname.endswith(".nii.gz") or fname.endswith(".nii")):
            continue

        base = fname.replace(".nii.gz", "").replace(".nii", "")
        json_path = os.path.join(nifti_dir, base + ".json")
        if not os.path.exists(json_path):
            continue

        with open(json_path) as f:
            sidecar = json.load(f)

        # SeriesNumber ile eşleşen DICOM'u bul
        series_num = sidecar.get("SeriesNumber")
        if series_num is None:
            continue

        matched_dcm = None
        for root, dirs, files in os.walk(dcm_source_dir):
            for dcm_file in files:
                if not (dcm_file.lower().endswith('.dcm') or '.' not in dcm_file):
                    continue
                try:
                    ds = pydicom.dcmread(
                        os.path.join(root, dcm_file),
                        stop_before_pixels=True
                    )
                    if ds.get("SeriesNumber") == series_num:
                        matched_dcm = ds
                        break
                except Exception:
                    continue
            if matched_dcm:
                break

        if not matched_dcm:
            continue

        # Eksik tag'leri ekle
        enriched = False
        for tag, key in [
            ("ScanningSequence", "ScanningSequence"),
            ("ScanOptions",      "ScanOptions"),
            ("SequenceVariant",  "SequenceVariant"),
        ]:
            val = matched_dcm.get(tag)
            if val is not None and key not in sidecar:
                sidecar[key] = val if not hasattr(val, '__iter__') or isinstance(val, str) else list(val)
                enriched = True

        if enriched:
            with open(json_path, "w") as f:
                json.dump(sidecar, f, indent=2)
            print(f"[enrich] {base}.json güncellendi")