import { Box, Typography } from "@mui/material";
import RegisterForm from "../components/forms/RegisterForm";
import FavoriteIcon       from "@mui/icons-material/Favorite";
import VerifiedUserIcon   from "@mui/icons-material/VerifiedUser";
import GroupsIcon         from "@mui/icons-material/Groups";
import SecurityIcon       from "@mui/icons-material/Security";

export default function RegisterPage() {
  return (
    <Box sx={{
      display: "flex", minHeight: "100vh",
      background: "linear-gradient(135deg, #071d3c 0%, #0a2d57 60%, #103570 100%)",
    }}>
      {/* Sol panel */}
      <Box sx={{
        flex: "0 0 42%",
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        color: "white",
        px: 6,
        gap: 4,
      }}>
        {/* Logo */}
        <Box sx={{ textAlign: "center" }}>
          <Box sx={{
            width: 76, height: 76, borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.08)",
            border: "2px solid rgba(255,255,255,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
            mx: "auto", mb: 3,
          }}>
            <FavoriteIcon sx={{ fontSize: 38, color: "#64b5f6" }} />
          </Box>
          <Typography variant="h3" fontWeight={800} letterSpacing={2} lineHeight={1.1}>
            HEALTH
          </Typography>
          <Typography variant="h3" fontWeight={800} letterSpacing={2} lineHeight={1.1} color="#64b5f6">
            ASSISTANT
          </Typography>
          <Typography variant="body1" sx={{ mt: 2, color: "rgba(255,255,255,0.6)", fontSize: 15 }}>
            Platforma katılın, sağlığınızı yönetin
          </Typography>
        </Box>

        {/* Neden kayıt olmalı */}
        <Box sx={{ width: "100%", maxWidth: 300 }}>
          {[
            { icon: <VerifiedUserIcon fontSize="small" />, title: "Güvenli & Sertifikalı",   desc: "Verileriniz şifreli ve korumalı" },
            { icon: <GroupsIcon fontSize="small" />,       title: "Uzman Doktor Ağı",         desc: "Alanında uzman doktorlara erişin" },
            { icon: <SecurityIcon fontSize="small" />,     title: "Profesyonel Hesaplar",     desc: "Doktorlar için özel doğrulama" },
          ].map(({ icon, title, desc }) => (
            <Box key={title} sx={{
              display: "flex", alignItems: "flex-start", gap: 1.5, mb: 2.5,
            }}>
              <Box sx={{
                width: 36, height: 36, borderRadius: 2, flexShrink: 0,
                bgcolor: "rgba(100,181,246,0.15)",
                border: "1px solid rgba(100,181,246,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#64b5f6",
              }}>
                {icon}
              </Box>
              <Box>
                <Typography variant="body2" fontWeight={700} sx={{ color: "rgba(255,255,255,0.9)" }}>
                  {title}
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
                  {desc}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Dikey ayraç */}
      <Box sx={{
        display: { xs: "none", md: "block" },
        width: "1px", bgcolor: "rgba(255,255,255,0.08)", my: 8,
      }} />

      {/* Sağ panel — form */}
      <Box sx={{
        flex: 1,
        display: "flex", alignItems: "center", justifyContent: "center",
        px: 3, py: 4,
        overflowY: "auto",
      }}>
        <Box sx={{
          bgcolor: "white", borderRadius: 4, p: 4,
          width: "100%", maxWidth: 440,
          boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
        }}>
          <RegisterForm />
        </Box>
      </Box>
    </Box>
  );
}
