"use client";

import React, { useEffect, useState, useRef } from "react";
import { Box, Button, TextField, Typography, Paper } from "@mui/material";
import { connectWebSocket, sendMessage, disconnectWebSocket } from "@/services/ChatApi";

interface ChatMessage {
  id: number;
  text: string;
  sender_name: string;
  sender_id: number;
  created_at: string;
}

interface ChatWindowProps {
  room: string;
  senderId: number;
  receiverId: number;
  role: "doctor" | "patient"| "assistant";
}

const ChatWindow: React.FC<ChatWindowProps> = ({ room, senderId, receiverId, role }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Doktor ve hasta id'sini rol bilgisine göre net belirle (string gelirse number'a çevir)
  const doctorId = role === "doctor" ? Number(senderId) : Number(receiverId);
  const patientId = role === "doctor" ? Number(receiverId) : Number(senderId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // 🔥 WEBSOCKET
  useEffect(() => {
    console.log("ChatWindow: Connecting WebSocket", { room, doctorId, patientId, senderId, receiverId, role });
    
    connectWebSocket(
      room,

      // 📩 MESAJ GELDİ
      (raw: string) => {
        try {
          const data = JSON.parse(raw);
          console.log("ChatWindow: Received message", data.type, data);

          if (data.type === "message") {
            setMessages((prev) =>
              prev.some((m) => m.id === data.id) ? prev : [...prev, data]
            );
          }

          if (data.type === "history") {
            console.log("ChatWindow: History received", data.messages?.length || 0, "messages");
            setMessages(data.messages || []);
          }

          // Bildirim tipini mesaj listesine karıştırma
          if (data.type === "notification") {
            return;
          }
        } catch (err) {
          console.error("ChatWindow: Parse error", err, raw);
        }
      },

      // 📌 BAĞLANINCA history iste
      () => {
        console.log("ChatWindow: WebSocket opened, requesting history", { doctorId, patientId });
        // WebSocket açıldıktan sonra kısa bir gecikme ile history isteği gönder
        setTimeout(() => {
          const historyPayload = {
            type: "history",
            doctor_id: doctorId,
            patient_id: patientId,
          };
          console.log("ChatWindow: Sending history request", historyPayload);
          sendMessage(JSON.stringify(historyPayload));
        }, 200);
      }
    );

    // Cleanup: önceki bağlantıyı kapat
    return () => {
      console.log("ChatWindow: Cleaning up WebSocket");
      disconnectWebSocket();
    };
  }, [room, doctorId, patientId, senderId, receiverId, role]);

  // 📤 MESAJ GÖNDERME
  const handleSend = () => {
    if (!input.trim()) return;

    const payload = {
      type: "message",
      room,
      doctor_id: doctorId,
      patient_id: patientId,
      sender_id: senderId,
      receiver_id: receiverId,
      text: input,
    };

    sendMessage(JSON.stringify(payload));

    setInput("");
  };

  return (
    <Paper sx={{ p: 2, borderRadius: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
        Sohbet
      </Typography>

      <Box sx={{ maxHeight: 320, overflowY: "auto", pr: 1, display: "flex", flexDirection: "column", gap: 1 }}>
        {messages.map((msg) => {
          const isOwnMessage = msg.sender_id === senderId;
          return (
            <Box
              key={msg.id}
              sx={{
                display: "flex",
                justifyContent: isOwnMessage ? "flex-end" : "flex-start",
                width: "100%",
              }}
            >
              <Box
                sx={{
                  bgcolor: isOwnMessage ? "#0a2d57" : "#e0e0e0",
                  color: isOwnMessage ? "#fff" : "#000",
                  p: 1.3,
                  borderRadius: 2,
                  maxWidth: "70%",
                  wordBreak: "break-word",
                }}
              >
                <Typography variant="body2">{msg.text}</Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    textAlign: "right",
                    mt: 0.5,
                    opacity: 0.8,
                  }}
                >
                  {isOwnMessage ? "Sen" : msg.sender_name}
                </Typography>
              </Box>
            </Box>
          );
        })}
        <div ref={messagesEndRef} />
      </Box>

      <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
        <TextField
          fullWidth
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Mesaj yaz..."
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <Button variant="contained" onClick={handleSend}>
          Gönder
        </Button>
      </Box>
    </Paper>
  );
};

export default ChatWindow;
