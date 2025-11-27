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
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { getApprovedPatients } from "../../services/PatientApi";
import { getStaffList } from "../../services/StaffApi";
import { grantPatientPermission, revokePatientPermission } from "../../services/AssistantApi";
import { getPatientLabReports } from "../../services/LabApi";
import { User } from "../../types/Staff";
import { LabReport } from "../../types/LabReport";
import ReportList from "../labs/ReportList";
import PatientCardModal from "./PatientCardModal";

const ApprovedPatients: React.FC = () => {
  const [patients, setPatients] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<User[]>([]);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [selectedAssistant, setSelectedAssistant] = useState<number | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [dialogMode, setDialogMode] = useState<"grant" | "revoke">("grant");

  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);
  const [selectedPatientReports, setSelectedPatientReports] = useState<LabReport[]>([]);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<"doctor" | "patient">("patient");

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

  const handleOpenPermissionDialog = (patientId: number, mode: "grant" | "revoke") => {
    setSelectedPatientId(patientId);
    setSelectedAssistant(null);
    setDialogMode(mode);
    setPermissionDialogOpen(true);
  };

  const handleGrantPermission = async () => {
    if (selectedPatientId === null || selectedAssistant === null || doctorId === null) {
      setSnackbarMessage("Lütfen bir hasta ve asistan seçin ❗");
      setSnackbarOpen(true);
      return;
    }
    try {
      await grantPatientPermission(doctorId, selectedAssistant, selectedPatientId);
      setSnackbarMessage("İzin başarıyla verildi ✅");
      setSnackbarOpen(true);
      setPermissionDialogOpen(false);
      setSelectedAssistant(null);
      fetchData();
    } catch (err: any) {
      console.error(err);
      setSnackbarMessage(err.response?.data?.detail || err.message || "İzin verilemedi ❌");
      setSnackbarOpen(true);
    }
  };

  const handleRevokePermission = async () => {
    if (selectedPatientId === null || selectedAssistant === null || doctorId === null) {
      setSnackbarMessage("Lütfen bir hasta ve asistan seçin ❗");
      setSnackbarOpen(true);
      return;
    }
    try {
      await revokePatientPermission(doctorId, selectedAssistant, selectedPatientId);
      setSnackbarMessage("İzin başarıyla kaldırıldı ✅");
      setSnackbarOpen(true);
      setPermissionDialogOpen(false);
      setSelectedAssistant(null);
      fetchData();
    } catch (err: any) {
      console.error(err);
      setSnackbarMessage(err.response?.data?.detail || err.message || "İzin kaldırılamadı ❌");
      setSnackbarOpen(true);
    }
  };

  const handleOpenPatientReports = async (patientId: number) => {
    try {
      const reports = await getPatientLabReports(patientId);
      setSelectedPatientReports(reports);
    } catch (err) {
      console.error("TAHLİL ALINAMADI:", err);
      setSelectedPatientReports([]);
    }
    setReportModalOpen(true);
  };

  const handleClosePatientReports = () => {
    setReportModalOpen(false);
    setSelectedPatientReports([]);
  };

  const handleDoctorNoteChange = (id: number, value: string) => {
    setPatients(prev =>
      prev.map(p => (p.id === id ? { ...p, doctorNote: value } : p))
    );
    // Burada API çağrısı ekleyebilirsin, örn: updateDoctorNote(id, value)
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
      field: "permissions",
      headerName: "İzinler",
      flex: 1,
      renderCell: (params: GridRenderCellParams) => {
        const hasPermission = params.row.hasPermission;
        return (
          <Stack direction="row" spacing={1}>
            {!hasPermission && (
              <Button
                variant="contained"
                size="small"
                sx={{ bgcolor: "green", "&:hover": { bgcolor: "#0a6d0a" } }}
                onClick={() => handleOpenPermissionDialog(params.row.id, "grant")}
              >
                İzin Ver
              </Button>
            )}
            {hasPermission && (
              <Button
                variant="contained"
                size="small"
                sx={{ bgcolor: "red", "&:hover": { bgcolor: "#7a0a0a" } }}
                onClick={() => handleOpenPermissionDialog(params.row.id, "revoke")}
              >
                ❌
              </Button>
            )}
          </Stack>
        );
      },
    },
    {
      field: "lab_reports",
      headerName: "Tahliller",
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <Button variant="contained" size="small" onClick={() => handleOpenPatientReports(params.row.id)}>
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
          onRowClick={(params) => setSelectedPatient(params.row)}
        />
      </Paper>

      <PatientCardModal
        patient={selectedPatient}
        onClose={() => setSelectedPatient(null)}
      />

      <Dialog
        open={permissionDialogOpen}
        onClose={() => setPermissionDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {dialogMode === "grant" ? "Asistan Seç ve İzin Ver" : "Asistan Seç ve İzni Kaldır"}
        </DialogTitle>
        <DialogContent>
          <TextField
            select
            label="Asistan Seç"
            value={selectedAssistant ?? ""}
            onChange={(e) => setSelectedAssistant(Number(e.target.value))}
            fullWidth
          >
            {staff.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name} ({s.email})
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermissionDialogOpen(false)}>İptal</Button>
          {dialogMode === "grant" ? (
            <Button variant="contained" onClick={handleGrantPermission}>
              İzin Ver
            </Button>
          ) : (
            <Button variant="contained" color="error" onClick={handleRevokePermission}>
              İzni Kaldır
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={reportModalOpen} onClose={handleClosePatientReports} maxWidth="md" fullWidth>
        <DialogTitle>Hasta Tahlil Raporları</DialogTitle>
        <DialogContent>
          {selectedPatientReports.length > 0 ? (
            <ReportList reports={selectedPatientReports} patientId={selectedPatientId!} refreshReports={fetchData} userRole={currentUserRole} />
          ) : (
            <Typography>Lab raporu bulunamadı.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePatientReports}>Kapat</Button>
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
