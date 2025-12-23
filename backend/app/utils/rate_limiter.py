"""
Rate limiter ve retry mekanizması için yardımcı modül.
Gemini API rate limit'lerini yönetmek için kullanılır.
"""
import time
import asyncio
from typing import Callable, Optional, Any
from functools import wraps
from datetime import datetime, timedelta
import threading

# Thread-safe rate limiter
class RateLimiter:
    """
    Basit bir token bucket rate limiter.
    Gemini API için dakikada maksimum istek sayısını kontrol eder.
    """
    def __init__(self, max_requests: int = 15, time_window: int = 60):
        """
        Args:
            max_requests: Zaman penceresi içinde izin verilen maksimum istek sayısı
            time_window: Zaman penceresi (saniye cinsinden, varsayılan 60 = 1 dakika)
        """
        self.max_requests = max_requests
        self.time_window = time_window
        self.requests = []  # İstek zamanlarını tutar
        self.lock = threading.Lock()
    
    def can_make_request(self) -> bool:
        """Şu anda istek yapılabilir mi kontrol eder."""
        with self.lock:
            now = time.time()
            # Eski istekleri temizle (time_window dışında kalanlar)
            self.requests = [req_time for req_time in self.requests 
                          if now - req_time < self.time_window]
            
            if len(self.requests) < self.max_requests:
                return True
            return False
    
    def wait_time(self) -> float:
        """Bir sonraki istek için bekleme süresini hesaplar (saniye)."""
        with self.lock:
            if not self.requests:
                return 0.0
            oldest = min(self.requests)
            wait = self.time_window - (time.time() - oldest)
            return max(0.0, wait)
    
    def record_request(self):
        """Bir istek yapıldığını kaydeder."""
        with self.lock:
            self.requests.append(time.time())


# Global rate limiter instance (Gemini API için)
# Gemini Free Tier: ~15 requests/minute
# Gemini Pro: Daha yüksek limitler
gemini_rate_limiter = RateLimiter(max_requests=15, time_window=60)


def with_rate_limit(func: Callable) -> Callable:
    """
    Decorator: Fonksiyonu rate limiter ile sarmalar.
    Rate limit'e takılırsa otomatik bekler.
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        # Rate limit kontrolü
        if not gemini_rate_limiter.can_make_request():
            wait = gemini_rate_limiter.wait_time()
            if wait > 0:
                time.sleep(wait)
        
        # İsteği kaydet
        gemini_rate_limiter.record_request()
        
        # Fonksiyonu çalıştır
        return func(*args, **kwargs)
    
    return wrapper


def retry_with_backoff(
    max_retries: int = 3,
    initial_delay: float = 1.0,
    max_delay: float = 60.0,
    exponential_base: float = 2.0,
    retry_on: tuple = (429, 500, 503)  # HTTP status codes
):
    """
    Exponential backoff ile retry decorator.
    
    Args:
        max_retries: Maksimum deneme sayısı
        initial_delay: İlk bekleme süresi (saniye)
        max_delay: Maksimum bekleme süresi (saniye)
        exponential_base: Exponential artış katsayısı
        retry_on: Hangi HTTP status code'larında retry yapılacak
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            delay = initial_delay
            last_exception = None
            
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    
                    # 429 (Rate Limit) hatası için özel işlem
                    if hasattr(e, 'status_code') and e.status_code in retry_on:
                        if attempt < max_retries:
                            # Exponential backoff
                            wait_time = min(delay, max_delay)
                            time.sleep(wait_time)
                            delay *= exponential_base
                            continue
                    
                    # Retry edilmeyecek hatalar veya max retry'a ulaşıldı
                    raise last_exception
            
            raise last_exception
        return wrapper
    return decorator

