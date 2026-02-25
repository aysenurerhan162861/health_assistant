from google import genai
from google.genai import types
import os
import mimetypes
import re
import json
import time
from dotenv import load_dotenv
from typing import Optional, Tuple, Dict, Any, List

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")


client = genai.Client(api_key=API_KEY)


# Rate limiter: Gemini Free Tier ~15 req/min, Pro daha yüksek
class SimpleRateLimiter:
    def __init__(self, max_requests: int = 15, time_window: int = 60):
        self.max_requests = max_requests
        self.time_window = time_window
        self.requests = []
        # Thread-safe değil ama basit kullanım için yeterli
        # Production'da threading.Lock() kullanılabilir
    
    def can_make_request(self) -> bool:
        now = time.time()
        # Eski istekleri temizle
        self.requests = [t for t in self.requests if now - t < self.time_window]
        return len(self.requests) < self.max_requests
    
    def wait_time(self) -> float:
        if not self.requests:
            return 0.0
        now = time.time()
        oldest = min(self.requests)
        wait = self.time_window - (now - oldest)
        return max(0.0, wait)
    
    def record_request(self):
        self.requests.append(time.time())

_rate_limiter = SimpleRateLimiter(max_requests=15, time_window=60)

def _detect_mime(path: str) -> str:
    mime, _ = mimetypes.guess_type(path)
    return mime or "application/octet-stream"


def get_health_comment(test_results):
    prompt = f"""
    Sen güvenli bir sağlık asistanısın.
    Aşağıdaki laboratuvar sonuçlarını yorumla ve öneriler ver:
    {test_results}
    """

    response = client.models.generate_content(
        model="gemini-2.0-flash",   # ✔ Doğru model
        contents=prompt                  # ✔ Dashboard ile aynı parametre
    )

    return response.text                # ✔ Yeni SDK’da output_text yerine text


def analyze_meal(
    meal_type: str,
    text_description: Optional[str],
    lab_report_summary: str,
    chronic_diseases: Optional[str],
    allergies: Optional[str],
    image_path: Optional[str] = None,
    max_retries: int = 3,
) -> Tuple[Optional[int], Optional[str]]:
    """
    Öğün analizi: Gemini'den TEK API çağrısı ile hem kalori hem yorum alır.
    Rate limit yönetimi ve retry mekanizması içerir.
    
    Dönen tuple: (calorie_int_or_none, comment_text_or_none)
    """
    meal_text = text_description or ""
    chronic_text = chronic_diseases or "Belirtilmemiş"
    allergy_text = allergies or "Belirtilmemiş"

    # Optimize edilmiş prompt: JSON formatında response iste
    prompt = f"""Sen güvenli ve temkinli bir sağlık asistanısın.

Görev:
1. Öğün içeriğini değerlendir
2. Yaklaşık kalori değerini hesapla (tam sayı kcal)
3. Sağlık uygunluğu hakkında kısa, net yorum yap

Hasta Bilgileri:
- Kronik hastalıklar: {chronic_text}
- Alerjiler: {allergy_text}
- Son tahlil: {lab_report_summary}

Öğün Bilgisi:
- Tip: {meal_type}
- Açıklama: {meal_text if meal_text else "Yok"}

Lütfen yanıtını şu JSON formatında ver:
{{
  "calorie": <tam_sayi_kcal>,
  "comment": "<sağlık_yorumu_metni>"
}}

Örnek:
{{
  "calorie": 450,
  "comment": "Bu öğün dengeli görünüyor. Protein ve karbonhidrat içeriği uygun. Ancak tuz oranına dikkat edilmesi önerilir."
}}"""

    contents = []
    if image_path and os.path.exists(image_path):
        with open(image_path, "rb") as f:
            image_data = f.read()
            mime_type = _detect_mime(image_path)
            # Gemini API için doğru format: Part objesi ile inline_data
            # Yeni SDK'da contents listesi içinde Part formatı kullanılır
            image_part = types.Part(
                inline_data=types.Blob(
                    mime_type=mime_type,
                    data=image_data
                )
            )
            contents.append(image_part)
    contents.append(prompt)

    # Rate limit kontrolü
    if not _rate_limiter.can_make_request():
        wait = _rate_limiter.wait_time()
        if wait > 0:
            time.sleep(wait)

    # Retry mekanizması ile API çağrısı
    last_exception = None
    delay = 1.0  # İlk retry için 1 saniye
    
    for attempt in range(max_retries + 1):
        try:
            _rate_limiter.record_request()
            
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=contents
            )

            text = response.text if hasattr(response, "text") else None
            
            if not text:
                return None, "AI yanıtı alınamadı."

            # JSON parse dene
            calorie_value = None
            comment_text = text  # Fallback: tüm metni yorum olarak kullan
            
            # JSON formatında mı?
            try:
                # JSON bloğunu bul
                json_match = re.search(r'\{[^{}]*"calorie"[^{}]*\}', text, re.DOTALL)
                if json_match:
                    json_str = json_match.group(0)
                    parsed = json.loads(json_str)
                    calorie_value = int(parsed.get("calorie", 0)) if parsed.get("calorie") else None
                    comment_text = parsed.get("comment", text) or text
                else:
                    # JSON yoksa, eski yöntemle kalori bul
                    match = re.search(r'(\d+)\s*(?:kcal|kalori)', text, re.IGNORECASE)
                    if match:
                        calorie_value = int(match.group(1))
            except (json.JSONDecodeError, ValueError, AttributeError):
                # JSON parse başarısız, regex ile kalori ara
                match = re.search(r'(\d+)\s*(?:kcal|kalori)', text, re.IGNORECASE)
                if match:
                    calorie_value = int(match.group(1))

            return calorie_value, comment_text

        except Exception as e:
            last_exception = e
            error_str = str(e).lower()
            
            # 429 (Rate Limit) veya RESOURCE_EXHAUSTED hatası
            if "429" in error_str or "resource_exhausted" in error_str or "quota" in error_str:
                if attempt < max_retries:
                    # Exponential backoff: 1s, 2s, 4s...
                    time.sleep(delay)
                    delay = min(delay * 2, 60.0)  # Max 60 saniye
                    continue
                else:
                    raise ValueError("Gemini API kotası aşıldı veya rate limit'e takıldı. Lütfen daha sonra tekrar deneyin.")
            
            # Diğer hatalar için retry yapma
            raise

    # Tüm retry'lar başarısız
    if last_exception:
        raise last_exception
    
    return None, "AI analizi yapılamadı."


def analyze_nutrition_trends(
    ortalama_kalori: float,
    protein_orani: float,
    karbonhidrat_orani: float,
    yag_orani: float,
    kahvalti_atlanan: int,
    hastaliklar: Optional[str] = None,
    tahlil_ozeti: Optional[str] = None,
    max_retries: int = 3,
) -> Dict[str, Any]:
    """
    Beslenme trend analizi: Son 30 günlük verilere göre genel beslenme alışkanlığı yorumu.
    Rate limit yönetimi ve retry mekanizması içerir.
    
    Dönen dict: {
        "summary": str,
        "positives": List[str],
        "warnings": List[str],
        "recommendations": List[str]
    }
    """
    hastalik_text = hastaliklar or "Belirtilmemiş"
    tahlil_text = tahlil_ozeti or "Tahlil özeti bulunamadı."

    prompt = f"""Sen bir kişisel sağlık uygulamasında çalışan yapay zekâ asistansın.

Aşağıdaki bilgiler, bir HASTANIN son dönemdeki beslenme trendleri,
sağlık durumu ve tahlil özetlerinden sistem tarafından çıkarılmış ÖZET verilerdir.

Bu analiz:
- Hasta tarafında
- "Trendler / Genel Beslenme Alışkanlığı" ekranında
- Bilgilendirme amaçlı gösterilecektir.

Kurallar:
- Tıbbi teşhis koyma
- Tedavi önerme
- Korkutucu veya yargılayıcı dil kullanma
- Sayısal hesaplama yapma

Dil:
- Sade
- Motive edici
- Hasta dostu
- Günlük konuşma diline yakın

İstenen çıktı:
1. Kısa bir paragrafla genel beslenme alışkanlığı yorumu
2. Maddeler halinde:
   - Olumlu alışkanlıklar
   - Dikkat edilmesi gereken noktalar
   - Genel ve basit öneriler

Kullanıcı Trend Özeti:
- Analiz süresi: Son 30 gün
- Ortalama günlük kalori: {ortalama_kalori}
- Makro dağılımı:
  - Protein: {protein_orani}%
  - Karbonhidrat: {karbonhidrat_orani}%
  - Yağ: {yag_orani}%
- Öğün düzeni:
  - Kahvaltı atlanan gün sayısı: {kahvalti_atlanan}
- Mevcut hastalıklar:
  - {hastalik_text}
- Tahlil özetleri:
  - {tahlil_text}

Lütfen sonucu sadece aşağıdaki JSON formatında döndür:

{{
  "summary": "Genel beslenme alışkanlığı yorumu",
  "positives": ["...","..."],
  "warnings": ["...","..."],
  "recommendations": ["...","..."]
}}"""

    # Rate limit kontrolü
    if not _rate_limiter.can_make_request():
        wait = _rate_limiter.wait_time()
        if wait > 0:
            time.sleep(wait)

    # Retry mekanizması ile API çağrısı
    last_exception = None
    delay = 1.0  # İlk retry için 1 saniye
    
    for attempt in range(max_retries + 1):
        try:
            _rate_limiter.record_request()
            
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt
            )

            text = response.text if hasattr(response, "text") else None
            
            if not text:
                raise ValueError("AI yanıtı alınamadı.")

            # JSON parse dene
            try:
                # JSON bloğunu bul (nested JSON'ları da yakalayabilmek için daha geniş regex)
                json_match = re.search(r'\{.*?"summary".*?\}', text, re.DOTALL)
                if json_match:
                    json_str = json_match.group(0)
                    parsed = json.loads(json_str)
                    
                    # Gerekli alanları kontrol et
                    result = {
                        "summary": parsed.get("summary", "Analiz tamamlandı."),
                        "positives": parsed.get("positives", []),
                        "warnings": parsed.get("warnings", []),
                        "recommendations": parsed.get("recommendations", [])
                    }
                    return result
                else:
                    # JSON bulunamadı, tüm metni summary olarak kullan
                    return {
                        "summary": text,
                        "positives": [],
                        "warnings": [],
                        "recommendations": []
                    }
            except json.JSONDecodeError as e:
                # JSON parse başarısız, tüm metni summary olarak kullan
                return {
                    "summary": text,
                    "positives": [],
                    "warnings": [],
                    "recommendations": []
                }

        except Exception as e:
            last_exception = e
            error_str = str(e).lower()
            
            # 429 (Rate Limit) veya RESOURCE_EXHAUSTED hatası
            if "429" in error_str or "resource_exhausted" in error_str or "quota" in error_str:
                if attempt < max_retries:
                    # Exponential backoff: 1s, 2s, 4s...
                    time.sleep(delay)
                    delay = min(delay * 2, 60.0)  # Max 60 saniye
                    continue
                else:
                    raise ValueError("Gemini API kotası aşıldı veya rate limit'e takıldı. Lütfen daha sonra tekrar deneyin.")
            
            # Diğer hatalar için retry yapma
            raise

    # Tüm retry'lar başarısız
    if last_exception:
        raise last_exception
    
    raise ValueError("AI analizi yapılamadı.")


def get_chat_response(
    user_message: str,
    health_summary: str,
    chat_history: List[Dict[str, str]] = None,
    max_retries: int = 3,
) -> str:
    """
    Kullanıcı mesajına göre AI'dan sağlık asistanı cevabı alır.
    
    Args:
        user_message: Kullanıcının mesajı
        health_summary: Hasta sağlık özeti (formatlanmış metin)
        chat_history: Önceki sohbet mesajları (opsiyonel)
        max_retries: Maksimum retry sayısı
    
    Returns:
        AI'dan gelen cevap metni
    """
    chat_history = chat_history or []
    
    # Sistem prompt'u oluştur
    system_prompt = """Sen güvenli, destekleyici ve yönlendirici bir sağlık asistanısın.

ÖNEMLİ KURALLAR:
1. Tıbbi teşhis koyma - Sadece genel bilgilendirme yap
2. İlaç önerme - İlaç önerisi yapma, doktora yönlendir
3. Acil durumlarda - Kullanıcıyı acil servise veya doktora yönlendir
4. Sakin ve açıklayıcı ol - Korkutucu dil kullanma
5. Kişisel verileri kullan - Hasta özetindeki bilgileri kullanarak kişiselleştirilmiş cevaplar ver
6. Türkçe cevap ver - Tüm cevaplar Türkçe olmalı

Görev:
- Kullanıcının sağlık sorularını yanıtla
- Sağlık verilerini yorumla (tansiyon, öğün, tahlil)
- Genel sağlık önerileri ver
- Gerekirse doktora yönlendir

Hasta Sağlık Özeti:
{health_summary}

Lütfen kullanıcının mesajına uygun, sakin ve destekleyici bir cevap ver."""

    # Prompt'u formatla
    base_prompt = system_prompt.format(health_summary=health_summary)
    
    # Chat history varsa ekle
    conversation_parts = []
    
    # Son birkaç mesajı ekle (context için)
    if chat_history:
        recent_history = chat_history[-6:]  # Son 3 çift (user + assistant)
        for msg in recent_history:
            if msg.get("role") == "user":
                conversation_parts.append(f"Kullanıcı: {msg.get('content', '')}")
            elif msg.get("role") == "assistant":
                conversation_parts.append(f"Asistan: {msg.get('content', '')}")
    
    # Kullanıcı mesajını ekle
    conversation_parts.append(f"Kullanıcı: {user_message}")
    conversation_parts.append("Asistan:")
    
    # Tüm içeriği birleştir
    full_prompt = base_prompt + "\n\n" + "\n\n".join(conversation_parts)
    
    # Rate limit kontrolü
    if not _rate_limiter.can_make_request():
        wait = _rate_limiter.wait_time()
        if wait > 0:
            time.sleep(wait)
    
    # Retry mekanizması ile API çağrısı
    last_exception = None
    delay = 1.0
    
    for attempt in range(max_retries + 1):
        try:
            _rate_limiter.record_request()
            
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=full_prompt
            )
            
            text = response.text if hasattr(response, "text") else None
            
            if not text:
                raise ValueError("AI yanıtı alınamadı.")
            
            return text.strip()
            
        except Exception as e:
            last_exception = e
            error_str = str(e).lower()
            
            # 429 (Rate Limit) veya RESOURCE_EXHAUSTED hatası
            if "429" in error_str or "resource_exhausted" in error_str or "quota" in error_str:
                if attempt < max_retries:
                    time.sleep(delay)
                    delay = min(delay * 2, 60.0)
                    continue
                else:
                    raise ValueError("Gemini API kotası aşıldı veya rate limit'e takıldı. Lütfen daha sonra tekrar deneyin.")
            
            # Diğer hatalar için retry yapma
            raise
    
    # Tüm retry'lar başarısız
    if last_exception:
        raise last_exception
    
    raise ValueError("AI cevabı alınamadı.")
