import pdfplumber
from typing import Dict, Any
import pytesseract
from pdf2image import convert_from_path
import re

def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            pages = [page.extract_text() for page in pdf.pages]
            text = "\n".join(filter(None, pages))
    except:
        text = ""

    if not text.strip():
        images = convert_from_path(file_path, dpi=200)
        ocr_text = [pytesseract.image_to_string(img) for img in images]
        text = "\n".join(ocr_text)

    return text

def parse_tests_from_text(text: str) -> Dict[str, Any]:
    tests = []
    warnings = []

    lines = text.splitlines()

    # Başlık satırlarını atla
    for line in lines:
        line = line.strip()
        if not line or "Test Adı" in line or "Sonuç" in line:
            continue

        # Kolonları TAB veya çoklu boşluk ile ayır
        # PDF’in tab/space karmaşasını çözüyoruz
        cols = re.split(r"\t+|\s{2,}", line)

        # Eğer PDF satırında 4 kolon yoksa, regex ile ayır
        if len(cols) < 4:
            match = re.match(r"^(.*?)\s+([\d.,]+)\s+([^\s]+)\s+(.+)$", line)
            if match:
                cols = [match.group(1), match.group(2), match.group(3), match.group(4)]
            else:
                continue

        name = cols[0].strip()
        value_str = cols[1].replace(",", ".")
        unit = cols[2].strip()
        ref_range = cols[3].strip()

        try:
            value = float(value_str)
        except:
            continue

        # Min / Max hesaplama
        min_v, max_v = None, None
        if "-" in ref_range or "–" in ref_range:
            parts = re.split(r"[-–]", ref_range)
            try:
                min_v = float(parts[0])
                max_v = float(parts[1])
            except:
                pass
        elif ref_range.startswith("<"):
            try:
                max_v = float(ref_range[1:])
            except:
                pass
        elif ref_range.startswith(">"):
            try:
                min_v = float(ref_range[1:])
            except:
                pass

        # Durum belirle
        status = "normal"
        if min_v is not None and value < min_v:
            status = "low"
            warnings.append(f"{name} düşük ({value} < {min_v})")
        if max_v is not None and value > max_v:
            status = "high"
            warnings.append(f"{name} yüksek ({value} > {max_v})")

        tests.append({
            "name": name,
            "value": value,
            "unit": unit,
            "normal_range": ref_range,
            "status": status
        })

    return {"tests": tests, "raw_text": text, "warnings": warnings}

def parse_pdf_file(file_path: str) -> dict:
    text = extract_text_from_pdf(file_path)
    parsed = parse_tests_from_text(text)
    return parsed
