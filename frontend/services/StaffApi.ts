import { User } from "../types/Staff";

// Doktorun alt kullanıcı API kökü:
const BASE_URL = "http://localhost:8000/api/doctors";

// Kullanıcı API kökü (alt kullanıcı kendi profili için)
const USER_BASE_URL = "http://localhost:8000/api/users";

/**
 * Alt kullanıcı listesini getir (doktor için)
 */
export async function getStaffList(): Promise<User[]> {
  const token = localStorage.getItem("token") || "";
  const res = await fetch(`${BASE_URL}/my-staff`, {
    headers: { "token-header": `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Alt kullanıcılar alınamadı");
  return res.json();
}

/**
 * Alt kullanıcı sil (doktor için)
 */
export async function removeStaff(memberId: number) {
  const token = localStorage.getItem("token") || "";
  const res = await fetch(`${BASE_URL}/team/remove/${memberId}`, {
    method: "DELETE",
    headers: { "token-header": `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Kullanıcı silinemedi");
  return res.json();
}

/**
 * Alt kullanıcı bilgilerini güncelle (doktor için)
 */
export async function updateStaffProfile(id: number, data: Partial<User>) {
  const token = localStorage.getItem("token") || "";
  const res = await fetch(`${BASE_URL}/team/update/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "token-header": `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Profil güncellenemedi");
  return res.json();
}

/**
 * Alt kullanıcı dosya yükleme (profil fotoğrafı vb.) (doktor için)
 */
export async function uploadStaffFile(id: number, file: File) {
  const token = localStorage.getItem("token") || "";
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/staff/${id}/upload`, {
    method: "POST",
    headers: { "token-header": `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) throw new Error("Fotoğraf yüklenemedi");
  return res.json();
}

/**
 * Doktor alt kullanıcı detayını getir
 */
export async function getStaffMember(staffId: number): Promise<User> {
  const token = localStorage.getItem("token") || "";
  const res = await fetch(`${BASE_URL}/staff/${staffId}`, {
    headers: { "token-header": `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Alt kullanıcı bilgisi alınamadı");
  return res.json();
}

/**
 * Alt kullanıcı kendi profilini günceller (alt kullanıcı için)
 */
export async function updateMyProfile(data: any) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token bulunamadı");

  const res = await fetch(`${USER_BASE_URL}/staff/update/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "token-header": `Bearer ${token}`, // senin sistemine uygun
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Profil güncellenemedi: ${errorText}`);
  }

  return await res.json();
}