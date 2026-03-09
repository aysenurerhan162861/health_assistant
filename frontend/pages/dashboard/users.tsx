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

import AssistantPermissionManager from "../../components/assistant/AssistantPermissionManager";


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
  const [selectedFilters, setSelectedFilters] = useState<string[]>(["name"]);

  const primaryColor = "#0a2d57";
  const filterOptions = ["name", "email", "role"];

  const fetchStaff = async () => {
    try {
      const staff = await getMyStaff();
      setStaffMembers(staff);
    } catch {
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
    setActiveForm(activeForm === "add" ? null : "add");
    setSelectedStaff(null);
    setTeamData({ name: "", email: "", role: "assistant" });
  };

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addTeamMember(teamData);
    await fetchStaff();
    setActiveForm(null);
    setMessage("Alt kullanıcı eklendi ✅");
    setSnackbarOpen(true);
  };

  const handleEditClick = (staff: User) => {
    setSelectedStaff(staff);
    setTeamData({
      name: staff.name || "",
      email: staff.email || "",
      role: (staff.role as "assistant" | "sekreter") || "assistant",
    });
    setActiveForm("edit");
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    await updateTeamMember(selectedStaff.id, teamData);
    await fetchStaff();

    setActiveForm(null);
    setSelectedStaff(null);
    setMessage("Alt kullanıcı güncellendi ✅");
    setSnackbarOpen(true);
  };

  const handleRemoveStaff = async (id: number) => {
    await removeTeamMember(id);
    setStaffMembers((prev) => prev.filter((s) => s.id !== id));
    setMessage("Alt kullanıcı silindi ✅");
    setSnackbarOpen(true);
  };

  const handleResendMail = async () => {
    if (!selectedStaff) return;

    console.log("MAIL GÖNDER TIKLANDI"); // 🧪 test

    setLoadingMail(true);
    try {
      const res = await resendStaffMail(selectedStaff.id);
      setMessage(res.message || "Mail gönderildi ✅");
    } catch (err: any) {
      setMessage(err.message || "Mail gönderilemedi ❌");
    } finally {
      setSnackbarOpen(true);
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
          <IconButton onClick={() => handleEditClick(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => {
              if (confirm("Silmek istiyor musunuz?")) {
                handleRemoveStaff(params.row.id);
              }
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Stack>
      ),
    },
  ];

  const filteredStaff = useMemo(() => {
    if (!filterText) return staffMembers;
    return staffMembers.filter((s) =>
      selectedFilters.some((f) =>
        (s[f as keyof User] || "")
          .toString()
          .toLowerCase()
          .includes(filterText.toLowerCase())
      )
    );
  }, [staffMembers, filterText, selectedFilters]);

  return (
    <Layout>
      <Box sx={{ pt: "80px", px: 4 }}>
        <Typography variant="h4" gutterBottom>
          Kullanıcı Yönetimi
        </Typography>

        <Button variant="contained" onClick={handleAddClick}>
          Yeni Kullanıcı Ekle
        </Button>

        {activeForm && (
          <Paper sx={{ p: 3, my: 3 }}>
            <form onSubmit={activeForm === "edit" ? handleEditSubmit : handleTeamSubmit}>
              <Stack spacing={2}>
                <TextField name="name" label="Ad Soyad" value={teamData.name} onChange={handleTeamChange} />
                <TextField name="email" label="E-posta" value={teamData.email} onChange={handleTeamChange} />
                <TextField select name="role" label="Rol" value={teamData.role} onChange={handleTeamChange}>
                  <MenuItem value="assistant">Asistan</MenuItem>
                  <MenuItem value="sekreter">Sekreter</MenuItem>
                </TextField>

                <Stack direction="row" spacing={2}>
                  <Button type="submit" variant="contained">
                    Güncelle
                  </Button>

                  {activeForm === "edit" && (
                    <Button
                      type="button" // 🔥 KRİTİK SATIR
                      variant="outlined"
                      onClick={handleResendMail}
                      disabled={loadingMail}
                    >
                      {loadingMail ? "Gönderiliyor..." : "Mail Gönder"}
                    </Button>
                  )}
                </Stack>
              </Stack>
            </form>
          </Paper>
        )}

        <DataGrid
          rows={filteredStaff}
          columns={columns}
          getRowId={(row) => row.id}
          autoHeight
          disableRowSelectionOnClick
        />

        <AssistantPermissionManager />

        <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={() => setSnackbarOpen(false)}>
          <Alert severity="info">{message}</Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
};

export default UserManagementPage;