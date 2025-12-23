// frontend/types/ChatBot.ts
export interface ChatMessage {
  id?: number;
  user_id?: number;
  message: string;
  response: string;
  created_at?: string;
}

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  id: number;
  user_id: number;
  message: string;
  response: string;
  created_at: string;
}

