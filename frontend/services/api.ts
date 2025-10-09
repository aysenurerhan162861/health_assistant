const API_URL = "http://localhost:8000/api/users";

export interface User {
  id: number;
  name?: string;
  email: string;
  role?: string;
  photoUrl?: string;
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

// Kullanıcı bilgilerini güncelle
export async function updateUser(data: Partial<User>): Promise<ApiResponse> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token bulunamadı");

  const res = await fetch(`${API_URL}/update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "token-header": `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return handleResponse(res);
}

// Doktor alt kullanıcı ekleme
export async function addTeamMember(data: {
  name: string;
  email: string;
  password: string;
  role: "assistant" | "sekreter";
}): Promise<ApiResponse> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token bulunamadı");

  const res = await fetch(`http://localhost:8000/api/doctors/team/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "token-header": `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return handleResponse(res);
}
