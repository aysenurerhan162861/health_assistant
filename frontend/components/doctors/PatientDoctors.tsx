"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Box, Card, Typography, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, MenuItem, TextField,
  Stack, Chip, CircularProgress, InputAdornment,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import { getDoctors, requestDoctor, getMyDoctors, deleteDoctor } from "../../services/PatientApi";
import { User } from "../../types/Staff";
import ChatWindow from "@/components/message/ChatWindow";

interface MyDoctor extends User {
  status: "bekliyor" | "onaylandı" | "reddedildi";
  note?: string;
}

interface PatientDoctorsProps {
  openDoctorId?: number;
}

const statusConfig = {
  onaylandı:  { label: "Onaylı",    bgcolor: "#e8f5e9", color: "#2e7d32" },
  reddedildi: { label: "Reddedildi", bgcolor: "#ffebee", color: "#c62828" },
  bekliyor:   { label: "Bekliyor",   bgcolor: "#fff3e0", color: "#e65100" },
};

const PatientDoctors: React.FC<PatientDoctorsProps> = ({ openDoctorId }) => {
  const [allDoctors, setAllDoctors]       = useState<User[]>([]);
  const [myDoctors, setMyDoctors]         = useState<MyDoctor[]>([]);
  const [open, setOpen]                   = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<number | "">("");
  const [loading, setLoading]             = useState(false);
  const [search, setSearch]               = useState("");
  const [chatOpen, setChatOpen]           = useState(false);
  const [currentDoctor, setCurrentDoctor] = useState<MyDoctor | null>(null);
  const [patientId, setPatientId]         = useState<number>(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const u = JSON.parse(localStorage.getItem("user") || "{}");
        setPatientId(Number(u.id) || 0);
      } catch { /* ignore */ }
    }
  }, []);

  const fetchData = async () => {
    try {
      const [doctors, myDocs] = await Promise.all([getDoctors(), getMyDoctors()]);
      setAllDoctors(doctors || []);
      setMyDoctors(myDocs || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (openDoctorId && myDoctors.length > 0) {
      const doctor = myDoctors.find((d) => d.id === openDoctorId);
      if (doctor) { setCurrentDoctor(doctor); setChatOpen(true); }
    }
  }, [openDoctorId, myDoctors]);

  const handleRequestDoctor = async () => {
    if (!selectedDoctor || typeof selectedDoctor !== "number") return;
    setLoading(true);
    try {
      await requestDoctor({ doctor_id: selectedDoctor, note: "" });
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
    try { await deleteDoctor(id); await fetchData(); }
    catch (err) { console.error(err); }
  };

  const filteredRows = useMemo(() =>
    myDoctors
      .filter((doc) => !search ||
        doc.name?.toLowerCase().includes(search.toLowerCase()) ||
        doc.email?.toLowerCase().includes(search.toLowerCase())
      )
      .map((doc) => ({ id: doc.id, name: doc.name || "—", email: doc.email || "—", status: doc.status })),
    [search, myDoctors]
  );

  const columns: GridColDef[] = [
    { field: "name",  headerName: "Ad Soyad", flex: 1.2, minWidth: 140 },
    { field: "email", headerName: "E-posta",  flex: 1.5, minWidth: 160 },
    {
      field: "status", headerName: "Durum", flex: 0.8, minWidth: 110,
      renderCell: (p) => {
        const cfg = statusConfig[p.value as keyof typeof statusConfig] ?? statusConfig.bekliyor;
        return <Chip label={cfg.label} size="small" sx={{ bgcolor: cfg.bgcolor, color: cfg.color, fontWeight: 600 }} />;
      },
    },
    {
      field: "actions", headerName: "İşlemler", flex: 1, minWidth: 160, sortable: false,
      renderCell: (p) => (
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined" size="small" color="error"
            onClick={() => handleDeleteDoctor(p.row.id)}
            sx={{ fontSize: 12 }}
          >
            Kaldır
          </Button>
          <Button
            variant="outlined" size="small"
            onClick={() => {
              const doc = myDoctors.find((d) => d.id === p.row.id);
              if (doc) { setCurrentDoctor(doc); setChatOpen(true); }
            }}
            sx={{ borderColor: "#0a2d57", color: "#0a2d57", fontSize: 12,
              "&:hover": { bgcolor: "#e3f0ff" } }}
          >
            Mesaj
          </Button>
        </Stack>
      ),
    },
  ];

  if (!allDoctors.length && !myDoctors.length) {
    return <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto" }}>
      {/* Başlık */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#0a2d57">Doktorlarım</Typography>
          <Typography variant="body2" color="text.secondary">
            Bağlı olduğunuz doktorlar ve talep durumları
          </Typography>
        </Box>
        <Button
          variant="contained" startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
          sx={{ bgcolor: "#0a2d57", "&:hover": { bgcolor: "#071d3c" }, borderRadius: 2 }}
        >
          Yeni Doktor Talebi
        </Button>
      </Box>

      {/* Filtre */}
      <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2, p: 2, mb: 2 }}>
        <TextField
          size="small" fullWidth placeholder="Doktor adı veya e-posta ile ara..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: "#9aa5b4" }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Card>

      {/* Tablo */}
      <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2 }}>
        <DataGrid
          rows={filteredRows}
          columns={columns}
          getRowId={(row) => row.id}
          pageSizeOptions={[10, 25]}
          disableRowSelectionOnClick
          sx={{
            border: "none",
            "& .MuiDataGrid-columnHeaders": { bgcolor: "#f8faff", color: "#0a2d57", fontWeight: 700 },
            "& .MuiDataGrid-row:hover": { bgcolor: "#f0f6ff" },
            "& .MuiDataGrid-cell": { borderColor: "#f0f4fa" },
          }}
        />
      </Card>

      {/* Yeni Doktor Talebi */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm"
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, borderBottom: "1px solid #e8edf5" }}>
          <LocalHospitalIcon sx={{ color: "#0a2d57" }} />
          <Typography fontWeight={700} color="#0a2d57">Yeni Doktor Talebi</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            select label="Doktor Seç" value={selectedDoctor} fullWidth
            onChange={(e) => setSelectedDoctor(Number(e.target.value))}
          >
            {allDoctors.map((doc) => (
              <MenuItem key={doc.id} value={doc.id}>
                {doc.name} — {doc.email}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: "#6b7a90" }}>İptal</Button>
          <Button
            onClick={handleRequestDoctor} variant="contained"
            disabled={!selectedDoctor || loading}
            sx={{ bgcolor: "#0a2d57", "&:hover": { bgcolor: "#071d3c" } }}
          >
            {loading ? "Gönderiliyor..." : "Talep Gönder"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mesajlaşma */}
      <Dialog open={chatOpen} onClose={() => setChatOpen(false)} fullWidth maxWidth="sm"
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
        <DialogTitle sx={{ borderBottom: "1px solid #e8edf5" }}>
          <Typography fontWeight={700} color="#0a2d57">{currentDoctor?.name} ile Mesajlaşma</Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {currentDoctor && (
            <ChatWindow
              room={`chat_${Math.min(patientId, currentDoctor.id)}_${Math.max(patientId, currentDoctor.id)}`}
              senderId={patientId} receiverId={currentDoctor.id} role="patient"
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setChatOpen(false)} sx={{ color: "#6b7a90" }}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PatientDoctors;
