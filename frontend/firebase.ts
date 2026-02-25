// frontend/firebase.ts

import { initializeApp, FirebaseApp } from "firebase/app";
import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";

// 🔥 Senin Firebase config'in buraya gelecek
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID!
};

// Firebase App yalnızca client tarafında oluşturulmalı
let app: FirebaseApp | undefined;
if (typeof window !== "undefined") {
  app = initializeApp(firebaseConfig);
}

export const requestFirebaseNotificationPermission = async (): Promise<string | null> => {
  if (typeof window === "undefined" || !app) return null;

  // Eğer kullanıcı tarayıcıda bildirimleri engellediyse FCM isteme
  if (typeof Notification !== "undefined" && Notification.permission === "denied") {
    console.info("Bildirim izni tarayıcıda engellenmiş (denied).");
    return null;
  }

  try {
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    });
    return token;
  } catch (err) {
    // Kullanıcı izin vermediyse sessizce dön (messaging/permission-blocked)
    if ((err as any)?.code === "messaging/permission-blocked") {
      console.info("FCM isteği reddedildi veya engellendi (permission blocked).");
      return null;
    }
    console.error("FCM token alma hatası:", err);
    return null;
  }
};