"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Fab,
  Paper,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
  Slide,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import ChatIcon from "@mui/icons-material/Chat";
import { sendChatMessage } from "@/services/ChatBotApi";
import { ChatMessage } from "@/types/ChatBot";

const HealthChatbot: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mesajlar değiştiğinde en alta kaydır
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    
    // Kullanıcı mesajını ekle (geçici)
    const tempUserMessage: ChatMessage = {
      message: userMessage,
      response: "",
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    setLoading(true);

    try {
      const response = await sendChatMessage(userMessage);
      
      // Mesajı güncelle (AI cevabı ile)
      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0) {
          const lastMessage = updated[lastIndex];
          if (lastMessage && lastMessage.message === userMessage) {
            updated[lastIndex] = response;
          }
        }
        return updated;
      });
    } catch (error: any) {
      console.error("Mesaj gönderme hatası:", error);
      
      // Hata mesajını göster
      const errorMessage: ChatMessage = {
        message: userMessage,
        response: `Üzgünüm, bir hata oluştu: ${error.message || "Bilinmeyen hata"}`,
      };
      
      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0) {
          const lastMessage = updated[lastIndex];
          if (lastMessage && lastMessage.message === userMessage) {
            updated[lastIndex] = errorMessage;
          }
        }
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Yüzen Buton */}
      <Fab
        color="primary"
        aria-label="chat"
        onClick={() => setOpen(!open)}
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 1000,
          bgcolor: "#0a2d57",
          "&:hover": {
            bgcolor: "#082147",
          },
        }}
      >
        {open ? <CloseIcon /> : <ChatIcon />}
      </Fab>

      {/* Sohbet Penceresi */}
      <Slide direction="up" in={open} mountOnEnter unmountOnExit>
        <Paper
          elevation={8}
          sx={{
            position: "fixed",
            bottom: 100,
            right: 24,
            width: 400,
            height: 600,
            maxHeight: "80vh",
            display: "flex",
            flexDirection: "column",
            zIndex: 999,
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              bgcolor: "#0a2d57",
              color: "white",
              p: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Sağlık Asistanı
            </Typography>
            <IconButton
              size="small"
              onClick={() => setOpen(false)}
              sx={{ color: "white" }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Mesajlar Alanı */}
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              p: 2,
              bgcolor: "#f5f5f5",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {messages.length === 0 && (
              <Box
                sx={{
                  textAlign: "center",
                  color: "text.secondary",
                  mt: 4,
                }}
              >
                <Typography variant="body2">
                  Merhaba! Size nasıl yardımcı olabilirim?
                </Typography>
                <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
                  Sağlık sorularınızı sorabilir, tansiyon değerlerinizi
                  yorumlatabilir veya beslenme önerileri alabilirsiniz.
                </Typography>
              </Box>
            )}

            {messages.map((msg, index) => (
              <React.Fragment key={index}>
                {/* Kullanıcı Mesajı (Sağda) */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: "#0a2d57",
                      color: "white",
                      p: 1.5,
                      borderRadius: 2,
                      maxWidth: "75%",
                      wordWrap: "break-word",
                    }}
                  >
                    <Typography variant="body2">{msg.message}</Typography>
                  </Box>
                </Box>

                {/* Bot Cevabı (Solda) */}
                {msg.response && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-start",
                    }}
                  >
                    <Box
                      sx={{
                        bgcolor: "white",
                        p: 1.5,
                        borderRadius: 2,
                        maxWidth: "75%",
                        wordWrap: "break-word",
                        border: "1px solid #e0e0e0",
                      }}
                    >
                      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                        {msg.response}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </React.Fragment>
            ))}

            {/* Yükleniyor Animasyonu */}
            {loading && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-start",
                }}
              >
                <Box
                  sx={{
                    bgcolor: "white",
                    p: 1.5,
                    borderRadius: 2,
                    border: "1px solid #e0e0e0",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary">
                    Düşünüyorum...
                  </Typography>
                </Box>
              </Box>
            )}

            <div ref={messagesEndRef} />
          </Box>

          {/* Input Alanı */}
          <Box
            sx={{
              p: 2,
              borderTop: "1px solid #e0e0e0",
              bgcolor: "white",
              display: "flex",
              gap: 1,
            }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="Mesajınızı yazın..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              multiline
              maxRows={3}
            />
            <IconButton
              color="primary"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || loading}
              sx={{
                bgcolor: "#0a2d57",
                color: "white",
                "&:hover": {
                  bgcolor: "#082147",
                },
                "&.Mui-disabled": {
                  bgcolor: "#e0e0e0",
                  color: "#9e9e9e",
                },
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Paper>
      </Slide>
    </>
  );
};

export default HealthChatbot;

