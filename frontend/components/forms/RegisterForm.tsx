import React, { useState } from "react";
import { useRouter } from "next/router";
import { registerUser, ApiResponse } from "../../services/api";
import {
  TextField, Button, Typography, Link, Box,
  InputAdornment, CircularProgress, Collapse, Chip, Stack,
} from "@mui/material";
import PersonIcon          from "@mui/icons-material/Person";
import EmailIcon           from "@mui/icons-material/Email";
import LockIcon            from "@mui/icons-material/Lock";
import BadgeIcon           from "@mui/icons-material/Badge";
import LocalHospitalIcon   from "@mui/icons-material/LocalHospital";
import BusinessIcon        from "@mui/icons-material/Business";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import FavoriteIcon        from "@mui/icons-material/Favorite";
import VerifiedIcon        from "@mui/icons-material/Verified";

const FIELD_SX = { "& .MuiOutlinedInput-root": { borderRadius: 2 } };

export default function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "", email: "", password: "",
    role: "citizen",
    diplomaNumber: "", workplace: "", specialization: "",
  });
  const [message, setMessage]   = useState("");
  const [loading, setLoading]   = useState(false);
  const isDoctor = formData.role === "doctor";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((d) => ({ ...d, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const res: ApiResponse = await registerUser(formData);
      if ((res as any).detail) {
        setMessage((res as any).detail);
      } else if (res.message) {
        setMessage("Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...");
        setTimeout(() => router.push("/login"), 1500);
      } else {
        setMessage("Beklenmedik bir hata oluştu.");
      }
    } catch (err: any) {
      setMessage(err?.message || "Kayıt başarısız.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
      {/* Başlık */}
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Typography variant="h6" fontWeight={700} color="#0a2d57">Hesap Oluştur</Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Platforma katılmak için bilgilerinizi girin
        </Typography>
      </Box>

      {/* Rol seçimi — kart */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mb: 2.5 }}>
        {/* Hasta kartı */}
        <Box onClick={() => setFormData((d) => ({ ...d, role: "citizen" }))}
          sx={{
            border: "2px solid",
            borderColor: !isDoctor ? "#0a2d57" : "#e8edf5",
            borderRadius: 3, p: 2, cursor: "pointer",
            bgcolor: !isDoctor ? "#f0f6ff" : "#fafbff",
            transition: "all .2s",
            "&:hover": { borderColor: "#0a2d57", bgcolor: "#f0f6ff" },
            textAlign: "center",
          }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: "50%", mx: "auto", mb: 1,
            bgcolor: !isDoctor ? "#e3f0ff" : "#f0f4fa",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all .2s",
          }}>
            <FavoriteIcon sx={{ fontSize: 22, color: !isDoctor ? "#0a2d57" : "#9aa5b4" }} />
          </Box>
          <Typography variant="body2" fontWeight={700} color={!isDoctor ? "#0a2d57" : "#9aa5b4"}>
            Hasta
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Bireysel kullanım
          </Typography>
        </Box>

        {/* Doktor kartı */}
        <Box onClick={() => setFormData((d) => ({ ...d, role: "doctor" }))}
          sx={{
            border: "2px solid",
            borderColor: isDoctor ? "#0a2d57" : "#e8edf5",
            borderRadius: 3, p: 2, cursor: "pointer",
            bgcolor: isDoctor ? "#0a2d57" : "#fafbff",
            transition: "all .2s",
            "&:hover": { borderColor: "#0a2d57", bgcolor: isDoctor ? "#0a2d57" : "#f0f6ff" },
            textAlign: "center",
            position: "relative",
          }}>
          {/* Rozet */}
          <Chip
            icon={<VerifiedIcon sx={{ fontSize: "13px !important", color: isDoctor ? "#0a2d57 !important" : "#9aa5b4 !important" }} />}
            label="Profesyonel"
            size="small"
            sx={{
              position: "absolute", top: 8, right: 8,
              bgcolor: isDoctor ? "#64b5f6" : "#e8edf5",
              color: isDoctor ? "#071d3c" : "#9aa5b4",
              fontWeight: 700, fontSize: 9, height: 18,
            }}
          />
          <Box sx={{
            width: 44, height: 44, borderRadius: "50%", mx: "auto", mb: 1,
            bgcolor: isDoctor ? "rgba(255,255,255,0.15)" : "#f0f4fa",
            border: isDoctor ? "1.5px solid rgba(255,255,255,0.25)" : "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all .2s",
          }}>
            <LocalHospitalIcon sx={{ fontSize: 22, color: isDoctor ? "#64b5f6" : "#9aa5b4" }} />
          </Box>
          <Typography variant="body2" fontWeight={700} color={isDoctor ? "white" : "#9aa5b4"}>
            Doktor
          </Typography>
          <Typography variant="caption" sx={{ color: isDoctor ? "rgba(255,255,255,0.6)" : "text.secondary" }}>
            Klinik hesap
          </Typography>
        </Box>
      </Box>

      {/* Ortak alanlar */}
      <Stack spacing={1.5}>
        <TextField
          fullWidth size="small" name="name" label="Ad Soyad" required
          value={formData.name} onChange={handleChange} sx={FIELD_SX}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><PersonIcon sx={{ fontSize: 18, color: "#9aa5b4" }} /></InputAdornment> } }}
        />
        <TextField
          fullWidth size="small" name="email" type="email" label="E-posta" required
          value={formData.email} onChange={handleChange} sx={FIELD_SX}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><EmailIcon sx={{ fontSize: 18, color: "#9aa5b4" }} /></InputAdornment> } }}
        />
        <TextField
          fullWidth size="small" name="password" type="password" label="Şifre" required
          value={formData.password} onChange={handleChange} sx={FIELD_SX}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><LockIcon sx={{ fontSize: 18, color: "#9aa5b4" }} /></InputAdornment> } }}
        />
      </Stack>

      {/* Doktor ek alanları — animasyonlu açılır */}
      <Collapse in={isDoctor} unmountOnExit>
        <Box sx={{
          mt: 2, p: 2, borderRadius: 2,
          bgcolor: "#f8faff", border: "1px solid #e3f0ff",
        }}>
          <Stack direction="row" alignItems="center" spacing={0.75} mb={1.5}>
            <MedicalServicesIcon sx={{ fontSize: 15, color: "#0a2d57" }} />
            <Typography variant="caption" fontWeight={700} color="#0a2d57"
              sx={{ textTransform: "uppercase", letterSpacing: 0.6 }}>
              Mesleki Bilgiler
            </Typography>
          </Stack>
          <Stack spacing={1.5}>
            <TextField
              fullWidth size="small" name="diplomaNumber" label="Diploma Numarası" required={isDoctor}
              value={formData.diplomaNumber} onChange={handleChange} sx={FIELD_SX}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><BadgeIcon sx={{ fontSize: 18, color: "#9aa5b4" }} /></InputAdornment> } }}
            />
            <TextField
              fullWidth size="small" name="workplace" label="Hastane / Kurum" required={isDoctor}
              value={formData.workplace} onChange={handleChange} sx={FIELD_SX}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><BusinessIcon sx={{ fontSize: 18, color: "#9aa5b4" }} /></InputAdornment> } }}
            />
            <TextField
              fullWidth size="small" name="specialization" label="Uzmanlık Alanı"
              value={formData.specialization} onChange={handleChange} sx={FIELD_SX}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><LocalHospitalIcon sx={{ fontSize: 18, color: "#9aa5b4" }} /></InputAdornment> } }}
            />
          </Stack>
        </Box>
      </Collapse>

      {/* Kayıt butonu */}
      <Button
        type="submit" variant="contained" fullWidth disabled={loading}
        sx={{
          mt: 2.5, py: 1.3, borderRadius: 2, fontWeight: 700, fontSize: 15,
          bgcolor: isDoctor ? "#071d3c" : "#0a2d57",
          "&:hover": { bgcolor: "#071d3c" },
          textTransform: "none",
          transition: "background .2s",
        }}
      >
        {loading
          ? <CircularProgress size={22} sx={{ color: "white" }} />
          : isDoctor ? "Profesyonel Hesap Oluştur" : "Kayıt Ol"}
      </Button>

      {/* Mesaj */}
      {message && (
        <Typography variant="body2" sx={{
          mt: 1.5, textAlign: "center",
          color: message.includes("başarılı") ? "#2e7d32" : "#c62828",
        }}>
          {message}
        </Typography>
      )}

      <Typography variant="body2" sx={{ mt: 2.5, textAlign: "center", color: "#6b7a90" }}>
        Zaten hesabınız var mı?{" "}
        <Link href="/login" underline="hover" sx={{ color: "#0a2d57", fontWeight: 600 }}>
          Giriş Yap
        </Link>
      </Typography>
    </Box>
  );
}
