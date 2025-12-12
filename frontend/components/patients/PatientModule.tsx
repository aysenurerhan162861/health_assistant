// src/components/patient/PatientModule.tsx
"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Avatar,
  Stack,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import {
  getPendingPatients,
  getApprovedPatients,
  approvePatient,
  rejectPatient,
  getPatientById,
} from "../../services/PatientApi";
import { User } from "../../types/Staff";

const PatientModule: React.FC = () => {
  const [pendingPatients, setPendingPatients] = useState<User[]>([]);
  const [approvedPatients, setApprovedPatients] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);

  const primaryColor = "#0a2d57";

  // 🔹 Hastaları backend'den al
  const fetchPatients = async () => {
    try {
      setLoading(true);
      const pending = await getPendingPatients();
      const approved = await getApprovedPatients();
      setPendingPatients(pending);
      setApprovedPatients(approved);
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || "Hasta verileri alınamadı ❌");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      await approvePatient(id);
      setMessage("Hasta onaylandı ✅");
      setSnackbarOpen(true);
      fetchPatients();
    } catch (err: any) {
      setMessage(err.message || "Onaylama başarısız ❌");
      setSnackbarOpen(true);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await rejectPatient(id);
      setMessage("Hasta reddedildi ❌");
      setSnackbarOpen(true);
      fetchPatients();
    } catch (err: any) {
      setMessage(err.message || "Reddetme başarısız ❌");
      setSnackbarOpen(true);
    }
  };

  // 🔹 Hasta detaylarını aç
  const handleOpenPatientCard = async (patientId: number) => {
    if (!patientId) {
      console.warn("Hasta ID bulunamadı!");
      return;
    }

    try {
      setDialogLoading(true);
      setOpenDialog(true);
      const data = await getPatientById(patientId); // ✅ Token-header ile çalışan versiyon
      setSelectedPatient(data);
    } catch (err: any) {
      setMessage(err.message || "Hasta bilgisi alınamadı ❌");
      setSnackbarOpen(true);
    } finally {
      setDialogLoading(false);
    }
  };

  // 🔸 Onay bekleyen hastalar tablosu
  const pendingColumns: GridColDef[] = [
    {
      field: "photoUrl",
      headerName: "Fotoğraf",
      flex: 0.5,
      renderCell: (params: GridRenderCellParams) => (
        <Avatar src={params.value || ""} sx={{ width: 40, height: 40 }} />
      ),
    },
    {
      field: "name",
      headerName: "Ad Soyad",
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          sx={{
            color: primaryColor,
            textDecoration: "underline",
            cursor: "pointer",
          }}
          onClick={() =>
            handleOpenPatientCard(params.row.patient_id || params.row.id)
          }
        >
          {params.value}
        </Typography>
      ),
    },
    { field: "phone", headerName: "Numara", flex: 1 },
    { field: "about", headerName: "Hasta Açıklaması", flex: 2 },
    {
      field: "actions",
      headerName: "İşlemler",
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            color="success"
            size="small"
            onClick={() => handleApprove(params.row.id)}
          >
            Onayla
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={() => handleReject(params.row.id)}
          >
            Red
          </Button>
        </Stack>
      ),
    },
  ];

  // 🔸 Onaylı hastalar tablosu
  const approvedColumns: GridColDef[] = [
    {
      field: "photoUrl",
      headerName: "Fotoğraf",
      flex: 0.5,
      renderCell: (params: GridRenderCellParams) => (
        <Avatar src={params.value || ""} sx={{ width: 40, height: 40 }} />
      ),
    },
    {
      field: "name",
      headerName: "Ad Soyad",
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          sx={{
            color: primaryColor,
            textDecoration: "underline",
            cursor: "pointer",
          }}
          // 🔹 Artık doğru ID ile hasta detayına gidiyor
          onClick={() =>
            handleOpenPatientCard(params.row.user_id || params.row.patient_id || params.row.id)
          }
        >
          {params.value}
        </Typography>
      ),
    },
    { field: "phone", headerName: "Numara", flex: 1 },
    { field: "about", headerName: "Hasta Açıklaması", flex: 2 },
  ];

  return (
    <Box sx={{ p: 4, bgcolor: "#f8faff", minHeight: "100vh" }}>
      <Typography variant="h5" sx={{ color: primaryColor, fontWeight: "bold", mb: 2 }}>
        Onay Bekleyen Hastalar
      </Typography>
      <Paper sx={{ p: 2, mb: 4 }}>
        <DataGrid
          rows={pendingPatients}
          columns={pendingColumns}
          getRowId={(row) => row.patient_id || row.id}
          autoHeight
          pageSizeOptions={[5, 10]}
          loading={loading}
          disableRowSelectionOnClick
        />
      </Paper>

      <Typography variant="h5" sx={{ color: primaryColor, fontWeight: "bold", mb: 2 }}>
        Hastalar
      </Typography>
      <Paper sx={{ p: 2 }}>
        <DataGrid
          rows={approvedPatients}
          columns={approvedColumns}
          getRowId={(row) => row.user_id || row.patient_id || row.id}
          autoHeight
          pageSizeOptions={[5, 10]}
          loading={loading}
          disableRowSelectionOnClick
        />
      </Paper>

      {/* 🧩 Hasta Kartı Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Hasta Bilgileri</DialogTitle>
        <DialogContent>
          {dialogLoading ? (
            <Stack alignItems="center" py={4}>
              <CircularProgress />
            </Stack>
          ) : selectedPatient ? (
            <Box sx={{ mt: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  src={selectedPatient.photoUrl || ""}
                  sx={{ width: 80, height: 80 }}
                />
                <Box>
                  <Typography variant="h6">{selectedPatient.name}</Typography>
                  <Typography color="text.secondary">{selectedPatient.email}</Typography>
                  <Typography color="text.secondary">{selectedPatient.phone}</Typography>
                </Box>
              </Stack>

              <Box sx={{ mt: 3 }}>
                <Typography>
                  <b>Cinsiyet:</b> {selectedPatient.gender || "Belirtilmemiş"}
                </Typography>
                <Typography>
                  <b>Kronik Hastalıklar:</b> {selectedPatient.chronic_diseases || "Belirtilmemiş"}
                </Typography>
                <Typography>
                  <b>Açıklama:</b> {selectedPatient.about || "Yok"}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Typography>Hasta bilgisi bulunamadı.</Typography>
          )}
        </DialogContent>
      </Dialog>

      <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={() => setSnackbarOpen(false)}>
        <Alert severity="info" sx={{ width: "100%" }}>
          {message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PatientModule;
