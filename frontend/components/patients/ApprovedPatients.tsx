// components/ApprovedPatients.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  TextField,
  Snackbar,
  Alert,
  Stack,
  Tabs,
  Tab,
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { getApprovedPatients } from "../../services/PatientApi";
import { getStaffList } from "../../services/StaffApi";
import { grantPatientPermission, revokePatientPermission } from "../../services/AssistantApi";
import { User } from "../../types/Staff";
import PatientCardModal from "./PatientCardContent";

const ApprovedPatients: React.FC = () => {
  const [patients, setPatients] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<User[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [selectedAssistant, setSelectedAssistant] = useState<number | null>(null);

  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [doctorId, setDoctorId] = useState<number | null>(null);

  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<"doctor" | "citizen">("citizen");
  const [detailTab, setDetailTab] = useState(0);

  const primaryColor = "#0a2d57";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          setCurrentUserRole(userObj.role);
          setDoctorId(userObj.id);
        } catch (err) {
          console.error("user parse hatası:", err);
        }
      }
    }
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const patientsData = await getApprovedPatients();
      setPatients(patientsData);

      const staffData = await getStaffList();
      setStaff(staffData);
    } catch (err: any) {
      console.error(err);
      setSnackbarMessage(err.message || "Veri alınamadı ❌");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGrantPermission = async () => {
    if (!selectedPatientId || !selectedAssistant || !doctorId) {
      setSnackbarMessage("Lütfen bir hasta ve asistan seçin ❗");
      setSnackbarOpen(true);
      return;
    }
    try {
      await grantPatientPermission(doctorId, selectedAssistant, selectedPatientId);
      setSnackbarMessage("İzin başarıyla verildi ✅");
      setSnackbarOpen(true);
      setSelectedAssistant(null);
      fetchData();
    } catch (err: any) {
      console.error(err);
      setSnackbarMessage(err.response?.data?.detail || err.message || "İzin verilemedi ❌");
      setSnackbarOpen(true);
    }
  };

  const handleRevokePermission = async () => {
    if (!selectedPatientId || !selectedAssistant || !doctorId) {
      setSnackbarMessage("Lütfen bir hasta ve asistan seçin ❗");
      setSnackbarOpen(true);
      return;
    }
    try {
      await revokePatientPermission(doctorId, selectedAssistant, selectedPatientId);
      setSnackbarMessage("İzin başarıyla kaldırıldı ✅");
      setSnackbarOpen(true);
      setSelectedAssistant(null);
      fetchData();
    } catch (err: any) {
      console.error(err);
      setSnackbarMessage(err.response?.data?.detail || err.message || "İzin kaldırılamadı ❌");
      setSnackbarOpen(true);
    }
  };

  const handleDoctorNoteChange = (id: number, value: string) => {
    setPatients(prev =>
      prev.map(p => (p.id === id ? { ...p, doctorNote: value } : p))
    );
  };

  const columns: GridColDef[] = [
    {
      field: "photoUrl",
      headerName: "Fotoğraf",
      flex: 0.5,
      renderCell: (params) => <Avatar src={params.value || ""} sx={{ width: 40, height: 40 }} />,
    },
    { field: "name", headerName: "Ad Soyad", flex: 1 },
    { field: "phone", headerName: "Numara", flex: 1 },
    {
      field: "doctorNote",
      headerName: "Açıklama",
      flex: 2,
      renderCell: (params: GridRenderCellParams) => (
        <input
          type="text"
          value={params.value || ""}
          onChange={(e) => handleDoctorNoteChange(params.row.id, e.target.value)}
          style={{ width: "100%", border: "none", background: "transparent" }}
        />
      ),
    },
    {
      field: "detail",
      headerName: "Detay",
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <Button
          variant="contained"
          size="small"
          onClick={() => setSelectedPatient(params.row)}
        >
          Detay Gör
        </Button>
      ),
    },
  ];

  return (
    <Box sx={{ p: 4, bgcolor: "#f8faff", minHeight: "100vh" }}>
      <Typography variant="h5" sx={{ color: primaryColor, fontWeight: "bold", mb: 2 }}>
        Onaylı Hastalar
      </Typography>

      <Paper sx={{ p: 2 }}>
        <DataGrid
          rows={patients}
          columns={columns}
          getRowId={(row) => row.id}
          autoHeight
          pageSizeOptions={[5, 10]}
          loading={loading}
          disableRowSelectionOnClick
        />
      </Paper>

      {/* Detay Modal (Tab0: Kişisel Bilgiler, Tab1: İzinler) */}
      <Dialog
        open={!!selectedPatient}
        onClose={() => setSelectedPatient(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Hasta Detayları</DialogTitle>
        <DialogContent>
          <Tabs value={detailTab} onChange={(e, v) => setDetailTab(v)} sx={{ mb: 2 }}>
            <Tab label="Kişisel Bilgiler" />
            <Tab label="İzinler" />
          </Tabs>

          {detailTab === 0 && selectedPatient && (
            <PatientCardModal patient={selectedPatient} />
          )}

          {detailTab === 1 && selectedPatient && (
            <Box>
              <TextField
                select
                label="Asistan Seç"
                value={selectedAssistant ?? ""}
                onChange={(e) => setSelectedAssistant(Number(e.target.value))}
                fullWidth
                sx={{ mb: 2 }}
              >
                {staff.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name} ({s.email})
                  </MenuItem>
                ))}
              </TextField>

              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  onClick={() => {
                    if (selectedPatient) setSelectedPatientId(selectedPatient.id);
                    handleGrantPermission();
                  }}
                  disabled={!selectedAssistant}
                >
                  İzin Ver
                </Button>

                <Button
                  variant="contained"
                  color="error"
                  onClick={() => {
                    if (selectedPatient) setSelectedPatientId(selectedPatient.id);
                    handleRevokePermission();
                  }}
                  disabled={!selectedAssistant}
                >
                  İzni Kaldır
                </Button>
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedPatient(null)}>Kapat</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert severity="info" sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ApprovedPatients;
