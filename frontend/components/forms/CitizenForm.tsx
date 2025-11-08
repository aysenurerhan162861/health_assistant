// src/components/forms/CitizenForm.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Avatar,
  Stack,
  Divider,
} from "@mui/material";
import { User, updateUser, getMe } from "../../services/api";

interface Props {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const CitizenForm: React.FC<Props> = ({ user, setUser }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    birthDate: "",
    gender: "female",
    city: "",
    district: "",
    neighborhood: "",
    bloodType: "",
    chronicDiseases: "",
    allergies: "",
    photoUrl: "",
  });

  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const primaryColor = "#0a2d57";
  const backgroundBlue = "#e6f0ff";
  const inputWhite = "#ffffff";

  // Kullanıcı bilgilerini form alanlarına yükle
  useEffect(() => {
    if (!user) return;
    setFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      birthDate: user.birth_date || "",
      gender: user.gender || "female",
      city: user.city || "",
      district: user.district || "",
      neighborhood: user.neighborhood || "",
      bloodType: user.blood_type || "",
      chronicDiseases: user.chronic_diseases || "",
      allergies: user.allergies || "",
      photoUrl: user.photoUrl || "",
    });
    setPreview(user.photoUrl || null);
  }, [user]);

  // Form değişiklikleri
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Fotoğraf değişimi
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setPreview(imageUrl);
      setFormData({ ...formData, photoUrl: imageUrl });
    }
  };

  // Güncelleme işlemi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Partial<User> = { ...formData };
      const res = await updateUser(payload);
      if (res.error) throw new Error(res.error);

      const updatedUser = await getMe();
      setUser(updatedUser);
      setPreview(updatedUser.photoUrl || "");
      setMessage("Bilgiler başarıyla güncellendi ✅");
    } catch (err) {
      console.error(err);
      setMessage("Güncelleme başarısız ❌");
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <Box
      sx={{
        p: 4,
        bgcolor: backgroundBlue,
        minHeight: "90vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        gap: 4,
      }}
    >
      {/* SOL TARAF: HASTA KARTI */}
      <Paper
        sx={{
          p: 4,
          borderRadius: 3,
          boxShadow: 3,
          width: 300,
          textAlign: "center",
        }}
      >
        <Avatar
          src={preview || ""}
          sx={{
            width: 120,
            height: 120,
            mx: "auto",
            mb: 2,
            border: `3px solid ${primaryColor}`,
          }}
        />
        <Typography variant="h6" sx={{ color: primaryColor, fontWeight: "bold" }}>
          {formData.name || "Hasta Adı"}
        </Typography>
        <Typography sx={{ color: "#444", mt: 1 }}>{formData.email}</Typography>
        <Divider sx={{ my: 2 }} />
      </Paper>

      {/* SAĞ TARAF: GÜNCELLEME FORMU */}
      <Paper
        sx={{
          p: 4,
          borderRadius: 3,
          boxShadow: 3,
          width: 500,
        }}
      >
        <Typography
          variant="h6"
          sx={{ color: primaryColor, fontWeight: "bold", mb: 3, textAlign: "center" }}
        >
          Kişisel Bilgileri Güncelle
        </Typography>

        <Stack alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Button variant="outlined" component="label" sx={{ color: primaryColor }}>
            Fotoğraf Değiştir
            <input hidden accept="image/*" type="file" onChange={handleImageChange} />
          </Button>
        </Stack>

        <Box component="form" onSubmit={handleSubmit}>
          {[
            { name: "name", label: "Ad Soyad" },
            { name: "email", label: "Email" },
            { name: "phone", label: "Telefon" },
            { name: "birthDate", label: "Doğum Tarihi", type: "date" },
            { name: "city", label: "İl" },
            { name: "district", label: "İlçe" },
            { name: "neighborhood", label: "Mahalle / Semt" },
            { name: "bloodType", label: "Kan Grubu" },
            { name: "chronicDiseases", label: "Kronik Hastalıklar" },
            { name: "allergies", label: "Alerjiler" },
          ].map((field) => (
            <TextField
              key={field.name}
              fullWidth
              margin="normal"
              name={field.name}
              label={field.label}
              type={field.type || "text"}
              value={(formData as any)[field.name]}
              onChange={handleChange}
              sx={{ mb: 2, bgcolor: inputWhite }}
              InputLabelProps={field.type === "date" ? { shrink: true } : {}}
            />
          ))}

          <Button
            type="submit"
            variant="contained"
            sx={{
              mt: 3,
              bgcolor: primaryColor,
              "&:hover": { bgcolor: "#082147" },
              width: "100%",
            }}
          >
            Güncelle
          </Button>

          {message && (
            <Typography
              sx={{
                mt: 2,
                color: primaryColor,
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              {message}
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default CitizenForm;
