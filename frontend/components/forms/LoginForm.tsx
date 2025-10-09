// components/forms/LoginForm.tsx
import React, { useState } from "react";
import { useRouter } from "next/router";
import { loginUser, ApiResponse } from "../../services/api";
import {
  TextField,
  Button,
  Avatar,
  Typography,
  Link,
  Box,
  InputAdornment,
} from "@mui/material";
import { Email, Lock } from "@mui/icons-material";

export default function LoginForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    try {
      const res: ApiResponse = await loginUser(formData);
      if (res.error) {
        setMessage(res.error);
      } else if (res.token && res.user) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        setMessage("Giriş başarılı!");
        if (res.user.must_change_password) {
        router.push("/change-password"); // yeni şifre sayfasına yönlendir
      } else {
        setTimeout(() => router.push("/dashboard"), 500); // normal yönlendirme
      }
      }
    } catch (err) {
      setMessage("Giriş başarısız!");
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%", textAlign: "center" }}>
      {/* Avatar */}
      <Avatar sx={{ bgcolor: "#1976d2", mb: 2, width: 60, height: 60, margin: "0 auto" }} />

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
        Giriş
      </Button>

      {/* Geri bildirim */}
      {message && (
        <Typography variant="body2" sx={{ mt: 2, color: message.includes("başarılı") ? "green" : "red" }}>
          {message}
        </Typography>
      )}

      <Typography variant="body2" sx={{ mt: 2, color: "gray" }}>
        Hesabınız yok mu?{" "}
        <Link href="/register" underline="hover">
          Kayıt Ol
        </Link>
      </Typography>
    </Box>
  );
}
