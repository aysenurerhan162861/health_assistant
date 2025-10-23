// components/forms/DoctorForm.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Alert,
  TextField,
  Button,
  MenuItem,
  Snackbar,
  Divider,
  Stack,
  IconButton,
  Chip,
  Autocomplete,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import {
  User,
  addTeamMember,
  updateUser,
  getMyStaff,
  removeTeamMember,
  updateTeamMember,
  resendStaffMail,
} from "../../services/api";

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

  const [staffMembers, setStaffMembers] = useState<User[]>([]);
  const [showStaffPanel, setShowStaffPanel] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);
  const [activeForm, setActiveForm] = useState<"add" | "edit" | null>(null);
  const [teamData, setTeamData] = useState<TeamData>({ name: "", email: "", role: "assistant" });
  const [message, setMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [loadingMail, setLoadingMail] = useState(false);

  const [filterText, setFilterText] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>(["name", "email", "role"]);

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
      certifications: Array.isArray(user.certifications)
        ? user.certifications
        : typeof user.certifications === "string"
        ? user.certifications.split(",")
        : [],
      about: user.about || "",
      photoUrl: user.photoUrl || "",
    });

    const fetchStaff = async () => {
      try {
        const staff = await getMyStaff();
        setStaffMembers(staff);
      } catch (err) {
        console.error(err);
        setMessage("Alt kullanıcılar alınamadı ❌");
        setSnackbarOpen(true);
      }
    };
    fetchStaff();
  }, [user]);

  const handleChange = (field: string, value: any) => setDoctor((prev) => ({ ...prev, [field]: value }));

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

  const handleTeamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTeamData({ ...teamData, [name]: value });
  };

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addTeamMember(teamData);
      setMessage("Alt kullanıcı eklendi! ✅");
      setSnackbarOpen(true);
      setTeamData({ name: "", email: "", role: "assistant" });
      const updatedStaff = await getMyStaff();
      setStaffMembers(updatedStaff);
      setActiveForm(null);
    } catch {
      setMessage("Alt kullanıcı eklenemedi ❌");
      setSnackbarOpen(true);
    }
  };

  const handleRemoveStaff = async (id: number) => {
    try {
      await removeTeamMember(id);
      setMessage("Alt kullanıcı silindi ✅");
      setSnackbarOpen(true);
      setStaffMembers((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setMessage("Silme işlemi başarısız ❌");
      setSnackbarOpen(true);
    }
  };

  const handleEditClick = (staff: User) => {
    if (activeForm === "edit" && selectedStaff?.id === staff.id) {
      setActiveForm(null);
      setSelectedStaff(null);
    } else {
      setSelectedStaff(staff);
      setTeamData({
        name: staff.name || "",
        email: staff.email || "",
        role: staff.role as "assistant" | "sekreter",
      });
      setActiveForm("edit");
    }
  };

  const handleAddClick = () => {
    if (activeForm === "add") {
      setActiveForm(null);
      setSelectedStaff(null);
    } else {
      setActiveForm("add");
      setSelectedStaff(null);
      setTeamData({ name: "", email: "", role: "assistant" });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    try {
      const res = await updateTeamMember(selectedStaff.id, teamData);
      if (res.error) {
        setMessage(res.error);
        setSnackbarOpen(true);
        return;
      }
      const updatedStaff = await getMyStaff();
      setStaffMembers(updatedStaff);
      setMessage("Alt kullanıcı güncellendi ✅");
      setSnackbarOpen(true);
      setActiveForm(null);
      setSelectedStaff(null);
      setTeamData({ name: "", email: "", role: "assistant" });
    } catch (err) {
      console.error(err);
      setMessage("Güncelleme başarısız ❌");
      setSnackbarOpen(true);
    }
  };

  const handleResendMail = async () => {
    if (!selectedStaff) return;
    setLoadingMail(true);
    try {
      const res = await resendStaffMail(selectedStaff.id);
      setMessage(res.message);
      setSnackbarOpen(true);
    } catch (err: any) {
      setMessage(err.message || "Mail gönderilemedi ❌");
      setSnackbarOpen(true);
    } finally {
      setLoadingMail(false);
    }
  };

  const columns: GridColDef[] = [
    { field: "name", headerName: "Ad Soyad", flex: 1 },
    { field: "email", headerName: "E-posta", flex: 1.5 },
    { field: "role", headerName: "Rol", flex: 1 },
    {
      field: "actions",
      headerName: "İşlemler",
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" spacing={1}>
          <IconButton color="primary" size="small" onClick={() => handleEditClick(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton color="error" size="small" onClick={() => handleRemoveStaff(params.row.id)}>
            <DeleteIcon />
          </IconButton>
        </Stack>
      ),
    },
  ];

  const filterOptions = ["name", "email", "role"];
  const filteredStaff = useMemo(() => {
    if (!filterText || selectedFilters.length === 0) return staffMembers;
    return staffMembers.filter((s) =>
      selectedFilters.some((field) =>
        (s[field as keyof User] || "").toString().toLowerCase().includes(filterText.toLowerCase())
      )
    );
  }, [staffMembers, filterText, selectedFilters]);

  return (
    <Box sx={{ bgcolor: lightBg, p: 4, minHeight: "100vh", position: "relative" }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={4} alignItems="flex-start">
        {/* Doctor Profile Panel */}
        <Paper elevation={4} sx={{ p: 4, borderRadius: 4, flex: { xs: "1 1 100%", md: "0 0 30%" }, textAlign: "center", bgcolor: "#fff" }}>
          <Avatar src={doctor.photoUrl} sx={{ width: 130, height: 130, mx: "auto", mb: 2, border: `3px solid ${primaryColor}` }} />
          <Typography variant="h6" sx={{ color: primaryColor, fontWeight: 700 }}>{doctor.name || "Ad Soyad"}</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2, fontStyle: "italic" }}>{doctor.branch || "Branş bilgisi yok"}</Typography>
          <Button variant="contained" fullWidth startIcon={<UploadFileIcon />} sx={{ bgcolor: primaryColor, color: "#fff", fontWeight: "bold", "&:hover": { bgcolor: "#071d3c" } }}>Fotoğraf Yükle</Button>
          <Divider sx={{ my: 3 }} />
          <Typography variant="subtitle2" sx={{ color: primaryColor, fontWeight: 600 }}>{doctor.institution || "Kurumu Belirtilmemiş"}</Typography>
          <Divider sx={{ my: 2 }} />
          <Button variant="outlined" fullWidth onClick={() => setShowStaffPanel(true)}>Kullanıcılar</Button>
        </Paper>

        {/* Doctor Info Panel */}
        <Box sx={{ flex: { xs: "1", md: "0 0 70%" } }}>
          <Paper sx={{ p: 4, borderRadius: 4, mb: 4 }} elevation={4}>
            <Typography variant="h6" sx={{ color: primaryColor, fontWeight: "bold", mb: 3 }}>Kişisel Bilgiler</Typography>
            <Stack spacing={2}>
              <TextField label="Ad Soyad" value={doctor.name} onChange={(e) => handleChange("name", e.target.value)} fullWidth />
              <TextField label="E-posta" value={doctor.email} onChange={(e) => handleChange("email", e.target.value)} fullWidth />
              <TextField label="Branş" value={doctor.branch} onChange={(e) => handleChange("branch", e.target.value)} fullWidth />
              <TextField label="Deneyim (yıl)" type="number" value={doctor.experience} onChange={(e) => handleChange("experience", Number(e.target.value))} fullWidth />
              <TextField label="Çalıştığı Kurum" value={doctor.institution} onChange={(e) => handleChange("institution", e.target.value)} fullWidth />
              <TextField label="Diploma No" value={doctor.diplomaNo} onChange={(e) => handleChange("diplomaNo", e.target.value)} fullWidth />
              <TextField label="Hakkında" value={doctor.about} onChange={(e) => handleChange("about", e.target.value)} multiline minRows={3} fullWidth />
              <Button variant="contained" color="primary" onClick={handleSave} sx={{ fontWeight: "bold" }}>Kaydet</Button>
            </Stack>
          </Paper>
        </Box>
      </Stack>

      {/* Staff Panel */}
      {showStaffPanel && (
        <Paper elevation={10} sx={{ position: "absolute", top: 0, left: "30%", width: "70%", height: "100%", bgcolor: "#f8faff", zIndex: 999, p: 4, overflowY: "auto", borderRadius: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" sx={{ fontWeight: "bold", color: primaryColor }}>Alt Kullanıcılar</Typography>
            <IconButton onClick={() => setShowStaffPanel(false)}><CloseIcon /></IconButton>
          </Stack>

          <Button variant="contained" startIcon={<AddCircleOutlineIcon />} sx={{ mb: 2 }} onClick={handleAddClick}>Yeni Kullanıcı Ekle</Button>

          {/* Filter & Search */}
<Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={2}>
  <TextField
    select
    label="Filtre Alanı"
    size="small"
    variant="outlined"
    value={selectedFilters[0]} // ✅ Tek seçimli
    onChange={(e) => setSelectedFilters([e.target.value])}
    fullWidth
    sx={{
      "& .MuiInputLabel-root": { color: primaryColor },
      "& .MuiOutlinedInput-root": { bgcolor: "#fff" },
    }}
  >
    {filterOptions.map((option) => (
      <MenuItem key={option} value={option}>
        {option.charAt(0).toUpperCase() + option.slice(1)}
      </MenuItem>
    ))}
  </TextField>

  <TextField
    label="Ara..."
    variant="outlined"
    size="small"
    value={filterText}
    onChange={(e) => setFilterText(e.target.value)}
    fullWidth
    sx={{
      "& .MuiInputLabel-root": { color: primaryColor },
      "& .MuiOutlinedInput-root": { bgcolor: "#fff" },
    }}
  />
</Stack>

          {/* Add/Edit Form */}
          {activeForm && (
            <Paper sx={{ p: 3, mb: 3 }} elevation={4}>
              <form onSubmit={activeForm === "edit" ? handleEditSubmit : handleTeamSubmit}>
                <Stack spacing={2}>
                  <TextField label="Ad Soyad" name="name" value={teamData.name} onChange={handleTeamChange} required />
                  <TextField label="E-posta" name="email" value={teamData.email} onChange={handleTeamChange} required />
                  <TextField label="Rol" name="role" select value={teamData.role} onChange={handleTeamChange}>
                    <MenuItem value="assistant">Asistan</MenuItem>
                    <MenuItem value="sekreter">Sekreter</MenuItem>
                  </TextField>
                  <Stack direction="row" spacing={2}>
                    <Button type="submit" variant="contained" color="primary">{activeForm === "edit" ? "Güncelle" : "Ekle"}</Button>
                    {activeForm === "edit" && (
  <Button
    variant="outlined"
    onClick={handleResendMail}
    disabled={loadingMail}
    sx={{
      color: primaryColor,           // yazı rengi
      borderColor: primaryColor,     // kenar rengi
      "&:hover": {
        backgroundColor: primaryColor,
        color: "#fff",
        borderColor: primaryColor,
      },
    }}
  >
    {loadingMail ? "Gönderiliyor..." : "Mail Gönder"}
  </Button>
)}
                  </Stack>
                </Stack>
              </form>
            </Paper>
          )}

          {/* DataGrid */}
          <Box sx={{ height: 500, width: "100%" }}>
            <DataGrid
              rows={filteredStaff}
              columns={columns}
              getRowId={(row) => row.id}
              autoHeight
              disableRowSelectionOnClick
              pageSizeOptions={[5, 10, 20]}
            />
          </Box>
        </Paper>
      )}

      <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={() => setSnackbarOpen(false)}>
        <Alert severity="info" sx={{ width: "100%" }}>{message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default DoctorForm;
