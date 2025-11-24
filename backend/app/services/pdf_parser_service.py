# pdf_parser_service.py
import pdfplumber
from typing import Dict, Any
import pytesseract
from pdf2image import convert_from_path
import re

def extract_text_from_pdf(file_path: str) -> str:
    """
    PDF'den metni çıkarır. Eğer metin yoksa OCR uygular.
    """
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            pages = [page.extract_text() for page in pdf.pages]
            text = "\n".join(filter(None, pages))
    except Exception as e:
        print("PDF okuma hatası:", e)

    if not text.strip():
        images = convert_from_path(file_path, dpi=200)
        ocr_text = [pytesseract.image_to_string(img, lang="tur") for img in images]
        text = "\n".join(ocr_text)

    return text

def parse_tests_from_text(text: str) -> Dict[str, Any]:
    """
    Ham metni satırlara ayırır ve her testi dict formatına çevirir.
    Gereksiz satırları atlar, referans aralıklarını ve durumu kontrol eder.
    """
    tests = []
    warnings = []

    lines = text.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
            continue

        # Gereksiz satırları atla
        if re.match(r'^(Sayfa|\d{1,3}\s\d{1,3}|0\s\d{2,3})', line):
            i += 1
            continue

        # Satırı sütunlara ayır
        cols = re.split(r"\t+|\s{2,}", line)
        if len(cols) < 4:
            match = re.match(r"^(.*?)\s+([\d.,]+)\s+([^\s]+)\s*(.*)?$", line)
            if match:
                cols = [match.group(1), match.group(2), match.group(3)]
                if match.group(4):
                    cols.append(match.group(4))
            else:
                i += 1
                continue

        name = cols[0].strip()
        value_str = cols[1].replace(",", ".")
        unit = cols[2].strip()
        ref_range = cols[3].strip() if len(cols) > 3 else ""

        j = 1
        # Alt satırları kontrol et: referans aralığı veya durum olabilir
        while (not ref_range or ref_range == "-" or ref_range.endswith("-")) and i + j < len(lines):
            next_line = lines[i + j].strip()
            if re.match(r'^[\d.]+$', next_line):
                ref_range = ref_range + next_line
            elif next_line.lower() in ["normal", "düşük", "yüksek"]:
                break
            else:
                ref_range = next_line if ref_range in ["", "-"] else ref_range + " " + next_line
            j += 1

        # Alt satırda durum varsa al
        status = "Normal"
        if i + j < len(lines):
            next_line = lines[i + j].strip().lower()
            if next_line in ["normal", "düşük", "yüksek"]:
                status = next_line.capitalize()
                j += 1

        try:
            value = float(value_str)
        except:
            i += j
            continue

        # Referans aralığını temizle ve min/max çıkar
        ref_clean = ref_range.replace("N(", "").replace("L(", "").replace("H(", "").replace(")", "").strip()
        min_v, max_v = None, None
        forced_status = None

        # L() veya H() ile belirtilmiş durumlar
        if "L(" in ref_range:
            forced_status = "Düşük"
        elif "H(" in ref_range:
            forced_status = "Yüksek"

        # Min/Max değerleri güvenli şekilde çıkar
        try:
            if "-" in ref_clean or "–" in ref_clean:
                parts = re.split(r"[-–]", ref_clean)
                min_v = float(parts[0].strip())
                max_v = float(parts[1].strip())
            elif ref_clean.startswith("<"):
                max_v = float(ref_clean[1:].strip())
            elif ref_clean.startswith(">"):
                min_v = float(ref_clean[1:].strip())
        except:
            min_v, max_v = None, None

        # Durum kontrolü
        if forced_status:
            status = forced_status
        else:
            if status == "Normal":
                if min_v is not None and value < min_v:
                    status = "Düşük"
                    warnings.append(f"{name} düşük ({value} < {min_v})")
                elif max_v is not None and value > max_v:
                    status = "Yüksek"
                    warnings.append(f"{name} yüksek ({value} > {max_v})")

        tests.append({
            "name": name,
            "value": value,
            "unit": unit,
            "normal_range": ref_range,
            "status": status
        })

        i += j

    return {"tests": tests, "raw_text": text, "warnings": warnings}

def parse_pdf_file(file_path: str) -> dict:
    """
    PDF dosyasını işleyip testleri çıkarır.
    """
    text = extract_text_from_pdf(file_path)
    parsed = parse_tests_from_text(text)
    return parsed

# Örnek kullanım
if __name__ == "__main__":
    file_path = "tahlil.pdf"
    result = parse_pdf_file(file_path)
    for test in result["tests"]:
        print(test)
    if result["warnings"]:
        print("Uyarılar:", result["warnings"])
