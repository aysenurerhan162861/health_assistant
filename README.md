# 🏥 Health Assistant

Sağlık asistanı uygulaması — kullanıcıların tansiyon, öğün ve tahlil verilerini takip etmesini, yapay zeka destekli sağlık yorumları almasını sağlayan full-stack bir web uygulaması.

---

## 🚀 Özellikler

- 🔐 Kullanıcı kaydı ve girişi (JWT tabanlı kimlik doğrulama)
- 📊 Tansiyon takibi ve trend analizi
- 🍽️ Öğün kaydı ve kalori analizi (görsel destekli)
- 🧪 Laboratuvar tahlili yükleme ve yapay zeka yorumu
- 🤖 Gemini AI destekli sağlık chatbotu
- 🔔 Firebase ile anlık bildirimler
- 👨‍⚕️ Doktor-hasta yönetim paneli

---

## 🛠️ Teknolojiler

| Katman | Teknoloji |
|--------|-----------|
| Backend | Python, FastAPI |
| Frontend | Next.js, TypeScript |
| Veritabanı | PostgreSQL |
| AI | Google Gemini API |
| Bildirim | Firebase Cloud Messaging |
| Container | Docker, Docker Compose |

---

## ⚙️ Kurulum

### Gereksinimler

- [Docker](https://www.docker.com/) ve Docker Compose
- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/) (v3.10+)
- Google Gemini API Key
- Firebase projesi

---

### 1. Repoyu klonla

```bash
git clone https://github.com/aysenurerhan162861/health_assistant.git
cd health_assistant
```

---

### 2. Ortam değişkenlerini ayarla

**Ana klasörde `.env` dosyası oluştur:**

```env
POSTGRES_USER=dev
POSTGRES_PASSWORD=sifrenizi_yazin
POSTGRES_DB=healthapp
PGADMIN_EMAIL=admin@admin.com
PGADMIN_PASSWORD=sifrenizi_yazin
```

**`backend/.env` dosyası oluştur:**

```env
SECRET_KEY=gizli_anahtar_yazin
ACCESS_TOKEN_EXPIRE_MINUTES=60
GEMINI_API_KEY=gemini_api_key_yazin
DATABASE_URL=postgresql://dev:sifre@postgres:5432/healthapp
```

**`frontend/.env.local` dosyası oluştur:**

```env
NEXT_PUBLIC_FIREBASE_API_KEY=buraya_yazin
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=buraya_yazin
NEXT_PUBLIC_FIREBASE_PROJECT_ID=buraya_yazin
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=buraya_yazin
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=buraya_yazin
NEXT_PUBLIC_FIREBASE_APP_ID=buraya_yazin
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=buraya_yazin
NEXT_PUBLIC_FIREBASE_VAPID_KEY=buraya_yazin
```

**`frontend/public/firebase-messaging-sw.js` dosyası oluştur:**

```javascript
importScripts('https://www.gstatic.com/firebasejs/12.6.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.6.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "FIREBASE_API_KEY",
  authDomain: "FIREBASE_AUTH_DOMAIN",
  projectId: "FIREBASE_PROJECT_ID",
  storageBucket: "FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "FIREBASE_MESSAGING_SENDER_ID",
  appId: "FIREBASE_APP_ID",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/firebase-logo.png'
  });
});
```

---

### 3. Docker ile başlat

```bash
docker-compose up --build
```

Uygulama şu adreslerde çalışacak:

| Servis | Adres |
|--------|-------|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| pgAdmin | http://localhost:5051 |

---

### 4. Docker olmadan başlatmak istersen

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 📁 Proje Yapısı

```
health_assistant/
├── backend/
│   ├── app/
│   │   ├── api/          # API endpoint'leri
│   │   ├── controllers/  # İş mantığı
│   │   ├── models/       # Veritabanı modelleri
│   │   ├── schemas/      # Pydantic şemaları
│   │   └── services/     # Servis katmanı
│   └── requirements.txt
├── frontend/
│   ├── components/       # React bileşenleri
│   ├── pages/            # Next.js sayfaları
│   └── services/         # API servisleri
└── docker-compose.yml
```

---

## 🔑 API Key'leri Nereden Alınır?

- **Gemini API Key:** [Google AI Studio](https://aistudio.google.com/)
- **Firebase:** [Firebase Console](https://console.firebase.google.com/) → Proje oluştur → Proje ayarları

---

## 📄 Lisans

Bu proje açık kaynaklıdır. Dilediğiniz gibi kullanabilir ve geliştirebilirsiniz.
