import React, { useState, useEffect } from "react";
import {
  Box, TextField, Button, Card, CardContent,
  Typography, Avatar, Stack, Divider, Grid,
  Chip, Snackbar, Alert,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import FavoriteIcon from "@mui/icons-material/Favorite";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import { User, updateUser } from "../../services/api";

interface Props {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

// ─── Profil kartındaki bilgi satırı ──────────────────────────────────────────
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, py: 0.9 }}>
      <Box sx={{ color: "#1976d2", display: "flex", mt: 0.2, flexShrink: 0 }}>{icon}</Box>
      <Box>
        <Typography variant="caption" color="text.secondary" display="block" lineHeight={1.2}>
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={500} color="#0a2d57">
          {value || "—"}
        </Typography>
      </Box>
    </Box>
  );
}

const CitizenForm: React.FC<Props> = ({ user, setUser }) => {
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", birthDate: "",
    gender: "", city: "", district: "", neighborhood: "",
    bloodType: "", chronicDiseases: "", allergies: "", photoUrl: "",
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false, message: "", severity: "success",
  });

  // Kaydedilmiş veriyi forma yükle
  useEffect(() => {
    if (!user) return;
    setFormData({
      name:             user.name             || "",
      email:            user.email            || "",
      phone:            user.phone            || "",
      birthDate:        user.birth_date       || "",
      gender:           user.gender           || "",
      city:             user.city             || "",
      district:         user.district         || "",
      neighborhood:     user.neighborhood     || "",
      bloodType:        user.blood_type       || "",
      chronicDiseases:  user.chronic_diseases || "",
      allergies:        user.allergies        || "",
      photoUrl:         user.photoUrl         || "",
    });
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFormData({ ...formData, photoUrl: URL.createObjectURL(file) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await updateUser({ ...formData });
      if (res.error) throw new Error(res.error);
      // getMe() sadece {id,name,email,role} döndürür; eksik alan sıfırlanmasın diye
      // mevcut user ile formData'yı birleştiriyoruz
      const updatedUser: User = {
        ...user,
        name:             formData.name,
        email:            formData.email,
        phone:            formData.phone,
        birth_date:       formData.birthDate,
        gender:           formData.gender,
        city:             formData.city,
        district:         formData.district,
        neighborhood:     formData.neighborhood,
        blood_type:       formData.bloodType,
        chronic_diseases: formData.chronicDiseases,
        allergies:        formData.allergies,
        photoUrl:         formData.photoUrl,
      };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setSnackbar({ open: true, message: "Bilgiler başarıyla güncellendi.", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Güncelleme başarısız oldu.", severity: "error" });
    }
  };

  return (
    <Box>
      {/* Sayfa başlığı */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} color="#0a2d57">Kişisel Bilgiler</Typography>
        <Typography variant="body2" color="text.secondary">
          Bilgilerinizi görüntüleyip güncelleyebilirsiniz.
        </Typography>
      </Box>

      <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems="flex-start">

        {/* ── Sol: Profil Kartı (kaydedilmiş veri gösterilir) ────────────── */}
        <Card
          elevation={0}
          sx={{ width: { xs: "100%", md: 270 }, flexShrink: 0, border: "1px solid #e8edf5", borderRadius: 3 }}
        >
          <Box sx={{ textAlign: "center", px: 3, pt: 4, pb: 2 }}>
            <Avatar
              src={user.photoUrl || ""}
              sx={{ width: 90, height: 90, mx: "auto", mb: 1.5, border: "3px solid #1976d2" }}
            />
            <Typography variant="h6" fontWeight={700} color="#0a2d57" noWrap>
              {user.name || "Ad Soyad"}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 1 }}>
              {user.email}
            </Typography>
            <Chip
              label="Hasta"
              size="small"
              sx={{ bgcolor: "#e8f5e9", color: "#2e7d32", fontWeight: 600, fontSize: 12 }}
            />
          </Box>

          <Divider />
          <CardContent sx={{ px: 2.5, py: 1.5 }}>
            <InfoRow icon={<FavoriteIcon fontSize="small" />}     label="Kan Grubu"    value={user.blood_type  || ""} />
            <InfoRow icon={<LocationOnIcon fontSize="small" />}   label="Şehir"        value={user.city        || ""} />
            <InfoRow icon={<CalendarTodayIcon fontSize="small" />} label="Doğum Tarihi" value={user.birth_date  || ""} />
            <InfoRow icon={<PhoneIcon fontSize="small" />}        label="Telefon"      value={user.phone       || ""} />
          </CardContent>

          <Divider />
          <Box sx={{ p: 2 }}>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              size="small"
              startIcon={<PhotoCameraIcon />}
              sx={{ borderColor: "#1976d2", color: "#1976d2" }}
            >
              Fotoğraf Değiştir
              <input hidden accept="image/*" type="file" onChange={handleImageChange} />
            </Button>
          </Box>
        </Card>

        {/* ── Sağ: Güncelleme Formu ──────────────────────────────────────── */}
        <Card
          elevation={0}
          component="form"
          onSubmit={handleSubmit}
          sx={{ flex: 1, border: "1px solid #e8edf5", borderRadius: 3 }}
        >
          <CardContent sx={{ p: 3 }}>

            {/* Temel Bilgiler */}
            <Typography variant="subtitle1" fontWeight={600} color="#0a2d57" mb={2}>
              Temel Bilgiler
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Ad Soyad" name="name"
                  value={formData.name} onChange={handleChange}
                  slotProps={{ input: { startAdornment: <PersonIcon fontSize="small" sx={{ mr: 1, color: "#9aa5b4" }} /> } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="E-posta" name="email"
                  value={formData.email} onChange={handleChange}
                  slotProps={{ input: { startAdornment: <EmailIcon fontSize="small" sx={{ mr: 1, color: "#9aa5b4" }} /> } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Telefon" name="phone"
                  value={formData.phone} onChange={handleChange}
                  slotProps={{ input: { startAdornment: <PhoneIcon fontSize="small" sx={{ mr: 1, color: "#9aa5b4" }} /> } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Doğum Tarihi" name="birthDate" type="date"
                  value={formData.birthDate} onChange={handleChange}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Cinsiyet" name="gender"
                  value={formData.gender} onChange={handleChange}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Adres */}
            <Typography variant="subtitle1" fontWeight={600} color="#0a2d57" mb={2}>
              Adres Bilgileri
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth label="İl" name="city"
                  value={formData.city} onChange={handleChange}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth label="İlçe" name="district"
                  value={formData.district} onChange={handleChange}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth label="Mahalle / Semt" name="neighborhood"
                  value={formData.neighborhood} onChange={handleChange}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Sağlık */}
            <Typography variant="subtitle1" fontWeight={600} color="#0a2d57" mb={2}>
              Sağlık Bilgileri
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth label="Kan Grubu" name="bloodType"
                  value={formData.bloodType} onChange={handleChange}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth label="Kronik Hastalıklar" name="chronicDiseases"
                  value={formData.chronicDiseases} onChange={handleChange}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth label="Alerjiler" name="allergies"
                  value={formData.allergies} onChange={handleChange}
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{ mt: 4, py: 1.3, bgcolor: "#0a2d57", borderRadius: 2, fontWeight: 600,
                "&:hover": { bgcolor: "#071d3c" } }}
            >
              Bilgileri Güncelle
            </Button>
          </CardContent>
        </Card>
      </Stack>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CitizenForm;
