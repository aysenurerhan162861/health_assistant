import React, { useState } from "react";
import { useRouter } from "next/router";
import { Box, TextField, Button, Typography } from "@mui/material";
import { changePasswordFirstLogin } from "../../services/api";

export default function ChangePassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Şifreler uyuşmuyor!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("Token bulunamadı, lütfen tekrar giriş yapın.");
        return;
      }

      const res = await changePasswordFirstLogin(password, token);

      if (res.error) {
        setMessage(res.error);
      } else {
        setMessage("Şifre başarıyla değiştirildi!");
        setTimeout(() => router.push("/dashboard"), 1000);
      }
    } catch (err) {
      setMessage("Şifre değiştirilemedi!");
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 400, mx: "auto", mt: 10, textAlign: "center" }}>
      <Typography variant="h5" sx={{ mb: 3 }}>İlk Giriş: Şifre Değiştir</Typography>

      <TextField
        fullWidth
        margin="normal"
        type="password"
        label="Yeni Şifre"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <TextField
        fullWidth
        margin="normal"
        type="password"
        label="Yeni Şifre Tekrar"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />

      <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
        Şifreyi Güncelle
      </Button>

      {message && (
        <Typography sx={{ mt: 2, color: message.includes("başarılı") ? "green" : "red" }}>
          {message}
        </Typography>
      )}
    </Box>
  );
}
