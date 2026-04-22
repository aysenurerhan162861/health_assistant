import React, { useState, useEffect } from "react";
import {
  Box, TextField, Button, Card, CardContent,
  Typography, Avatar, Stack, Divider, Grid,
  Chip, Snackbar, Alert,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import BusinessIcon from "@mui/icons-material/Business";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import WorkIcon from "@mui/icons-material/Work";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { User, updateUser } from "../../services/api";

interface Props {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
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

const DoctorForm: React.FC<Props> = ({ user, setUser }) => {
  const [formData, setFormData] = useState({
    name: "", email: "", branch: "",
    experience: 0, institution: "", diplomaNo: "", about: "", photoUrl: "",
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false, message: "", severity: "success",
  });

  useEffect(() => {
    if (!user) return;
    setFormData({
      name:        user.name        || "",
      email:       user.email       || "",
      branch:      user.branch      || "",
      experience:  user.experience  ?? 0,
      institution: user.institution || "",
      diplomaNo:   user.diploma_no  || "",
      about:       user.about       || "",
      photoUrl:    user.photoUrl    || "",
    });
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFormData({ ...formData, photoUrl: URL.createObjectURL(file) });
  };

  const handleSave = async () => {
    try {
      const res = await updateUser({ id: user.id, ...formData });
      if (res.error) throw new Error(res.error);
      // API direkt user objesi döndürür, {user:...} sarmalı yok;
      // güvenli yol: mevcut user + formData birleştir
      const updatedUser: User = {
        ...user,
        name:        formData.name,
        email:       formData.email,
        branch:      formData.branch,
        experience:  Number(formData.experience),
        institution: formData.institution,
        diploma_no:  formData.diplomaNo,
        about:       formData.about,
        photoUrl:    formData.photoUrl,
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
              label="Doktor"
              size="small"
              sx={{ bgcolor: "#e3f0ff", color: "#1565c0", fontWeight: 600, fontSize: 12 }}
            />
          </Box>

          <Divider />
          <CardContent sx={{ px: 2.5, py: 1.5 }}>
            <InfoRow icon={<MedicalServicesIcon fontSize="small" />} label="Branş"       value={user.branch      || ""} />
            <InfoRow icon={<BusinessIcon fontSize="small" />}        label="Kurum"        value={user.institution || ""} />
            <InfoRow icon={<WorkIcon fontSize="small" />}            label="Deneyim"      value={user.experience ? `${user.experience} yıl` : ""} />
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
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Mesleki */}
            <Typography variant="subtitle1" fontWeight={600} color="#0a2d57" mb={2}>
              Mesleki Bilgiler
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Branş" name="branch"
                  value={formData.branch} onChange={handleChange}
                  slotProps={{ input: { startAdornment: <MedicalServicesIcon fontSize="small" sx={{ mr: 1, color: "#9aa5b4" }} /> } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Deneyim (yıl)" name="experience" type="number"
                  value={formData.experience} onChange={handleChange}
                  slotProps={{ input: { startAdornment: <WorkIcon fontSize="small" sx={{ mr: 1, color: "#9aa5b4" }} /> } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Çalıştığı Kurum" name="institution"
                  value={formData.institution} onChange={handleChange}
                  slotProps={{ input: { startAdornment: <BusinessIcon fontSize="small" sx={{ mr: 1, color: "#9aa5b4" }} /> } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Diploma No" name="diplomaNo"
                  value={formData.diplomaNo} onChange={handleChange}
                  slotProps={{ input: { startAdornment: <UploadFileIcon fontSize="small" sx={{ mr: 1, color: "#9aa5b4" }} /> } }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Hakkında" name="about"
                  value={formData.about} onChange={handleChange}
                  multiline minRows={3}
                />
              </Grid>
            </Grid>

            <Button
              variant="contained"
              fullWidth
              onClick={handleSave}
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

export default DoctorForm;
