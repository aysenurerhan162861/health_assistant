import React, { useEffect, useState } from "react";
import { Box, List, ListItem, ListItemText, Badge, IconButton, Typography, ListItemButton} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { getNotifications, markNotificationRead } from "@/services/NotificationHistoryApi";
import { NotificationHistory } from "@/types/NotificationHistory";

const NotificationPanel: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationHistory[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const data = await getNotifications();
    setNotifications(data);
  };

  const handleMarkRead = async (id: number) => {
    await markNotificationRead(id);
    fetchNotifications();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Box sx={{ position: "relative" }}>
      <IconButton onClick={() => setOpen(!open)}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      {open && (
        <Box sx={{
          position: "absolute",
          top: "40px",
          right: 0,
          width: 300,
          maxHeight: 400,
          overflowY: "auto",
          bgcolor: "background.paper",
          boxShadow: 3,
          borderRadius: 1,
          p: 1
        }}>
          {notifications.length === 0 ? (
            <Typography sx={{ p: 2 }}>Bildirim yok</Typography>
          ) : (
            <List>
  {notifications.map((n) => (
    <ListItem key={n.id} disablePadding>
      <ListItemButton
        onClick={() => handleMarkRead(n.id)}
        sx={{ bgcolor: n.read ? "inherit" : "action.selected" }}
      >
        <ListItemText primary={n.title} secondary={n.body} />
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
