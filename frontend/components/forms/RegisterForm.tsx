// components/forms/RegisterForm.tsx
import React, { useState } from "react";
import { useRouter } from "next/router";
import { registerUser, ApiResponse } from "../../services/api";
import {
  TextField,
  Button,
  Avatar,
  Typography,
  Link,
  Box,
  MenuItem,
  InputAdornment,
} from "@mui/material";
import { Person, Email, Lock, Work, Badge } from "@mui/icons-material";

export default function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "citizen",
    diplomaNumber: "",
    workplace: "",
    specialization: "",
    profileImage: "",
  });
  const [message, setMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    try {
      const res: ApiResponse = await registerUser(formData);
      if ((res as any).detail) {
        setMessage((res as any).detail);
      } else if (res.message) {
        setMessage(res.message + " Giriş sayfasına yönlendiriliyorsunuz...");
        setTimeout(() => router.push("/login"), 1500);
      } else {
        setMessage("Beklenmedik bir hata oluştu.");
      }
    } catch (err: any) {
      setMessage(err?.message || "Kayıt başarısız!");
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ width: "100%", maxWidth: 400, margin: "0 auto", textAlign: "center" }}
    >
      {/* Avatar */}
      <Avatar sx={{ bgcolor: "#1976d2", mb: 2, width: 60, height: 60, margin: "0 auto" }} />

      <TextField
        fullWidth
        margin="normal"
        name="name"
        placeholder="Adınız"
        value={formData.name}
        onChange={handleChange}
        required
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Person sx={{ color: "gray" }} />
            </InputAdornment>
          ),
        }}
      />

      <TextField
        fullWidth
        margin="normal"
        name="email"
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
        required
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Email sx={{ color: "gray" }} />
            </InputAdornment>
          ),
        }}
      />

      <TextField
        fullWidth
        margin="normal"
        name="password"
        type="password"
        placeholder="Şifre"
        value={formData.password}
        onChange={handleChange}
        required
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Lock sx={{ color: "gray" }} />
            </InputAdornment>
          ),
        }}
      />

      {/* Kullanıcı tipi seçimi */}
      <TextField
        select
        fullWidth
        margin="normal"
        name="role"
        value={formData.role}
        onChange={handleChange}
        required
        label="Kullanıcı Tipi"
      >
        <MenuItem value="citizen">Vatandaş</MenuItem>
        <MenuItem value="doctor">Doktor / Klinisyen</MenuItem>
      </TextField>

      {/* Doktor seçilirse ek alanlar */}
      {formData.role === "doctor" && (
        <>
          <TextField
            fullWidth
            margin="normal"
            name="diplomaNumber"
            placeholder="Diploma Numarası"
            value={formData.diplomaNumber}
            onChange={handleChange}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Badge sx={{ color: "gray" }} />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            margin="normal"
            name="workplace"
            placeholder="Çalıştığınız Hastane/Kurum"
            value={formData.workplace}
            onChange={handleChange}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Work sx={{ color: "gray" }} />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            margin="normal"
            name="specialization"
            placeholder="Uzmanlık Alanınız"
            value={formData.specialization}
            onChange={handleChange}
          />
        </>
      )}

      <Button
        type="submit"
        variant="contained"
        fullWidth
        sx={{
          mt: 2,
          bgcolor: "#1976d2",
          borderRadius: "12px",
          py: 1.2,
          fontWeight: "bold",
        }}
      >
        Kayıt Ol
      </Button>

      {/* Geri bildirim */}
      {message && (
        <Typography
          variant="body2"
          sx={{ mt: 2, color: message.includes("başarısız") ? "red" : "green" }}
        >
          {message}
        </Typography>
      )}

      <Typography variant="body2" sx={{ mt: 2, color: "gray" }}>
        Zaten hesabınız var mı?{" "}
        <Link href="/login" underline="hover">
          Giriş Yap
        </Link>
      </Typography>
    </Box>
  );
}
