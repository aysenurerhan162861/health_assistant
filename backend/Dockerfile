FROM python:3.11-slim

# Sistem bağımlılıklarını yükle
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-eng \
    poppler-utils \
    libjpeg62-turbo-dev \
    zlib1g-dev \
    libpng-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Çalışma dizini
WORKDIR /app

# Python bağımlılıkları
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Proje dosyalarını kopyala
COPY . .

EXPOSE 8000

# 🔥 BURASI ÖNEMLİ: main.py app klasöründe!
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
