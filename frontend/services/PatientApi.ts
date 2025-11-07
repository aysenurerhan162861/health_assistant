// src/services/patientApi.ts
import { User } from "../types/Staff"; // Senin User tipi zaten mevcut, hasta için de kullanabiliriz

const BASE_URL = "http://localhost:8000/api/patients";

/**
 * Doktora bağlı onay bekleyen hastaları getir
 */
export async function getPendingPatients(): Promise<User[]> {
  const token = localStorage.getItem("token") || "";
  const res = await fetch(`${BASE_URL}/pending`, {
    headers: { "token-header": `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Onay bekleyen hastalar alınamadı");
  return res.json();
}

/**
 * Doktora bağlı onaylanmış hastaları getir
 */
export async function getApprovedPatients(): Promise<User[]> {
  const token = localStorage.getItem("token") || "";
  const res = await fetch(`${BASE_URL}/approved`, {
    headers: { "token-header": `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Hastalar alınamadı");
  return res.json();
}

/**
 * Hastayı onayla (doktor)
 */
export async function approvePatient(patientId: number): Promise<{ message: string }> {
  const token = localStorage.getItem("token") || "";
  const res = await fetch(`${BASE_URL}/approve/${patientId}`, {
    method: "POST",
    headers: { "token-header": `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Hasta onaylanamadı");
  return res.json();
}

/**
 * Hastayı reddet (doktor)
 */
export async function rejectPatient(patientId: number): Promise<{ message: string }> {
  const token = localStorage.getItem("token") || "";
  const res = await fetch(`${BASE_URL}/reject/${patientId}`, {
    method: "POST",
    headers: { "token-header": `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Hasta reddedilemedi");
  return res.json();
}

/**
 * Hasta kendi doktorunu seçtiğinde onay bekleyen tablosuna düşmesi
 */
// Hasta kendi doktorunu seçtiğinde backend'e gönder
export async function requestDoctor(payload: { patient_id: number; doctor_id: number; note?: string }) {
  const token = localStorage.getItem("token") || "";
  const res = await fetch(`${BASE_URL}/select-doctor`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "token-header": `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Doktor seçimi yapılamadı");
  return res.json();
}
/**
 * Doktor listesini çek (CitizenForm için)
 */
export async function getDoctors(): Promise<User[]> {
  const token = localStorage.getItem("token") || "";
  const res = await fetch(`${BASE_URL}/doctors`, {
    headers: { "token-header": `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Doktorlar alınamadı");
  return res.json();
}

export async function getMyDoctorStatus() {
  const token = localStorage.getItem("token") || "";
  const res = await fetch(`${BASE_URL}/my-doctor`, {
    headers: {
      "token-header": `Bearer ${token}`, // ⚠ backend'in diğer endpoint’lerinde kullandığı header ile aynı olmalı
    },
  });
  if (!res.ok) throw new Error("Doktor durumu alınamadı");
  return await res.json();
}

export const getPatientById = async (id: number): Promise<User> => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token bulunamadı");

  const res = await fetch(`${BASE_URL}/approved/${id}`, {
    headers: {
      "Content-Type": "application/json",
      "token-header": `Bearer ${token}`, // ✅ senin sistemde kullanılan özel header
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Onaylı hasta bilgisi alınamadı: ${errorText}`);
  }

  return res.json();
};