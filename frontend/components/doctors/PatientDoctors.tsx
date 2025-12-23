// components/doctors/PatientDoctors.tsx
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
  List,
  ListItem,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { getDoctors, requestDoctor, getMyDoctors, deleteDoctor } from "../../services/PatientApi";
import { User } from "../../types/Staff";
import ChatWindow from "@/components/message/ChatWindow";

interface MyDoctor extends User {
  status: "bekliyor" | "onaylandı" | "reddedildi";
  note?: string;
}

interface PatientDoctorsProps {
  openDoctorId?: number | undefined; // Bildirimden modal açmak için optional
}

const PatientDoctors: React.FC<PatientDoctorsProps> = ({ openDoctorId }) => {
  const [allDoctors, setAllDoctors] = useState<User[]>([]);
  const [myDoctors, setMyDoctors] = useState<MyDoctor[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [filterValue, setFilterValue] = useState("");
  const [filterBy, setFilterBy] = useState<"name" | "email" | "status">("name");
  const [chatOpen, setChatOpen] = useState(false);
  const [currentDoctor, setCurrentDoctor] = useState<MyDoctor | null>(null);
  const [patientId, setPatientId] = useState<number>(0);
  const primaryColor = "#0a2d57";

  // localStorage'dan hasta ID'sini al
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          setPatientId(Number(userObj.id) || 0);
        } catch (err) {
          console.error("user parse hatası:", err);
        }
      }
    }
  }, []);

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

  // Bildirimden gelen openDoctorId ile modal açma
  useEffect(() => {
    if (openDoctorId && myDoctors.length > 0) {
      const doctor = myDoctors.find((d) => d.id === openDoctorId);
      if (doctor) handleMessageDoctor(doctor);
    }
  }, [openDoctorId, myDoctors]);

  const handleRequestDoctor = async () => {
    if (!selectedDoctor || typeof selectedDoctor !== "number") {
      alert("Lütfen bir doktor seçin.");
      return;
    }
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
    try {
      await deleteDoctor(id);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMessageDoctor = (doctor: MyDoctor) => {
    setCurrentDoctor(doctor);
    setChatOpen(true);
  };

  const columns: GridColDef[] = [
    { field: "name", headerName: "Ad Soyad", flex: 1 },
    { field: "email", headerName: "E-posta", flex: 1 },
    {
      field: "status",
      headerName: "Durum",
      flex: 0.7,
      renderCell: (params) => {
        const value = params.value as MyDoctor["status"];
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
      flex: 0.7,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Button
            color="error"
            variant="outlined"
            size="small"
            onClick={() => handleDeleteDoctor(params.row.id)}
          >
            Sil
          </Button>
          <Button
            color="primary"
            variant="outlined"
            size="small"
            onClick={() =>
              handleMessageDoctor(
                myDoctors.find((d) => d.id === params.row.id)!
              )
            }
          >
            Mesaj
          </Button>
        </Stack>
      ),
    },
  ];

  const filteredRows = useMemo(() => {
    return myDoctors
      .filter((doc) => {
        if (!filterValue) return true;
        const val = filterValue.toLowerCase();
        if (filterBy === "name") return doc.name?.toLowerCase().includes(val);
        if (filterBy === "email") return doc.email?.toLowerCase().includes(val);
        if (filterBy === "status") return doc.status?.toLowerCase().includes(val);
        return true;
      })
      .map((doc) => ({
        id: doc.id,
        name: doc.name || "İsim yok",
        email: doc.email || "Email yok",
        status: doc.status,
      }));
  }, [filterValue, filterBy, myDoctors]);

  if (!allDoctors.length) return <CircularProgress />;

  return (
    <Box sx={{ p: 4, bgcolor: "#e6f0ff", minHeight: "90vh" }}>
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
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

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2} alignItems="center">
          <TextField
            select
            label="Filtreleme Türü"
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as "name" | "email" | "status")}
            size="small"
            sx={{ width: "auto", minWidth: 140 }}
          >
            <MenuItem value="name">İsim</MenuItem>
            <MenuItem value="email">Email</MenuItem>
            <MenuItem value="status">Durum</MenuItem>
          </TextField>
          <TextField
            label="Ara"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            fullWidth
            size="small"
            sx={{ flexGrow: 1 }}
          />
        </Stack>

        <div style={{ height: 450, width: "100%" }}>
          <DataGrid
            rows={filteredRows}
            columns={columns}
            getRowId={(row) => row.id}
            disableRowSelectionOnClick
            pageSizeOptions={[5, 10]}
          />
        </div>
      </Paper>

      {/* Yeni Doktor Talebi Dialog */}
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

     {/* Mesajlaşma Dialog */}
<Dialog open={chatOpen} onClose={() => setChatOpen(false)} fullWidth maxWidth="sm">
  <DialogTitle>{currentDoctor?.name} ile Mesajlaşma</DialogTitle>

  <DialogContent>
    {currentDoctor && (
      <ChatWindow
        room={`chat_${Math.min(patientId, currentDoctor.id)}_${Math.max(patientId, currentDoctor.id)}`}
        senderId={patientId}
        receiverId={currentDoctor.id}
        role="patient"
      />
    )}
  </DialogContent>

  <DialogActions>
    <Button onClick={() => setChatOpen(false)}>Kapat</Button>
  </DialogActions>
</Dialog>
    </Box>
  );
};

export default PatientDoctors;
