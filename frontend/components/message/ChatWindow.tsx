"use client";

import React, { useEffect, useState, useRef } from "react";
import { Box, Button, TextField, Typography, Paper, List, ListItem } from "@mui/material";
import { connectWebSocket, sendMessage } from "@/services/ChatApi";

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
  role: "doctor" | "patient";
}

const ChatWindow: React.FC<ChatWindowProps> = ({ room, senderId, receiverId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const doctorId = Math.max(senderId, receiverId);
  const patientId = Math.min(senderId, receiverId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // 🔥 WEBSOCKET
  useEffect(() => {
    connectWebSocket(
      room,

      // 📩 MESAJ GELDİ
      (raw: string) => {
        const data = JSON.parse(raw);

        if (data.type === "message") {
          setMessages((prev) =>
            prev.some((m) => m.id === data.id) ? prev : [...prev, data]
          );
        }

        if (data.type === "history") {
          setMessages(data.messages);
        }
      },

      // 📌 BAĞLANINCA history iste
      () => {
        const historyPayload = {
          type: "history",
          doctor_id: doctorId,
          patient_id: patientId,
        };

        sendMessage(JSON.stringify(historyPayload));
      }
    );
  }, [room, doctorId, patientId]);

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

      <List sx={{ maxHeight: 320, overflowY: "auto", pr: 1 }}>
        {messages.map((msg) => (
          <ListItem
            key={msg.id}
            sx={{
              justifyContent: msg.sender_id === senderId ? "flex-end" : "flex-start",
              display: "flex",
            }}
          >
            <Box
              sx={{
                bgcolor: msg.sender_id === senderId ? "#0a2d57" : "#e0e0e0",
                color: msg.sender_id === senderId ? "#fff" : "#000",
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
                {msg.sender_id === senderId ? "Sen" : msg.sender_name}
              </Typography>
            </Box>
          </ListItem>
        ))}
        <div ref={messagesEndRef} />
      </List>

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
