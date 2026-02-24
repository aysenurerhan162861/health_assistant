
"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  MenuItem,
  Stack,
  Paper,
  Typography,
} from "@mui/material";
import {
  User,
  addTeamMember,
  updateTeamMember,
  resendStaffMail,
} from "../../services/api";

export interface UserFormProps {
  user?: User | null;
  onClose: () => void;
  onSuccess: () => void;
  onMessage?: (msg: string) => void;
  initialData?: {
    name: string;
    email: string;
    role: "assistant" | "sekreter";
  };
}

const UserForm: React.FC<UserFormProps> = ({
  user,
  onClose,
  onSuccess,
  onMessage,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "assistant" as "assistant" | "sekreter",
  });

  const [mailLoading, setMailLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (initialData && user) {
        await updateTeamMember(user.id, formData);
        onMessage?.("Kullanıcı güncellendi ✅");
      } else {
        await addTeamMember(formData);
        onMessage?.("Yeni kullanıcı eklendi ✅");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      onMessage?.(err.message || "İşlem başarısız ❌");
    }
  };

  const handleResendMail = async () => {
    console.log("MAIL TIKLANDI - USER:", user);
    if (!user || !user.id) {
    onMessage?.("User bilgisi yok ❌");
    return;
  }

    try {
      setMailLoading(true);
      await resendStaffMail(user.id);
      onMessage?.("Giriş maili tekrar gönderildi 📧");
    } catch (err: any) {
      onMessage?.(err.message || "Mail gönderilemedi ❌");
    } finally {
      setMailLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {initialData ? "Kullanıcı Düzenle" : "Yeni Kullanıcı Ekle"}
      </Typography>

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <TextField
            label="Ad Soyad"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <TextField
            label="E-posta"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <TextField
            label="Rol"
            name="role"
            select
            value={formData.role}
            onChange={handleChange}
          >
            <MenuItem value="assistant">Asistan</MenuItem>
            <MenuItem value="sekreter">Sekreter</MenuItem>
          </TextField>

          <Stack direction="row" spacing={2}>
            {/* ✅ SUBMIT */}
            <Button type="submit" variant="contained">
              {initialData ? "Güncelle" : "Ekle"}
            </Button>

            {/* ✅ SUBMIT DEĞİL */}
            {initialData && user && (
              <Button
                type="button"
                variant="outlined"
                onClick={handleResendMail}
                disabled={mailLoading}
              >
                {mailLoading ? "Gönderiliyor..." : "Mail Gönder"}
              </Button>
            )}

            {/* ✅ İPTAL MUTLAKA BUTTON */}
            <Button
              type="button"
              variant="outlined"
              color="inherit"
              onClick={onClose}
            >
              İptal
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
};

export default UserForm;