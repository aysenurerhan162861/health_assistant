// src/services/PatientApi.ts
import { User } from "../types/Staff";

const BASE_URL = "http://localhost:8000/api/patients";

export interface Doctor extends User {
  specialty?: string;
  phone?: string;
  status?: "bekliyor" | "onaylandı" | "reddedildi";
  note?: string;
}

// Doktorlar
export async function getDoctors(): Promise<Doctor[]> {
  const token = localStorage.getItem("token") || "";
  const res = await fetch(`${BASE_URL}/doctors`, {
    headers: { "token-header": `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Doktorlar alınamadı");
  return res.json();
}

// Hasta kendi doktoru
export async function getMyDoctorStatus(): Promise<Doctor | null> {
  const token = localStorage.getItem("token") || "";
  const res = await fetch(`${BASE_URL}/my-doctor`, {
    headers: { "token-header": `Bearer ${token}` },
  });
  if (!res.ok) return null;

  const data = await res.json();
  // Backend array dönüyor, tek doktor varsayımıyla alıyoruz
  const doctor = data[0]; 
  if (!doctor) return null;

  return {
    id: doctor.doctor_id,
    name: doctor.doctor_name,
    email: doctor.doctor_email,
    specialty: doctor.specialty || "", // eğer backend vermiyorsa boş
    phone: doctor.phone || "",         // eğer backend vermiyorsa boş
    status: doctor.status as "bekliyor" | "onaylandı" | "reddedildi",
    note: doctor.note || "",
  };
}

// Doktor seç
export async function requestDoctor(payload: { doctor_id: number; note?: string }) {
  const token = localStorage.getItem("token") || "";
  const res = await fetch(`${BASE_URL}/select-doctor`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "token-header": `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Doktor seçimi yapılamadı");
  return res.json();
}

// Doktor sil
export async function deleteDoctor(requestId: number) {
  const token = localStorage.getItem("token") || "";
  const res = await fetch(`${BASE_URL}/delete-doctor/${requestId}`, {
    method: "DELETE",
    headers: { "token-header": `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Silme başarısız: ${err}`);
  }
}
// Onaylı hastalar
export async function getApprovedPatients(): Promise<User[]> {
  const token = localStorage.getItem("token") || "";
  const res = await fetch(`${BASE_URL}/approved`, {
    headers: { "token-header": `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Onaylı hastalar alınamadı");
  return res.json();
}

// Onaylı hastanın detayı
export const getPatientById = async (id: number): Promise<User> => {
  const token = localStorage.getItem("token") || "";
  const res = await fetch(`${BASE_URL}/approved/${id}`, {
    headers: { "Content-Type": "application/json", "token-header": `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Onaylı hasta bilgisi alınamadı");
  return res.json();
};

// ✅ Eksik fonksiyonlar — pending hastalar ve onay/reddet
export async function getPendingPatients(): Promise<User[]> {
  const token = localStorage.getItem("token") || "";
  const res = await fetch(`${BASE_URL}/pending`, {
    headers: { "token-header": `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Bekleyen hastalar alınamadı");
  return res.json();
}

export async function approvePatient(patientId: number) {
  const token = localStorage.getItem("token") || "";
  const res = await fetch(`${BASE_URL}/approve/${patientId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "token-header": `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Hasta onaylanamadı");
  return res.json();
}

export async function rejectPatient(patientId: number) {
  const token = localStorage.getItem("token") || "";
  const res = await fetch(`${BASE_URL}/reject/${patientId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "token-header": `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Hasta reddedilemedi");
  return res.json();
}
