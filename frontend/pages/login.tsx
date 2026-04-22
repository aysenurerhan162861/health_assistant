import React from "react";
import { Box, Typography } from "@mui/material";
import LoginForm from "../components/forms/LoginForm";
import FavoriteIcon from "@mui/icons-material/Favorite";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import ScienceIcon from "@mui/icons-material/Science";
import RestaurantIcon from "@mui/icons-material/Restaurant";

export default function LoginPage() {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh", background: "linear-gradient(135deg, #071d3c 0%, #0a2d57 60%, #103570 100%)" }}>

      {/* Sol panel */}
      <Box sx={{
        flex: 1,
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        color: "white",
        px: 6,
        gap: 3,
      }}>
        {/* Logo / başlık */}
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <Box sx={{
            width: 80, height: 80, borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.1)",
            border: "2px solid rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            mx: "auto", mb: 3,
          }}>
            <FavoriteIcon sx={{ fontSize: 40, color: "#64b5f6" }} />
          </Box>
          <Typography variant="h3" fontWeight={800} letterSpacing={2} sx={{ lineHeight: 1.1 }}>
            HEALTH
          </Typography>
          <Typography variant="h3" fontWeight={800} letterSpacing={2} sx={{ lineHeight: 1.1, color: "#64b5f6" }}>
            ASSISTANT
          </Typography>
          <Typography variant="body1" sx={{ mt: 2, color: "rgba(255,255,255,0.65)", fontSize: 15 }}>
            Sağlıklı yaşamın dijital asistanı
          </Typography>
        </Box>

        {/* Özellik listesi */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, width: "100%", maxWidth: 320 }}>
          {[
            { icon: <MonitorHeartIcon sx={{ fontSize: 20 }} />, text: "Tansiyon ve sağlık takibi" },
            { icon: <ScienceIcon sx={{ fontSize: 20 }} />,      text: "Tahlil raporu analizi" },
            { icon: <RestaurantIcon sx={{ fontSize: 20 }} />,   text: "Beslenme ve öğün analizi" },
            { icon: <FavoriteIcon sx={{ fontSize: 20 }} />,     text: "MR görüntü analizi (AI)" },
          ].map(({ icon, text }) => (
            <Box key={text} sx={{ display: "flex", alignItems: "center", gap: 1.5, color: "rgba(255,255,255,0.8)" }}>
              <Box sx={{ color: "#64b5f6", flexShrink: 0 }}>{icon}</Box>
              <Typography variant="body2">{text}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Dikey ayraç */}
      <Box sx={{
        display: { xs: "none", md: "block" },
        width: "1px",
        bgcolor: "rgba(255,255,255,0.1)",
        my: 8,
      }} />

      {/* Sağ panel — form */}
      <Box sx={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 3,
      }}>
        <Box sx={{
          bgcolor: "white",
          borderRadius: 4,
          p: 4,
          width: "100%",
          maxWidth: 380,
          boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
        }}>
          <LoginForm />
        </Box>
      </Box>
    </Box>
  );
}
