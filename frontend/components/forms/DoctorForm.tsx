// components/forms/DoctorForm.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Alert,
  TextField,
  Button,
  Divider,
  Stack,
  Snackbar,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { User, updateUser } from "../../services/api";

interface Props {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const DoctorForm: React.FC<Props> = ({ user, setUser }) => {
  const [doctor, setDoctor] = useState({
    name: "",
    email: "",
    branch: "",
    experience: 0,
    institution: "",
    diplomaNo: "",
    about: "",
    photoUrl: "",
  });

  const [message, setMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const primaryColor = "#0a2d57";
  const lightBg = "#f8faff";

  useEffect(() => {
    if (!user) return;

    setDoctor({
      name: user.name || "",
      email: user.email || "",
      branch: user.branch || "",
      experience: user.experience ?? 0,
      institution: user.institution || "",
      diplomaNo: user.diploma_no || "",
      about: user.about || "",
      photoUrl: user.photoUrl || "",
    });
  }, [user]);

  const handleChange = (field: string, value: any) =>
    setDoctor((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    try {
      if (!user.id) return;
      const res = await updateUser({ id: user.id, ...doctor });
      if (res.user) setUser(res.user);
      setMessage("Bilgiler başarıyla güncellendi! ✅");
      setSnackbarOpen(true);
    } catch {
      setMessage("Bilgiler güncellenirken bir hata oluştu ❌");
      setSnackbarOpen(true);
    }
  };

  return (
    <Box
      sx={{
        bgcolor: lightBg,
        minHeight: "100vh",
        pt: { xs: 4, md: 10 }, // ✅ navbar’a göre yukarıdan boşluk
        pb: 6,
        px: { xs: 2, md: 6 },
      }}
    >
      {/* Sayfa Başlığı */}
      <Typography
        variant="h5"
        sx={{
          color: primaryColor,
          fontWeight: "bold",
          mb: 4,
          ml: 1,
        }}
      >
        Kişisel Bilgiler
      </Typography>

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={4}
        alignItems="flex-start"
      >
        {/* Sol: Doktor Kartı */}
        <Paper
          elevation={4}
          sx={{
            p: 4,
            borderRadius: 4,
            flex: { xs: "1 1 100%", md: "0 0 30%" },
            textAlign: "center",
            bgcolor: "#fff",
          }}
        >
          <Avatar
            src={doctor.photoUrl}
            sx={{
              width: 130,
              height: 130,
              mx: "auto",
              mb: 2,
              border: `3px solid ${primaryColor}`,
            }}
          />
          <Typography
            variant="h6"
            sx={{ color: primaryColor, fontWeight: 700 }}
          >
            {doctor.name || "Ad Soyad"}
          </Typography>
          <Typography
            variant="body2"
            color="textSecondary"
            sx={{ mb: 2, fontStyle: "italic" }}
          >
            {doctor.branch || "Branş bilgisi yok"}
          </Typography>
          <Button
            variant="contained"
            fullWidth
            startIcon={<UploadFileIcon />}
            sx={{
              bgcolor: primaryColor,
              color: "#fff",
              fontWeight: "bold",
              "&:hover": { bgcolor: "#071d3c" },
            }}
          >
            Fotoğraf Yükle
          </Button>
          <Divider sx={{ my: 3 }} />
          <Typography
            variant="subtitle2"
            sx={{ color: primaryColor, fontWeight: 600 }}
          >
            {doctor.institution || "Kurumu Belirtilmemiş"}
          </Typography>
        </Paper>

        {/* Sağ: Güncelleme Formu */}
        <Box sx={{ flex: { xs: "1", md: "0 0 70%" } }}>
          <Paper sx={{ p: 4, borderRadius: 4 }} elevation={4}>
            <Typography
              variant="h6"
              sx={{
                color: primaryColor,
                fontWeight: "bold",
                mb: 3,
              }}
            >
              Bilgileri Güncelle
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Ad Soyad"
                value={doctor.name}
                onChange={(e) => handleChange("name", e.target.value)}
                fullWidth
              />
              <TextField
                label="E-posta"
                value={doctor.email}
                onChange={(e) => handleChange("email", e.target.value)}
                fullWidth
              />
              <TextField
                label="Branş"
                value={doctor.branch}
                onChange={(e) => handleChange("branch", e.target.value)}
                fullWidth
              />
              <TextField
                label="Deneyim (yıl)"
                type="number"
                value={doctor.experience}
                onChange={(e) =>
                  handleChange("experience", Number(e.target.value))
                }
                fullWidth
              />
              <TextField
                label="Çalıştığı Kurum"
                value={doctor.institution}
                onChange={(e) => handleChange("institution", e.target.value)}
                fullWidth
              />
              <TextField
                label="Diploma No"
                value={doctor.diplomaNo}
                onChange={(e) => handleChange("diplomaNo", e.target.value)}
                fullWidth
              />
              <TextField
                label="Hakkında"
                value={doctor.about}
                onChange={(e) => handleChange("about", e.target.value)}
                multiline
                minRows={3}
                fullWidth
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                sx={{ fontWeight: "bold" }}
              >
                Kaydet
              </Button>
            </Stack>
          </Paper>
        </Box>
      </Stack>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert severity="info" sx={{ width: "100%" }}>
          {message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DoctorForm;
