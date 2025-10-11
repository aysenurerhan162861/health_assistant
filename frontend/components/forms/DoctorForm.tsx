import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Avatar,
  TextField,
  Button,
  IconButton,
  Chip,
  MenuItem,
  Snackbar,
  Alert,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { User, addTeamMember, updateUser } from "../../services/api";

interface Props {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

interface TeamData {
  name: string;
  email: string;
  role: "assistant" | "sekreter";
}

const DoctorForm: React.FC<Props> = ({ user, setUser }) => {
  const [doctor, setDoctor] = useState({
    name: user.name || "",
    email: user.email || "",
    branch: "Nöroloji",
    experience: 5,
    institution: "Karadeniz Hastanesi",
    diplomaNo: "123456789",
    certifications: ["Beyin Cerrahisi"],
    about: "10 yıllık deneyimli nöroloji uzmanı",
    photoUrl: "",
  });

  const [teamData, setTeamData] = useState<TeamData>({
    name: "",
    email: "",
    role: "assistant",
  });

  const [message, setMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    setDoctor((prev) => ({
      ...prev,
      name: user.name || "",
      email: user.email || "",
    }));
  }, [user]);

  const handleChange = (field: string, value: any) => {
    setDoctor((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      if (!user.id) return;
      const res = await updateUser({ id: user.id, ...doctor });
      setMessage("Bilgiler güncellendi!");
      setSnackbarOpen(true);
      if (res.user) setUser(res.user);
    } catch {
      setMessage("Güncelleme başarısız!");
      setSnackbarOpen(true);
    }
  };

  const handleTeamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTeamData({ ...teamData, [name]: value });
  };

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addTeamMember({
        name: teamData.name,
        email: teamData.email,
        role: teamData.role,
      });
      setMessage("Alt kullanıcı eklendi ve mail gönderildi! ✅");
      setTeamData({ name: "", email: "", role: "assistant" });
      setSnackbarOpen(true);
    } catch {
      setMessage("Alt kullanıcı ekleme başarısız! ❌");
      setSnackbarOpen(true);
    }
  };

  const primaryColor = "#0a2d57";
  const lightBlue = "#d6e4ff";

  return (
    <Box sx={{ p: 3, bgcolor: "#f0f4ff", minHeight: "100vh" }}>
      {/* Flex container: Sol + Sağ */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 4,
        }}
      >
        {/* Sol kolon */}
        <Box
          sx={{
            flex: { xs: "1 1 100%", md: "0 0 30%" },
            textAlign: "center",
          }}
        >
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              boxShadow: 3,
              bgcolor: lightBlue,
            }}
          >
            <Avatar
              src={doctor.photoUrl}
              sx={{ width: 120, height: 120, mb: 2, mx: "auto", border: `2px solid ${primaryColor}` }}
            />
            <Typography variant="h6" sx={{ color: primaryColor, fontWeight: "bold" }}>
              {doctor.name}
            </Typography>
            <Typography variant="subtitle2" color={primaryColor} mb={2}>
              {doctor.branch}
            </Typography>
            <Button
              variant="contained"
              startIcon={<UploadFileIcon />}
              sx={{
                bgcolor: primaryColor,
                "&:hover": { bgcolor: "#082147" },
                color: "white",
              }}
            >
              Fotoğraf Yükle
            </Button>
          </Paper>
        </Box>

        {/* Sağ kolon */}
        <Box
          sx={{
            flex: { xs: "1 1 100%", md: "0 0 70%" },
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {/* Kendi Bilgileriniz */}
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3, bgcolor: "white" }}>
            <Typography variant="subtitle1" mb={2} sx={{ color: primaryColor, fontWeight: "bold" }}>
              Kendi Bilgileriniz
            </Typography>

            <TextField
              label="Ad Soyad"
              value={doctor.name}
              onChange={(e) => handleChange("name", e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <IconButton size="small">
                    <EditIcon color="primary" />
                  </IconButton>
                ),
              }}
            />

            <TextField
              label="Email"
              value={doctor.email}
              onChange={(e) => handleChange("email", e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <IconButton size="small">
                    <EditIcon color="primary" />
                  </IconButton>
                ),
              }}
            />

            <TextField
              label="Branş"
              value={doctor.branch}
              onChange={(e) => handleChange("branch", e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
            />

            <TextField
              label="Deneyim (Yıl)"
              type="number"
              value={doctor.experience}
              onChange={(e) => handleChange("experience", e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
            />

            <TextField
              label="Çalıştığı Kurum"
              value={doctor.institution}
              onChange={(e) => handleChange("institution", e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
            />

            <TextField
              label="Diploma No"
              value={doctor.diplomaNo}
              onChange={(e) => handleChange("diplomaNo", e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
            />

            <Box mb={2}>
              <Typography variant="subtitle2" mb={1} sx={{ fontWeight: "bold" }}>
                Uzmanlık Belgeleri
              </Typography>
              {doctor.certifications.map((cert, idx) => (
                <Chip
                  key={idx}
                  label={cert}
                  onDelete={() =>
                    handleChange(
                      "certifications",
                      doctor.certifications.filter((c) => c !== cert)
                    )
                  }
                  sx={{ mr: 1, mb: 1, bgcolor: lightBlue, color: primaryColor }}
                />
              ))}
              <Button
                size="small"
                variant="outlined"
                sx={{ ml: 1, borderColor: primaryColor, color: primaryColor }}
                onClick={() =>
                  handleChange("certifications", [
                    ...doctor.certifications,
                    "Yeni Belge",
                  ])
                }
              >
                + Ekle
              </Button>
            </Box>

            <TextField
              label="Hakkında"
              value={doctor.about}
              onChange={(e) => handleChange("about", e.target.value)}
              multiline
              rows={3}
              fullWidth
              sx={{ mb: 2 }}
            />

            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              sx={{ bgcolor: primaryColor, "&:hover": { bgcolor: "#082147" } }}
            >
              Değişiklikleri Kaydet
            </Button>
          </Paper>

          {/* Alt kullanıcı ekleme */}
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3, bgcolor: "white" }}>
            <Typography variant="subtitle1" mb={2} sx={{ color: primaryColor, fontWeight: "bold" }}>
              Alt Kullanıcı Ekle
            </Typography>
            <Box component="form" onSubmit={handleTeamSubmit}>
              <TextField
                label="Ad Soyad"
                name="name"
                value={teamData.name}
                onChange={handleTeamChange}
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                label="Email"
                name="email"
                value={teamData.email}
                onChange={handleTeamChange}
                fullWidth
                sx={{ mb: 2 }}
              />
              <TextField
                select
                label="Rol"
                name="role"
                value={teamData.role}
                onChange={handleTeamChange}
                fullWidth
                sx={{ mb: 2 }}
              >
                <MenuItem value="assistant">Asistan</MenuItem>
                <MenuItem value="sekreter">Sekreter</MenuItem>
              </TextField>
              <Button type="submit" variant="contained" sx={{ bgcolor: primaryColor, "&:hover": { bgcolor: "#082147" } }}>
                Ekle
              </Button>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="info" sx={{ width: "100%" }}>
          {message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DoctorForm;
