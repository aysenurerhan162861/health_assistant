// src/components/patient/PatientModule.tsx
import React, { useState, useEffect, useMemo } from "react";
import { Box, Paper, Typography, Button, Avatar, Stack, Snackbar, Alert, TextField, MenuItem } from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import {
  getPendingPatients,
  getApprovedPatients,
  approvePatient,
  rejectPatient,
} from "../../services/PatientApi";
import { User } from "../../types/Staff";

const PatientModule: React.FC = () => {
  const [pendingPatients, setPendingPatients] = useState<User[]>([]);
  const [approvedPatients, setApprovedPatients] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const [filterText, setFilterText] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>(["name", "email", "status"]);

  const primaryColor = "#0a2d57";
  const filterOptions = ["name", "email", "status"];

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

  // Filtrelenmiş sonuçlar
  const filteredPending = useMemo(() => {
    if (!filterText || selectedFilters.length === 0) return pendingPatients;
    return pendingPatients.filter((p) =>
      selectedFilters.some((field) =>
        ((p as any)[field] || "").toString().toLowerCase().includes(filterText.toLowerCase())
      )
    );
  }, [pendingPatients, filterText, selectedFilters]);

  const filteredApproved = useMemo(() => {
    if (!filterText || selectedFilters.length === 0) return approvedPatients;
    return approvedPatients.filter((p) =>
      selectedFilters.some((field) =>
        ((p as any)[field] || "").toString().toLowerCase().includes(filterText.toLowerCase())
      )
    );
  }, [approvedPatients, filterText, selectedFilters]);

  const pendingColumns: GridColDef[] = [
    { field: "photoUrl", headerName: "Fotoğraf", flex: 0.5, renderCell: (params: GridRenderCellParams) => <Avatar src={params.value} /> },
    { field: "name", headerName: "Ad Soyad", flex: 1 },
    { field: "phone", headerName: "Numara", flex: 1 },
    { field: "about", headerName: "Hasta Açıklaması", flex: 2 },
    {
      field: "actions",
      headerName: "İşlemler",
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" spacing={1}>
          <Button variant="contained" color="success" size="small" onClick={() => handleApprove(params.row.id)}>Onayla</Button>
          <Button variant="outlined" color="error" size="small" onClick={() => handleReject(params.row.id)}>Red</Button>
        </Stack>
      ),
    },
  ];

  const approvedColumns: GridColDef[] = [
    { field: "photoUrl", headerName: "Fotoğraf", flex: 0.5, renderCell: (params: GridRenderCellParams) => <Avatar src={params.value} /> },
    { field: "name", headerName: "Ad Soyad", flex: 1 },
    { field: "phone", headerName: "Numara", flex: 1 },
    { field: "about", headerName: "Hasta Açıklaması", flex: 2 },
  ];

  return (
    <Box sx={{ p: 4, bgcolor: "#f8faff", minHeight: "100vh" }}>
      {/* Filtreleme */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={3}>
        <TextField
          select
          label="Filtre Alanı"
          size="small"
          variant="outlined"
          value={selectedFilters[0]}
          onChange={(e) => setSelectedFilters([e.target.value])}
          sx={{ minWidth: 150 }}
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

      <Typography variant="h5" sx={{ color: primaryColor, fontWeight: "bold", mb: 2 }}>Onay Bekleyen Hastalar</Typography>
      <Paper sx={{ p: 2, mb: 4 }}>
        <DataGrid
          rows={filteredPending}
          columns={pendingColumns}
          getRowId={(row) => row.id}
          autoHeight
          pageSizeOptions={[5, 10]}
          loading={loading}
          disableRowSelectionOnClick
        />
      </Paper>

      <Typography variant="h5" sx={{ color: primaryColor, fontWeight: "bold", mb: 2 }}>Hastalar</Typography>
      <Paper sx={{ p: 2 }}>
        <DataGrid
          rows={filteredApproved}
          columns={approvedColumns}
          getRowId={(row) => row.id}
          autoHeight
          pageSizeOptions={[5, 10]}
          loading={loading}
          disableRowSelectionOnClick
        />
      </Paper>

      <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={() => setSnackbarOpen(false)}>
        <Alert severity="info" sx={{ width: "100%" }}>{message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default PatientModule;
