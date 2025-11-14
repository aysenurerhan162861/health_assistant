import pdfplumber
import re
from typing import Dict, Any, List
import pytesseract
from pdf2image import convert_from_path

# Basit regex örneği: "B12 160 pg/mL 200-900"
TEST_LINE_RE = re.compile(
    r"(?P<name>[A-Za-z0-9\-\/\s]+?)\s+"
    r"(?P<value>[0-9]+(?:\.[0-9]+)?)\s*"
    r"(?P<unit>[a-zA-Z/µμIU%]*)\s*"
    r"(?P<range>[0-9]+(?:\.[0-9]+)?\s*[-–]\s*[0-9]+(?:\.[0-9]+)?)?"
)

def extract_text_from_pdf(file_path: str) -> str:
    """
    Önce pdfplumber ile dene. Eğer metin yoksa OCR fallback.
    """
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            pages = [page.extract_text() for page in pdf.pages]
            text = "\n".join(filter(None, pages))
    except Exception:
        text = ""

    if not text.strip():
        # OCR fallback
        images = convert_from_path(file_path, dpi=200)
        ocr_text = []
        for img in images:
            ocr_text.append(pytesseract.image_to_string(img))
        text = "\n".join(ocr_text)

    return text

def parse_tests_from_text(text: str) -> Dict[str, Any]:
    """
    Metin içinde testleri ayıklar ve JSON formatına çevirir
    """
    tests = {}
    warnings = []
    lines = text.splitlines()

    for line in lines:
        line = line.strip()
        if not line:
            continue
        match = TEST_LINE_RE.search(line)
        if match:
            name = match.group("name").strip()
            try:
                value = float(match.group("value"))
            except:
                continue
            unit = match.group("unit") or None
            ref_range = match.group("range") or ""
            min_v, max_v = None, None
            if ref_range:
                nums = re.findall(r"[0-9]+(?:\.[0-9]+)?", ref_range)
                if len(nums) >= 2:
                    min_v = float(nums[0])
                    max_v = float(nums[1])

            status = "normal"
            if min_v is not None and value < min_v:
                status = "low"
                warnings.append(f"{name} düşük ({value} < {min_v})")
            if max_v is not None and value > max_v:
                status = "high"
                warnings.append(f"{name} yüksek ({value} > {max_v})")

            tests[name] = {
                "value": value,
                "min": min_v,
                "max": max_v,
                "unit": unit,
                "status": status
            }

    return {"tests": tests, "raw_text": text, "warnings": warnings}

def parse_pdf_file(file_path: str) -> dict:
    """
    PDF dosyasını okuyup içeriklerini JSON formatında döndürür.
    Hem text tabanlı PDF'ler hem de resim tabanlı PDF'ler için uygundur.
    """
    parsed_data = {}

    # pdfplumber ile text tabanlı PDF'leri oku
    try:
        with pdfplumber.open(file_path) as pdf:
            text_content = ""
            for page in pdf.pages:
                text_content += page.extract_text() or ""
            if text_content.strip():
                parsed_data["text"] = text_content
    except Exception as e:
        parsed_data["text_error"] = str(e)

    # Eğer text boşsa resim tabanlı OCR uygula
    if "text" not in parsed_data or not parsed_data["text"].strip():
        try:
            images = convert_from_path(file_path)
            ocr_text = ""
            for img in images:
                ocr_text += pytesseract.image_to_string(img)
            parsed_data["ocr_text"] = ocr_text
        except Exception as e:
            parsed_data["ocr_error"] = str(e)

    return parsed_data