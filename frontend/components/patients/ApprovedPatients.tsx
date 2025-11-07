// src/components/patient/ApprovedPatients.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
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
import { getApprovedPatients, getPatientById } from "../../services/PatientApi";
import { User } from "../../types/Staff";

const ApprovedPatients: React.FC = () => {
  const [patients, setPatients] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);

  const primaryColor = "#0a2d57";

  // 🔹 Hastaları al
  const fetchPatients = async () => {
    try {
      setLoading(true);
      const approved = await getApprovedPatients();
      setPatients(approved);
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || "Onaylı hastalar alınamadı ❌");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // 🔹 Hasta detaylarını aç
  const handleOpenPatientCard = async (patientId: number) => {
    if (!patientId) return;

    try {
      setDialogLoading(true);
      setOpenDialog(true);
      const data = await getPatientById(patientId);
      setSelectedPatient(data);
    } catch (err: any) {
      setMessage(err.message || "Hasta bilgisi alınamadı ❌");
      setSnackbarOpen(true);
    } finally {
      setDialogLoading(false);
    }
  };

  const columns: GridColDef[] = [
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
      <Typography
        variant="h5"
        sx={{ color: primaryColor, fontWeight: "bold", mb: 2 }}
      >
        Onaylı Hastalar
      </Typography>

      <Paper sx={{ p: 2 }}>
        <DataGrid
          rows={patients}
          columns={columns}
          getRowId={(row) => row.user_id || row.patient_id || row.id}
          autoHeight
          pageSizeOptions={[5, 10]}
          loading={loading}
          disableRowSelectionOnClick
        />
      </Paper>

      {/* 🧩 Hasta Kartı */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth="sm"
      >
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
                  <Typography color="text.secondary">
                    {selectedPatient.email}
                  </Typography>
                  <Typography color="text.secondary">
                    {selectedPatient.phone}
                  </Typography>
                </Box>
              </Stack>

              <Box sx={{ mt: 3 }}>
                <Typography>
                  <b>Cinsiyet:</b> {selectedPatient.gender || "Belirtilmemiş"}
                </Typography>
                <Typography>
                  <b>Kronik Hastalıklar:</b>{" "}
                  {selectedPatient.chronic_diseases || "Belirtilmemiş"}
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

export default ApprovedPatients;
