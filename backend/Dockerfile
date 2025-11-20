# Base image
FROM python:3.11-slim

# Çalışma dizini
WORKDIR /app

# PYTHONPATH ile app klasörünü modül yolu yap
ENV PYTHONPATH=/app

# Dependencies
COPY requirements.txt .
RUN apt-get update && \
    apt-get install -y poppler-utils tesseract-ocr && \
    pip install --no-cache-dir -r requirements.txt && \
    rm -rf /var/lib/apt/lists/*

# uploads klasörünü oluştur
RUN mkdir -p uploads/lab_reports

# Uygulama kodunu kopyala
COPY ./app ./app

# Uvicorn ile FastAPI çalıştır
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
