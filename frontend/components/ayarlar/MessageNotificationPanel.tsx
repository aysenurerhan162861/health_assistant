"use client";

import React, { useEffect, useState, useRef } from "react";
import { Box, IconButton, Badge, Menu, MenuItem } from "@mui/material";
import MailIcon from "@mui/icons-material/Mail";
import { useRouter } from "next/navigation";

interface LastSender {
  sender_id: number;
  sender_name: string;
  unread_count: number;
}

const MessageNotificationPanel: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [lastSenders, setLastSenders] = useState<LastSender[]>([]);
  const router = useRouter();
  const wsRef = useRef<WebSocket | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [isDoctor, setIsDoctor] = useState<boolean>(false);

  // Kullanıcı bilgilerini al
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserId(user.id);
      setIsDoctor(user.role === "doctor"); // user.role ile doktor mu hasta mı olduğunu belirle
    }
  }, []);

  // Okunmamış mesajları çek
  const fetchLastSenders = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`http://localhost:8000/last_senders/${userId}`);
      const data = await res.json();
      setLastSenders(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Sayfa açılır açılmaz mesajları çek
  useEffect(() => {
    if (userId) fetchLastSenders();
  }, [userId]);

  // WebSocket ile canlı mesajları dinle
  useEffect(() => {
    if (!userId) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const ws = new WebSocket(`ws://localhost:8000/ws/chat?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => console.log("WebSocket connected");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "message") {
        const senderId = data.sender_id;
        const senderName = data.sender_name;

        // Eğer mesaj kendisinden geliyorsa (gönderen), sayı artırmamalı
        // Sadece alıcı için sayı artmalı
        if (senderId === userId) {
          // Mesaj kendisinden geldi, sayı artırmadan sadece listeyi güncelle
          return;
        }

        setLastSenders((prev) => {
          const exists = prev.find((s) => s.sender_id === senderId);
          if (exists) {
            return prev.map((s) =>
              s.sender_id === senderId
                ? { ...s, unread_count: (s.unread_count || 0) + 1 }
                : s
            );
          } else {
            return [
              ...prev,
              { sender_id: senderId, sender_name: senderName, unread_count: 1 },
            ];
          }
        });
        
        // Mesaj geldiğinde listeyi yeniden çek (güncel sayıları almak için)
        // Kısa bir gecikme ile çek ki backend'de kayıt tamamlansın
        setTimeout(() => {
          fetchLastSenders();
        }, 500);
      }
    };

    ws.onclose = () => console.log("WebSocket disconnected");

    return () => ws.close();
  }, [userId]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const goToPage = (senderId: number) => {
    // Doktor ise approved patients sayfası
    if (isDoctor) {
      router.push(`/dashboard/patients/approved?openChat=${senderId}`);
    } else {
      // Hasta ise doktorlar sayfası
      router.push(`/dashboard/doctors?openChat=${senderId}`);
    }

    handleClose();

    // Mesajları okunmuş olarak işaretle
    if (!userId) return;
    fetch(
      `http://localhost:8000/messages/mark_read?sender_id=${senderId}&receiver_id=${userId}`,
      { method: "POST" }
    );

    setLastSenders((prev) =>
      prev.map((s) =>
        s.sender_id === senderId ? { ...s, unread_count: 0 } : s
      )
    );
  };

  const totalUnread = lastSenders.reduce(
    (acc, cur) => acc + (cur.unread_count || 0),
    0
  );

  return (
    <Box sx={{ position: "relative", ml: 2 }}>
      <IconButton onClick={handleClick}>
        <Badge badgeContent={totalUnread} color="error">
          <MailIcon sx={{ color: "white" }} />
        </Badge>
      </IconButton>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        {lastSenders.length === 0 && <MenuItem>Mesaj yok</MenuItem>}
        {lastSenders.map((sender) => (
          <MenuItem
            key={sender.sender_id}
            onClick={() => goToPage(sender.sender_id)}
            sx={{
              backgroundColor:
                sender.unread_count > 0 ? "rgba(0,123,255,0.1)" : "white",
              fontWeight: sender.unread_count > 0 ? "bold" : "normal",
            }}
          >
            {sender.sender_name}{" "}
            {sender.unread_count > 0 && `(${sender.unread_count})`}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default MessageNotificationPanel;
