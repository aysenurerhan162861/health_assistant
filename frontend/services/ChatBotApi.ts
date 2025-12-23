// frontend/services/ChatBotApi.ts
import { ChatRequest, ChatResponse } from "@/types/ChatBot";

const API_BASE_URL = "http://localhost:8000/api/chat";

// Token'ı localStorage'dan al
function getAuthToken(): string {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Token bulunamadı. Lütfen giriş yapın.");
  }
  return token;
}

// Chat mesajı gönder
export async function sendChatMessage(message: string): Promise<ChatResponse> {
  const token = getAuthToken();
  
  const request: ChatRequest = { message };
  
  const response = await fetch(`${API_BASE_URL}/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "token-header": `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Mesaj gönderilemedi");
  }
  
  return await response.json();
}

