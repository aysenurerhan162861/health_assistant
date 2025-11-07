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
  Button,
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import {
  getPendingPatients,
  approvePatient,
  rejectPatient,
  getPatientById,
} from "../../services/PatientApi";
import { User } from "../../types/Staff";

const PendingPatients: React.FC = () => {
  const [patients, setPatients] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const primaryColor = "#0a2d57";

  // 🔹 Bekleyen hastaları çek
  const fetchPendingPatients = async () => {
    try {
      setLoading(true);
      const data = await getPendingPatients();
      setPatients(data);
    } catch (err: any) {
      setMessage(err.message || "Onay bekleyen hastalar alınamadı ❌");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPatients();
  }, []);

  // 🔹 Hasta detayını aç
  const handleOpenPatientCard = async (patientId: number) => {
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

  // 🔹 Onayla / Reddet işlemleri
  const handleAction = async (id: number, action: "approve" | "reject") => {
    try {
      setLoading(true);
      if (action === "approve") await approvePatient(id);
      else await rejectPatient(id);

      setMessage(
        action === "approve"
          ? "Hasta başarıyla onaylandı ✅"
          : "Hasta reddedildi ❌"
      );
      setSnackbarOpen(true);
      fetchPendingPatients();
    } catch (err: any) {
      setMessage(err.message || "İşlem başarısız oldu ❌");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
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
            handleOpenPatientCard(
              params.row.user_id || params.row.patient_id || params.row.id
            )
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
            onClick={(e) => {
              e.stopPropagation();
              handleAction(params.row.user_id || params.row.id, "approve");
            }}
          >
            Onayla
          </Button>
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleAction(params.row.user_id || params.row.id, "reject");
            }}
          >
            Reddet
          </Button>
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ p: 4, bgcolor: "#f8faff", minHeight: "100vh" }}>
      <Typography
        variant="h5"
        sx={{ color: primaryColor, fontWeight: "bold", mb: 2 }}
      >
        Onay Bekleyen Hastalar
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

export default PendingPatients;
