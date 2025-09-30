const API_URL = "http://localhost:8000/api/users";

export interface User {
  id: number;
  name?: string;
  email: string;
  role?: string;
}

export interface ApiResponse {
  message?: string;
  error?: string;
  token?: string;
  user?: User;
}

async function handleResponse(res: Response): Promise<ApiResponse> {
  try {
    return await res.json();
  } catch (err) {
    return { error: "Sunucu yanıtı alınamadı" };
  }
}

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

export async function loginUser(data: { email: string; password: string }): Promise<ApiResponse> {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}
