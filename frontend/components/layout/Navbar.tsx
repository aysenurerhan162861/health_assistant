"use client";

import React from "react";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { useRouter } from "next/router";
import NotificationPanel from "../doctors/NotificationPanel";
import MessageNotificationPanel from "../ayarlar/MessageNotificationPanel";


const Navbar: React.FC = () => {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: "#1976d2",
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h6" noWrap component="div">
          Sağlık Asistanı
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          
          <NotificationPanel />
            {/* Mesaj bildirimleri */}
          <MessageNotificationPanel />

          <Button color="inherit" onClick={handleLogout}>
            Çıkış Yap
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
