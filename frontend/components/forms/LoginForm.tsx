import React, { useState } from "react";
import { useRouter } from "next/router";
import { loginUser, ApiResponse } from "../../services/api";
import {
  TextField, Button, Typography, Link, Box, InputAdornment, CircularProgress,
} from "@mui/material";
import EmailIcon  from "@mui/icons-material/Email";
import LockIcon   from "@mui/icons-material/Lock";
import FavoriteIcon from "@mui/icons-material/Favorite";

export default function LoginForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage]   = useState("");
  const [loading, setLoading]   = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const res: ApiResponse = await loginUser(formData);
      if (res.error) {
        setMessage(res.error);
      } else if (res.token && res.user) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        if (res.user.must_change_password) {
          router.push("/change-password");
        } else {
          setTimeout(() => router.push("/dashboard"), 400);
        }
      }
    } catch {
      setMessage("Giriş başarısız. Lütfen bilgilerinizi kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
      {/* Başlık */}
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Box sx={{
          width: 56, height: 56, borderRadius: "50%",
          bgcolor: "#e3f0ff", display: "flex",
          alignItems: "center", justifyContent: "center",
          mx: "auto", mb: 2,
        }}>
          <FavoriteIcon sx={{ color: "#0a2d57", fontSize: 28 }} />
        </Box>
        <Typography variant="h6" fontWeight={700} color="#0a2d57">Hoş Geldiniz</Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Hesabınıza giriş yapın
        </Typography>
      </Box>

      <TextField
        fullWidth size="small" margin="normal"
        name="email" type="email" label="E-posta"
        value={formData.email} onChange={handleChange} required
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon sx={{ color: "#9aa5b4", fontSize: 18 }} />
              </InputAdornment>
            ),
          },
        }}
      />

      <TextField
        fullWidth size="small" margin="normal"
        name="password" type="password" label="Şifre"
        value={formData.password} onChange={handleChange} required
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon sx={{ color: "#9aa5b4", fontSize: 18 }} />
              </InputAdornment>
            ),
          },
        }}
      />

      <Button
        type="submit" variant="contained" fullWidth disabled={loading}
        sx={{
          mt: 2.5, py: 1.3, borderRadius: 2, fontWeight: 700, fontSize: 15,
          bgcolor: "#0a2d57", "&:hover": { bgcolor: "#071d3c" },
          textTransform: "none",
        }}
      >
        {loading ? <CircularProgress size={22} sx={{ color: "white" }} /> : "Giriş Yap"}
      </Button>

      {message && (
        <Typography variant="body2" sx={{
          mt: 1.5, textAlign: "center",
          color: message.includes("başarılı") ? "#2e7d32" : "#c62828",
        }}>
          {message}
        </Typography>
      )}

      <Typography variant="body2" sx={{ mt: 2.5, textAlign: "center", color: "#6b7a90" }}>
        Hesabınız yok mu?{" "}
        <Link href="/register" underline="hover" sx={{ color: "#0a2d57", fontWeight: 600 }}>
          Kayıt Ol
        </Link>
      </Typography>
    </Box>
  );
}
