"""
app/services/mr_selector.py
"""

import os
import json
import re
import nibabel as nib
from typing import List, Optional

MIN_SLICES = 16

_DWI_NAMES = re.compile(r"(dwi|diffusion|b1000|ep_b)", re.IGNORECASE)
_ADC_NAMES = re.compile(r"(adc|apparent)", re.IGNORECASE)

_DWI_SEQ   = re.compile(r"(ep_b|ep2d_diff|dwi|diffusion)", re.IGNORECASE)
_ADC_SEQ   = re.compile(r"(adc|apparent)", re.IGNORECASE)
_DWI_IMG   = re.compile(r"(DIFFUSION|DWI)", re.IGNORECASE)
_ADC_IMG   = re.compile(r"(ADC)", re.IGNORECASE)
_DWI_DESC  = re.compile(r"(dwi|diffusion|b1000|ep_b)", re.IGNORECASE)
_ADC_DESC  = re.compile(r"(adc|apparent)", re.IGNORECASE)
_SCOUT_SEQ = re.compile(r"h2d1", re.IGNORECASE)

# ── YENİ: ScanningSequence bazlı tespit ─────────────────────────────
# DWI için Echo Planar (EP) zorunlu
_EPI_SEQ   = re.compile(r"\bEP\b", re.IGNORECASE)

# DWI OLMAYAN sekanslar — bunlar varsa kesinlikle DWI değil
_NON_DWI_OPTS = re.compile(
    r"(T1FLAIR|T2FLAIR|FLAIR|FSE|SE_IR|STIR|VIBE|MPRAGE|SPGR|GRE|SSFP)",
    re.IGNORECASE
)


def _read_json(nii_path: str) -> dict:
    base = nii_path.replace(".nii.gz", "").replace(".nii", "")
    json_path = base + ".json"
    if os.path.exists(json_path):
        try:
            with open(json_path) as f:
                return json.load(f)
        except Exception:
            pass
    return {}


def _get_slices(path: str) -> int:
    try:
        img = nib.load(path)
        return img.shape[2] if len(img.shape) >= 3 else 0
    except Exception:
        return 0


def _classify(nii_path: str) -> str:
    fname = os.path.basename(nii_path).lower()
    meta  = _read_json(nii_path)

    # ── JSON yok: isim bazlı ─────────────────────────────────────────
    if not meta:
        if _DWI_NAMES.search(fname):
            return "dwi"
        if _ADC_NAMES.search(fname):
            return "adc"
        n = _get_slices(nii_path)
        return "other" if n >= MIN_SLICES else "scout"

    # ── JSON var: metadata bazlı ─────────────────────────────────────
    seq_name      = meta.get("SequenceName", "")
    img_type      = " ".join(meta.get("ImageType", []))
    desc          = meta.get("SeriesDescription", "")
    slice_th      = meta.get("SliceThickness", 0)

    # YENİ: ScanningSequence ve ScanOptions kontrolü
    scanning_seq  = meta.get("ScanningSequence", "")   # örn: ["EP"] veya "EP"
    scan_options  = meta.get("ScanOptions", "")

    if isinstance(scanning_seq, list):
        scanning_seq_str = " ".join(scanning_seq)
    else:
        scanning_seq_str = str(scanning_seq)

    if isinstance(scan_options, list):
        scan_options_str = " ".join(scan_options)
    else:
        scan_options_str = str(scan_options)

    # Scout
    if _SCOUT_SEQ.search(seq_name) or slice_th >= 7:
        if _get_slices(nii_path) < MIN_SLICES:
            return "scout"

    if _get_slices(nii_path) < MIN_SLICES:
        return "scout"

    # FLAIR/T1/T2 ise kesinlikle DWI değil
    if _NON_DWI_OPTS.search(scan_options_str):
        return "other"

    # ADC — önce kontrol et (ADC de EPI olabilir)
    if (_ADC_SEQ.search(seq_name) or
            _ADC_IMG.search(img_type) or
            _ADC_DESC.search(desc)):
        return "adc"

    # DWI — EPI sekansı + DWI belirteci
    is_epi = _EPI_SEQ.search(scanning_seq_str)
    has_dwi_hint = (
        _DWI_SEQ.search(seq_name) or
        _DWI_IMG.search(img_type) or
        _DWI_DESC.search(desc)
    )

    if is_epi and has_dwi_hint:
        return "dwi"

    # Sadece EPI var ama DWI belirteci yok → yine de DWI adayı
    # (bazı sistemler sadece EP yazar, b-value sidecar'da olur)
    if is_epi:
        b_value = meta.get("DiffusionBValue", None)
        if b_value is not None and float(b_value) > 0:
            return "dwi"
        # b=0 ise ADC adayı
        if b_value == 0:
            return "adc"
        # b_value yoksa — belirsiz EPI, DWI say
        return "dwi"

    return "other"


def select_dwi_adc_pair(file_paths: List[str]) -> Optional[dict]:
    nii_files = [p for p in file_paths
                 if p.endswith(".nii") or p.endswith(".nii.gz")]

    if not nii_files:
        return None

    dwi_list   = []
    adc_list   = []
    other_list = []

    for path in nii_files:
        kind  = _classify(path)
        fname = os.path.basename(path)
        print(f"[mr_selector] {fname} → {kind}")

        if kind == "dwi":
            dwi_list.append(path)
        elif kind == "adc":
            adc_list.append(path)
        elif kind == "other":
            other_list.append(path)

    if dwi_list and adc_list:
        best_dwi = dwi_list[0]
        best_adc = adc_list[0]
        print(f"[mr_selector] ✅ DWI+ADC — "
              f"DWI: {os.path.basename(best_dwi)} | ADC: {os.path.basename(best_adc)}")
        return {'dwi': best_dwi, 'adc': best_adc}

    if dwi_list:
        best_dwi = dwi_list[0]
        print(f"[mr_selector] ⚠️  Sadece DWI — her iki kanal olarak kullanılacak")
        return {'dwi': best_dwi, 'adc': best_dwi}

    print(f"[mr_selector] ❌ DWI bulunamadı. "
          f"Sekanslar: {[os.path.basename(p) for p in other_list]}")
    return {'error': 'NO_DWI'}