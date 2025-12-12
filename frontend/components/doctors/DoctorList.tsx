// components/patients/DoctorList.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  TextField,
  Stack,
  Chip,
  CircularProgress,
} from "@mui/material";
import { DataGrid, GridColDef, GridToolbar } from "@mui/x-data-grid";
import {
  getDoctors,
  requestDoctor,
  getMyDoctors,
  deleteDoctor,
} from "../../services/PatientApi";
import { User } from "../../types/Staff";

interface MyDoctor extends User {
  status: "bekliyor" | "onaylandı" | "reddedildi";
  note?: string;
}

const DoctorList: React.FC = () => {
  const [allDoctors, setAllDoctors] = useState<User[]>([]);
  const [myDoctors, setMyDoctors] = useState<MyDoctor[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const primaryColor = "#0a2d57";

  const fetchData = async () => {
  try {
    const doctors = await getDoctors();
    setAllDoctors(doctors || []);

    const myDocs = await getMyDoctors();
    setMyDoctors(myDocs || []);
  } catch (err) {
    console.error(err);
  }
};

  useEffect(() => {
    fetchData();
  }, []);

  const handleRequestDoctor = async () => {
    if (!selectedDoctor) return;
    setLoading(true);
    try {
      await requestDoctor({ doctor_id: selectedDoctor });
      setOpen(false);
      setSelectedDoctor("");
      await fetchData();
    } catch (err: any) {
      alert(err.message || "Talep gönderilemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDoctor = async (id: number) => {
    if (!window.confirm("Bu doktoru kaldırmak istiyor musunuz?")) return;
    try {
      await deleteDoctor(id);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert("Doktor silinemedi!");
    }
  };

  const columns: GridColDef[] = [
    { field: "name", headerName: "Ad Soyad", flex: 1 },
    { field: "email", headerName: "E-posta", flex: 1 },
    {
      field: "status",
      headerName: "Durum",
      flex: 0.7,
      renderCell: (params) => {
        const value = params.row.status;
        const color =
          value === "onaylandı"
            ? "success"
            : value === "reddedildi"
            ? "error"
            : "warning";
        const label =
          value === "onaylandı"
            ? "Onaylı"
            : value === "reddedildi"
            ? "Reddedildi"
            : "Bekliyor";
        return <Chip label={label} color={color} variant="outlined" />;
      },
    },
    {
      field: "actions",
      headerName: "İşlem",
      flex: 0.5,
      renderCell: (params) => (
        <Button
          color="error"
          variant="outlined"
          onClick={() => handleDeleteDoctor(params.row.id!)}
        >
          Sil
        </Button>
      ),
    },
  ];

  const rows = myDoctors.map((doc) => ({
    id: doc.id!,
    name: doc.name || "İsim yok",
    email: doc.email || "Email yok",
    status: doc.status,
  }));

  // Filtre uygulama
  const filteredDoctors = useMemo(() => {
    if (!filter) return rows;
    return rows.filter(
      (doc) =>
        doc.name.toLowerCase().includes(filter.toLowerCase()) ||
        doc.email.toLowerCase().includes(filter.toLowerCase()) ||
        doc.status.toLowerCase().includes(filter.toLowerCase())
    );
  }, [filter, rows]);

  if (!allDoctors.length) return <CircularProgress />;

  return (
    <Box sx={{ p: 4, bgcolor: "#e6f0ff", minHeight: "90vh" }}>
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6" sx={{ color: primaryColor, fontWeight: "bold" }}>
            Doktorlarım
          </Typography>
          <Button
            variant="contained"
            onClick={() => setOpen(true)}
            sx={{ bgcolor: primaryColor, "&:hover": { bgcolor: "#082147" } }}
          >
            Yeni Doktor Talebi
          </Button>
        </Stack>

        {/* Filtre */}
        <Box sx={{ mb: 2 }}>
          <TextField
            label="Ara (isim, email, durum)"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            fullWidth
            size="small"
          />
        </Box>

        <div style={{ height: 400, width: "100%" }}>
          <DataGrid
            rows={filteredDoctors}
            columns={columns}
            getRowId={(row) => row.id}
            disableRowSelectionOnClick
            pageSizeOptions={[5, 10]}
            slots={{ toolbar: GridToolbar }}
          />
        </div>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Yeni Doktor Talebi</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="Doktor Seç"
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(Number(e.target.value))}
            fullWidth
            sx={{ mt: 2 }}
          >
            {allDoctors.map((doc) => (
              <MenuItem key={doc.id} value={doc.id}>
                {doc.name} ({doc.email})
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>İptal</Button>
          <Button
            onClick={handleRequestDoctor}
            variant="contained"
            disabled={!selectedDoctor || loading}
            sx={{ bgcolor: primaryColor, "&:hover": { bgcolor: "#082147" } }}
          >
            {loading ? "Gönderiliyor..." : "Talep Gönder"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DoctorList;
