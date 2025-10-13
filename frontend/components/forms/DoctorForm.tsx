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
  Divider,
  Stack,
  Tooltip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
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
    name: "",
    email: "",
    branch: "",
    experience: 0,
    institution: "",
    diplomaNo: "",
    certifications: [] as string[],
    about: "",
    photoUrl: "",
  });

  const [teamData, setTeamData] = useState<TeamData>({
    name: "",
    email: "",
    role: "assistant",
  });

  const [staffMembers, setStaffMembers] = useState<User[]>([]);
  const [message, setMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const primaryColor = "#0a2d57";
  const lightBg = "#f8faff";

  useEffect(() => {
    setDoctor({
      name: user.name || "",
      email: user.email || "",
      branch: user.branch || "",
      experience: user.experience || 0,
      institution: user.institution || "",
      diplomaNo: user.diploma_no || "",
      certifications: Array.isArray(user.certifications)
        ? user.certifications
        : typeof user.certifications === "string"
        ? user.certifications.split(",")
        : [],
      about: user.about || "",
      photoUrl: user.photoUrl || "",
    });

    // Alt kullanıcıları çek
  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token bulunamadı");

      const res = await fetch("http://localhost:8000/api/doctors/my-staff", {
        headers: {
          "token-header": `Bearer ${token}`, // burası Authorization değil, token-header
        },
      });

      if (!res.ok) throw new Error("Alt kullanıcılar alınamadı");

      const data = await res.json();
      setStaffMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Alt kullanıcılar alınamadı", err);
      setMessage("Alt kullanıcılar alınamadı ❌");
      setSnackbarOpen(true);
    }
  };
    fetchStaff();
  }, [user]);

  const handleChange = (field: string, value: any) =>
    setDoctor((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    try {
      if (!user.id) return;
      const res = await updateUser({ id: user.id, ...doctor });
      setMessage("Bilgiler başarıyla güncellendi! ✅");
      setSnackbarOpen(true);
      if (res.user) setUser(res.user);
    } catch {
      setMessage("Bilgiler güncellenirken bir hata oluştu ❌");
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
      await addTeamMember(teamData);
      setMessage("Alt kullanıcı eklendi ve mail gönderildi! ✅");
      setTeamData({ name: "", email: "", role: "assistant" });
      setSnackbarOpen(true);

      // Listeyi güncelle
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/api/doctors/my-staff", {
        headers: {
          "token-header": `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setStaffMembers(Array.isArray(data) ? data : []);
    } catch {
      setMessage("Alt kullanıcı eklenemedi ❌");
      setSnackbarOpen(true);
    }
  };

  return (
    <Box sx={{ bgcolor: lightBg, p: 4, minHeight: "100vh" }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={4}
        alignItems="flex-start"
      >
        {/* Sol Panel */}
        <Paper
          elevation={4}
          sx={{
            p: 4,
            borderRadius: 4,
            flex: { xs: "1 1 100%", md: "0 0 30%" },
            textAlign: "center",
            bgcolor: "#ffffff",
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
            sx={{ color: primaryColor, fontWeight: 700, mb: 0.5 }}
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
              color: "white",
              fontWeight: "bold",
              textTransform: "none",
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

        {/* Sağ Panel */}
        <Box sx={{ flex: { xs: "1", md: "0 0 70%" } }}>
          {/* Bilgiler */}
          <Paper sx={{ p: 4, borderRadius: 4, mb: 4 }} elevation={4}>
            <Typography
              variant="h6"
              sx={{ color: primaryColor, fontWeight: "bold", mb: 3 }}
            >
              Kişisel Bilgiler
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
                onChange={(e) => handleChange("experience", e.target.value)}
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

              {/* Uzmanlık Belgeleri */}
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, color: primaryColor, mb: 1 }}
                >
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
                    sx={{
                      mr: 1,
                      mb: 1,
                      bgcolor: "#eaf1ff",
                      color: primaryColor,
                      fontWeight: 500,
                    }}
                  />
                ))}
                <Tooltip title="Yeni belge ekle">
                  <IconButton
                    size="small"
                    onClick={() =>
                      handleChange("certifications", [
                        ...doctor.certifications,
                        "Yeni Belge",
                      ])
                    }
                  >
                    <AddCircleOutlineIcon color="primary" />
                  </IconButton>
                </Tooltip>
              </Box>

              <TextField
                label="Hakkında"
                value={doctor.about}
                onChange={(e) => handleChange("about", e.target.value)}
                multiline
                rows={3}
                fullWidth
              />

              <Button
                variant="contained"
                sx={{
                  bgcolor: primaryColor,
                  color: "white",
                  fontWeight: "bold",
                  alignSelf: "flex-end",
                  width: "200px",
                  "&:hover": { bgcolor: "#071d3c" },
                }}
                onClick={handleSave}
              >
                Kaydet
              </Button>
            </Stack>
          </Paper>

          {/* Alt Kullanıcı Ekleme */}
          <Paper sx={{ p: 4, borderRadius: 4, mb: 4 }} elevation={4}>
            <Typography
              variant="h6"
              sx={{ color: primaryColor, fontWeight: "bold", mb: 3 }}
            >
              Alt Kullanıcı Ekle
            </Typography>
            <Box component="form" onSubmit={handleTeamSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Ad Soyad"
                  name="name"
                  value={teamData.name}
                  onChange={handleTeamChange}
                  fullWidth
                />
                <TextField
                  label="E-posta"
                  name="email"
                  value={teamData.email}
                  onChange={handleTeamChange}
                  fullWidth
                />
                <TextField
                  select
                  label="Rol"
                  name="role"
                  value={teamData.role}
                  onChange={handleTeamChange}
                  fullWidth
                >
                  <MenuItem value="assistant">Asistan</MenuItem>
                  <MenuItem value="sekreter">Sekreter</MenuItem>
                </TextField>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{
                    bgcolor: primaryColor,
                    color: "white",
                    fontWeight: "bold",
                    py: 1.2,
                    "&:hover": { bgcolor: "#071d3c" },
                  }}
                >
                  Alt Kullanıcı Ekle
                </Button>
              </Stack>
            </Box>
          </Paper>

          {/* Alt Kullanıcı Listesi */}
          <Paper sx={{ p: 4, borderRadius: 4 }} elevation={4}>
            <Typography
              variant="h6"
              sx={{ color: primaryColor, fontWeight: "bold", mb: 3 }}
            >
              Alt Kullanıcılar
            </Typography>
            {staffMembers.length === 0 ? (
              <Typography>Henüz alt kullanıcı eklenmemiş.</Typography>
            ) : (
              <Stack spacing={1}>
                {staffMembers.map((staff) => (
                  <Paper
                    key={staff.id}
                    sx={{
                      p: 2,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      bgcolor: "#f1f5ff",
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 600 }}>
                        {staff.name}
                      </Typography>
                      <Typography variant="body2">{staff.email}</Typography>
                      <Typography variant="body2">{staff.role}</Typography>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            )}
          </Paper>
        </Box>
      </Stack>

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
