const API_URL = "http://localhost:8000/api/users"

export interface User {
  id: number;
  name?: string;
  email: string;
  role?: string;
  photoUrl?: string;
  must_change_password: boolean;

  // form alanları
  phone?: string;
  birth_date?: string;
  birthDate?: string;
  gender?: string;
  city?: string;
  district?: string;
  neighborhood?: string;
  blood_type?: string;
  bloodType?: string;
  chronic_diseases?: string;
  chronicDiseases?: string;
  allergies?: string;
  branch?: string;
  experience?: number;
  institution?: string;
  diploma_no?: string;
  diplomaNo?: string;
  certifications?: string | string[];
  about?: string;
}

export interface ApiResponse {
  message?: string;
  error?: string;
  token?: string;
  user?: User;
}

// Sunucu yanıtını handle et
async function handleResponse(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch (err) {
    return { error: "Sunucu yanıtı alınamadı" };
  }
}

// Kullanıcı kayıt
export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  role: string;
}): Promise<ApiResponse> {
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// Giriş
export async function loginUser(data: { email: string; password: string }): Promise<ApiResponse> {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// Mevcut kullanıcı bilgisi
export async function getMe(): Promise<User> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token bulunamadı");

  const res = await fetch(`${API_URL}/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "token-header": `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Kullanıcı bilgisi alınamadı");
  return await res.json();
}

// 🧩 Kullanıcı bilgilerini güncelle
export async function updateUser(data: Partial<User>): Promise<ApiResponse> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token bulunamadı");

  // FastAPI'nin beklediği snake_case formatına dönüştür
  const payload = {
  name: data.name,
  email: data.email,
  phone: data.phone,
  birth_date: data.birthDate
    ? new Date(data.birthDate).toISOString().split("T")[0]
    : data.birth_date,
  gender: data.gender,
  city: data.city,
  district: data.district,
  neighborhood: data.neighborhood,
  blood_type: data.bloodType || data.blood_type,
  chronic_diseases: data.chronicDiseases || data.chronic_diseases,
  allergies: data.allergies,
  branch: data.branch,
  experience: data.experience,
  institution: data.institution,
  diploma_no: data.diplomaNo,
  certifications:
    Array.isArray(data.certifications)
      ? data.certifications.join(",")
      : data.certifications, // string ise olduğu gibi bırak
  about: data.about,
  photo_url: data.photoUrl,
};

  const res = await fetch(`${API_URL}/update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "token-header": `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(res);
}

// Doktor alt kullanıcı ekleme
export async function addTeamMember(data: {
  name: string;
  email: string;
  role: "assistant" | "sekreter";
}): Promise<ApiResponse> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token bulunamadı");

  const res = await fetch(`${API_URL}/create-staff`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "token-header": `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      role: data.role,
    }),
  });

  return handleResponse(res);
}

// İlk girişte şifre değiştirme
export async function changePasswordFirstLogin(newPassword: string, token: string) {
  try {
    const res = await fetch(`${API_URL}/change-password-first-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "token-header": `Bearer ${token}`,
      },
      body: JSON.stringify({ new_password: newPassword }),
    });

    if (!res.ok) {
      const err = await res.json();
      return { error: err.detail || "Hata oluştu" };
    }

    return await res.json();
  } catch (err) {
    return { error: "İstek başarısız" };
  }
}
export async function getMyStaff(): Promise<User[]> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token bulunamadı");

  const res = await fetch("http://localhost:8000/api/doctors/my-staff", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "token-header": `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Alt kullanıcılar alınamadı");
  return await res.json();
}

export async function removeTeamMember(memberId: number): Promise<ApiResponse> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token bulunamadı");

  const res = await fetch(`http://localhost:8000/api/doctors/team/remove/${memberId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "token-header": `Bearer ${token}`,
    },
  });

  return handleResponse(res);
}


export async function updateTeamMember(
  memberId: number,
  data: { name?: string; email?: string; role?: "assistant" | "sekreter" }
): Promise<ApiResponse> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token bulunamadı");

  const res = await fetch(`http://localhost:8000/api/doctors/team/update/${memberId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "token-header": `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return handleResponse(res);
}