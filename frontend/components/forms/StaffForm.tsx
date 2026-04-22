import React, { useState, useEffect } from "react";
import {
  Box, TextField, Button, Card, CardContent,
  Typography, Avatar, Stack, Divider, Grid,
  Chip, Snackbar, Alert,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import FavoriteIcon from "@mui/icons-material/Favorite";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import { User } from "../../services/api";
import { uploadStaffFile, updateMyProfile, updateStaffProfile } from "../../services/StaffApi";

interface Props {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isSubUser?: boolean;
}

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

const StaffForm: React.FC<Props> = ({ user, setUser, isSubUser = false }) => {
  const [form, setForm] = useState<User>(user);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(user.photoUrl ?? null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false, message: "", severity: "success",
  });

  useEffect(() => {
    if (user) { setForm(user); setPreview(user.photoUrl ?? null); }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) { setFile(selected); setPreview(URL.createObjectURL(selected)); }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      // API'nin döndürdüğü yanıt eksik alan içerebilir;
      // mevcut user + form birleştirerek tüm alanları koruyoruz
      if (isSubUser) {
        await updateMyProfile(form);
      } else {
        await updateStaffProfile(user.id, form);
      }

      let merged: User = { ...user, ...form };

      if (file) {
        const photoResponse = await uploadStaffFile(user.id, file);
        merged = { ...merged, photoUrl: photoResponse.url };
        setPreview(photoResponse.url);
      }

      setUser(merged);
      setForm(merged);
      localStorage.setItem("user", JSON.stringify(merged));
      setSnackbar({ open: true, message: "Bilgiler başarıyla güncellendi.", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Güncelleme başarısız oldu.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} color="#0a2d57">Kişisel Bilgiler</Typography>
        <Typography variant="body2" color="text.secondary">
          Bilgilerinizi görüntüleyip güncelleyebilirsiniz.
        </Typography>
      </Box>

      <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems="flex-start">

        {/* ── Sol: Profil Kartı ─────────────────────────────────────────── */}
        <Card
          elevation={0}
          sx={{ width: { xs: "100%", md: 270 }, flexShrink: 0, border: "1px solid #e8edf5", borderRadius: 3 }}
        >
          <Box sx={{ textAlign: "center", px: 3, pt: 4, pb: 2 }}>
            <Avatar
              src={preview || user.photoUrl || ""}
              sx={{ width: 90, height: 90, mx: "auto", mb: 1.5, border: "3px solid #1976d2" }}
            />
            <Typography variant="h6" fontWeight={700} color="#0a2d57" noWrap>
              {user.name || "Ad Soyad"}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 1 }}>
              {user.email}
            </Typography>
            <Chip
              label="Asistan"
              size="small"
              sx={{ bgcolor: "#f3e5f5", color: "#6a1b9a", fontWeight: 600, fontSize: 12 }}
            />
          </Box>

          <Divider />
          <CardContent sx={{ px: 2.5, py: 1.5 }}>
            <InfoRow icon={<FavoriteIcon fontSize="small" />}      label="Kan Grubu"    value={user.blood_type  || ""} />
            <InfoRow icon={<LocationOnIcon fontSize="small" />}    label="Şehir"        value={user.city        || ""} />
            <InfoRow icon={<CalendarTodayIcon fontSize="small" />} label="Doğum Tarihi" value={user.birth_date  || ""} />
            <InfoRow icon={<PhoneIcon fontSize="small" />}         label="Telefon"      value={user.phone       || ""} />
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
              <input hidden accept="image/*" type="file" onChange={handleFileChange} />
            </Button>
          </Box>
        </Card>

        {/* ── Sağ: Güncelleme Formu ──────────────────────────────────────── */}
        <Card
          elevation={0}
          sx={{ flex: 1, border: "1px solid #e8edf5", borderRadius: 3 }}
        >
          <CardContent sx={{ p: 3 }}>

            {/* Kişisel */}
            <Typography variant="subtitle1" fontWeight={600} color="#0a2d57" mb={2}>
              Kişisel Bilgiler
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Ad Soyad" name="name"
                  value={form.name || ""} onChange={handleChange}
                  slotProps={{ input: { startAdornment: <PersonIcon fontSize="small" sx={{ mr: 1, color: "#9aa5b4" }} /> } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Telefon" name="phone"
                  value={form.phone || ""} onChange={handleChange}
                  slotProps={{ input: { startAdornment: <PhoneIcon fontSize="small" sx={{ mr: 1, color: "#9aa5b4" }} /> } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Doğum Tarihi" name="birth_date" type="date"
                  value={form.birth_date || ""} onChange={handleChange}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Cinsiyet" name="gender"
                  value={form.gender || ""} onChange={handleChange}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Kan Grubu" name="blood_type"
                  value={form.blood_type || ""} onChange={handleChange}
                  slotProps={{ input: { startAdornment: <FavoriteIcon fontSize="small" sx={{ mr: 1, color: "#9aa5b4" }} /> } }}
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
                  value={form.city || ""} onChange={handleChange}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth label="İlçe" name="district"
                  value={form.district || ""} onChange={handleChange}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth label="Mahalle / Semt" name="neighborhood"
                  value={form.neighborhood || ""} onChange={handleChange}
                />
              </Grid>
            </Grid>

            <Button
              variant="contained"
              fullWidth
              onClick={handleSave}
              disabled={loading}
              sx={{ mt: 4, py: 1.3, bgcolor: "#0a2d57", borderRadius: 2, fontWeight: 600,
                "&:hover": { bgcolor: "#071d3c" } }}
            >
              {loading ? "Kaydediliyor..." : "Bilgileri Güncelle"}
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

export default StaffForm;
