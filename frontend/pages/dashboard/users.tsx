import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";

import {
  User,
  getMyStaff,
  addTeamMember,
  updateTeamMember,
  removeTeamMember,
  resendStaffMail,
} from "../../services/api";
import StaffCardModal from "../../components/staff/StaffCardModal";
import Layout from "../../components/layout/Layout";

const UserManagementPage: React.FC = () => {
  const [staffMembers, setStaffMembers] = useState<User[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);
  const [activeForm, setActiveForm] = useState<"add" | "edit" | null>(null);
  const [teamData, setTeamData] = useState({
    name: "",
    email: "",
    role: "assistant" as "assistant" | "sekreter",
  });
  const [message, setMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [loadingMail, setLoadingMail] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>(["name", "email", "role"]);

  const primaryColor = "#0a2d57";
  const filterOptions = ["name", "email", "role"];

  // fetch staff
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

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleTeamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTeamData({ ...teamData, [name]: value });
  };

  const handleAddClick = () => {
    if (activeForm === "add") {
      setActiveForm(null);
      setSelectedStaff(null);
      setTeamData({ name: "", email: "", role: "assistant" });
    } else {
      setActiveForm("add");
      setSelectedStaff(null);
      setTeamData({ name: "", email: "", role: "assistant" });
    }
  };

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addTeamMember(teamData);
      setMessage("Alt kullanıcı eklendi! ✅");
      setSnackbarOpen(true);
      setTeamData({ name: "", email: "", role: "assistant" });
      await fetchStaff();
      setActiveForm(null);
    } catch {
      setMessage("Alt kullanıcı eklenemedi ❌");
      setSnackbarOpen(true);
    }
  };

  // ✅ Güncellenen kısım
  const handleEditClick = (staff: User) => {
    // Aynı kullanıcıya tekrar basılırsa form kapanır
    if (selectedStaff && selectedStaff.id === staff.id && activeForm === "edit") {
      setActiveForm(null);
      setSelectedStaff(null);
      setTeamData({ name: "", email: "", role: "assistant" });
    } else {
      setSelectedStaff(staff);
      setTeamData({
        name: staff.name || "",
        email: staff.email || "",
        role: (staff.role as "assistant" | "sekreter") || "assistant",
      });
      setActiveForm("edit");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    try {
      const res: any = await updateTeamMember(selectedStaff.id, teamData);
      if (res?.error) {
        setMessage(res.error);
        setSnackbarOpen(true);
        return;
      }
      await fetchStaff();
      setMessage("Alt kullanıcı güncellendi ✅");
      setSnackbarOpen(true);
      setActiveForm(null);
      setSelectedStaff(null);
      setTeamData({ name: "", email: "", role: "assistant" });
    } catch {
      setMessage("Güncelleme başarısız ❌");
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
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="Düzenle">
            <IconButton
              size="small"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                handleEditClick(params.row);
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Sil">
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Bu kullanıcıyı silmek istediğinize emin misiniz?")) {
                  handleRemoveStaff(params.row.id);
                }
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  const filteredStaff = useMemo(() => {
    if (!filterText || selectedFilters.length === 0) return staffMembers;
    return staffMembers.filter((s) =>
      selectedFilters.some((field) =>
        (s[field as keyof User] || "")
          .toString()
          .toLowerCase()
          .includes(filterText.toLowerCase())
      )
    );
  }, [staffMembers, filterText, selectedFilters]);

  return (
    <Layout>
      <Box sx={{ pt: "80px", px: 4, minHeight: "100vh" }}>
        <Typography variant="h4" gutterBottom sx={{ color: primaryColor, fontWeight: "bold" }}>
          Kullanıcı Yönetimi
        </Typography>

        <Button variant="contained" startIcon={<AddCircleOutlineIcon />} sx={{ mb: 3 }} onClick={handleAddClick}>
          Yeni Kullanıcı Ekle
        </Button>

        {/* Form */}
        {activeForm && (
          <Paper sx={{ p: 3, mb: 3, boxShadow: 3 }}>
            <form onSubmit={activeForm === "edit" ? handleEditSubmit : handleTeamSubmit}>
              <Stack spacing={2}>
                <TextField label="Ad Soyad" name="name" value={teamData.name} onChange={handleTeamChange} required />
                <TextField label="E-posta" name="email" value={teamData.email} onChange={handleTeamChange} required />
                <TextField label="Rol" name="role" select value={teamData.role} onChange={handleTeamChange}>
                  <MenuItem value="assistant">Asistan</MenuItem>
                  <MenuItem value="sekreter">Sekreter</MenuItem>
                </TextField>
                <Stack direction="row" spacing={2}>
                  <Button type="submit" variant="contained" color="primary">
                    {activeForm === "edit" ? "Güncelle" : "Ekle"}
                  </Button>
                  {activeForm === "edit" && (
                    <Button
                      variant="outlined"
                      onClick={handleResendMail}
                      disabled={loadingMail}
                      sx={{
                        color: primaryColor,
                        borderColor: primaryColor,
                        "&:hover": { backgroundColor: primaryColor, color: "#fff", borderColor: primaryColor },
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

        {/* Filtreleme */}
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={2}>
          <TextField
            select
            label="Filtre Alanı"
            size="small"
            variant="outlined"
            value={selectedFilters[0]}
            onChange={(e) => setSelectedFilters([e.target.value])}
            sx={{ minWidth: 140 }}
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
          />
        </Stack>

        {/* DataGrid */}
        <Box sx={{ width: "100%" }}>
          <DataGrid
            rows={filteredStaff}
            columns={columns}
            getRowId={(row) => row.id}
            autoHeight
            pageSizeOptions={[5, 10, 20]}
            disableRowSelectionOnClick
            onRowClick={(params, event) => {
              const target = event.target as HTMLElement;
              // ✅ Butona veya ikona basılırsa kişi kartı açılmasın
              if (target.closest("button") || target.closest("svg")) return;
              setSelectedStaff(params.row);
            }}
            sx={{
              bgcolor: "#fff",
              borderRadius: 2,
              boxShadow: 2,
              "& .MuiDataGrid-cell:hover": { backgroundColor: "rgba(0,0,0,0.04)" },
            }}
          />
        </Box>

        {/* Staff Modal */}
        {selectedStaff && <StaffCardModal staff={selectedStaff} onClose={() => setSelectedStaff(null)} />}

        {/* Snackbar */}
        <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={() => setSnackbarOpen(false)}>
          <Alert severity="info" sx={{ width: "100%" }}>
            {message}
          </Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
};

export default UserManagementPage;
