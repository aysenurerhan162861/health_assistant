// components/users/UserForm.tsx
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
import { User, addTeamMember, updateTeamMember } from "../../services/api";

export interface UserFormProps {
  user?: User | null;
  onClose: () => void;
  onSuccess: () => void;
  onMessage?: (msg: string) => void;
  initialData?: {
    name: string;
    email: string;
    role: "assistant" | "sekreter";
  } | undefined;
}

const UserForm: React.FC<UserFormProps> = ({
  user,
  onClose,
  onSuccess,
  onMessage,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    role: initialData?.role || "assistant",
  });

  useEffect(() => {
    if (initialData) setFormData(initialData);
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (initialData) {
        // Düzenleme
        if (!user) return;
        await updateTeamMember(user.id, formData);
        onMessage?.("Kullanıcı başarıyla güncellendi ✅");
      } else {
        // Yeni kullanıcı ekleme
        await addTeamMember(formData);
        onMessage?.("Yeni kullanıcı eklendi ✅");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      onMessage?.(err.message || "İşlem başarısız ❌");
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
            <Button type="submit" variant="contained">
              {initialData ? "Güncelle" : "Ekle"}
            </Button>
            <Button variant="outlined" onClick={onClose}>
              İptal
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
};

export default UserForm;
