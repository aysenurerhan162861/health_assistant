import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Badge,
  IconButton,
  Typography,
  ListItemButton,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CloseIcon from "@mui/icons-material/Close";
import { getNotifications, markNotificationRead } from "@/services/NotificationHistoryApi";
import { NotificationHistory } from "@/types/NotificationHistory";
import { useRouter } from "next/navigation";

const NotificationPanel: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationHistory[]>([]);
  const [open, setOpen] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
    let isMounted = true;

    const connectWebSocket = () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/ws/chat?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => console.log("Notification WebSocket connected");
      ws.onmessage = (event) => {
        if (!isMounted) return;
        const data = JSON.parse(event.data);
        if (data.type === "notification") {
          setNotifications((prev) => [data, ...prev]);
        }
      };
      ws.onclose = () => {
        console.log("WebSocket disconnected, reconnecting in 3s...");
        setTimeout(connectWebSocket, 3000);
      };
      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        ws.close();
      };
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      wsRef.current?.close();
    };
  }, []);

  const fetchNotifications = async () => {
    const data = await getNotifications();
    setNotifications(data);
  };

  const handleNotificationClick = async (n: NotificationHistory) => {
    await markNotificationRead(n.id);
    setNotifications((prev) =>
      prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
    );

    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const role = storedUser.role;
    let target = "/dashboard";

    if (role === "doctor") {
      switch (n.event_name) {
        case "lab_uploaded":
        case "lab_report_uploaded":
        case "doctor_comment":
        case "lab_comment_added":
          target = "/dashboard/doctors/labs";
          break;
        case "patient_selected_doctor":
        case "patient_added_doctor":
          target = "/dashboard/patients/pending";
          break;
      }
    }

    if (role === "citizen") {
      switch (n.event_name) {
        case "doctor_commented_lab":
        case "doctor_comment":
          target = "/tahlil";
          break;
      }
    }

    if (n.event_metadata?.target_url) {
      target = n.event_metadata.target_url;
    }

    router.push(target);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Box sx={{ position: "relative" }}>
      <IconButton onClick={() => setOpen(!open)}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon sx={{ color: "white" }} />
        </Badge>
      </IconButton>

      {open && (
        <Box
          sx={{
            position: "absolute",
            top: "40px",
            right: 0,
            width: 300,
            maxHeight: 420,
            overflowY: "auto",
            bgcolor: "#f8f8f8",
            boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
            borderRadius: "12px",
            p: 1,
            border: "1px solid #ddd",
            transition: "all 0.25s ease",
            backdropFilter: "blur(4px)",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "flex-end", px: 1, pb: 1 }}>
            <IconButton
              size="small"
              onClick={() => setOpen(false)}
              sx={{
                color: "#555",
                "&:hover": { color: "#222", background: "#e6e6e6" },
                borderRadius: "6px",
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {notifications.length === 0 ? (
            <Typography sx={{ p: 2, textAlign: "center", color: "#555" }}>
              Bildirim yok
            </Typography>
          ) : (
            <List>
              {notifications.map((n) => (
                <ListItem key={n.id} disablePadding>
                  <ListItemButton
                    onClick={() => handleNotificationClick(n)}
                    sx={{
                      bgcolor: n.read ? "#f3f3f3" : "#e9e9e9",
                      borderRadius: "8px",
                      mb: 1,
                      border: "1px solid #ddd",
                      "&:hover": { bgcolor: n.read ? "#ececec" : "#e2e2e2" },
                      transition: "background 0.2s ease",
                    }}
                  >
                    <ListItemText
                      primary={n.title}
                      secondary={n.body}
                      primaryTypographyProps={{
                        fontWeight: n.read ? "normal" : "600",
                        color: "#333",
                      }}
                      secondaryTypographyProps={{ color: "#666" }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      )}
    </Box>
  );
};

export default NotificationPanel;
