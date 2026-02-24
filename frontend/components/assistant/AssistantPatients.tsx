import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Avatar,
  TextField,
  MenuItem,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import axios from "axios";

import PatientCardModal from "../patients/PatientCardContent";
import ChatWindow from "../message/ChatWindow";

interface Patient {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  status?: string;
  profile_image?: string | null;
}

const AssistantPatients: React.FC = () => {
  const [rows, setRows] = useState<Patient[]>([]);
  const [filter, setFilter] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [detailTab, setDetailTab] = useState(0);

  const primaryColor = "#0a2d57";

  // 🔹 giriş yapan asistan
  const assistantId =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")?.id
      : null;

  useEffect(() => {
    if (!assistantId) return;

    const fetchPatients = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `http://localhost:8000/api/assistants/${assistantId}/patients`
        );
        setRows(res.data);
      } catch (error) {
        console.error("Hastalar alınamadı:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [assistantId]);

  // 🔍 Filtreleme
  const filteredPatients = useMemo(() => {
    if (!filter) return rows;
    const lower = filter.toLowerCase();

    return rows.filter((p) => {
      switch (filterType) {
        case "name":
          return p.name?.toLowerCase().includes(lower);
        case "email":
          return p.email?.toLowerCase().includes(lower);
        case "phone":
          return p.phone?.toLowerCase().includes(lower);
        case "status":
          return p.status?.toLowerCase().includes(lower);
        default:
          return (
            p.name?.toLowerCase().includes(lower) ||
            p.email?.toLowerCase().includes(lower) ||
            p.phone?.toLowerCase().includes(lower) ||
            p.status?.toLowerCase().includes(lower)
          );
      }
    });
  }, [filter, filterType, rows]);

  const columns: GridColDef[] = [
    {
      field: "profile_image",
      headerName: "Fotoğraf",
      flex: 0.5,
      renderCell: (params) => <Avatar src={params.value || ""} />,
    },
    { field: "name", headerName: "Ad Soyad", flex: 1 },
    { field: "email", headerName: "E-posta", flex: 1 },
    { field: "phone", headerName: "Telefon", flex: 1 },
    { field: "status", headerName: "Durum", flex: 1 },
    {
      field: "detail",
      headerName: "Detay",
      flex: 1,
      renderCell: (params) => (
        <Button
          variant="contained"
          size="small"
          onClick={() => {
            setSelectedPatient(params.row);
            setDetailTab(0);
          }}
        >
          Detay
        </Button>
      ),
    },
  ];

  return (
    <Box sx={{ p: 4, bgcolor: "#f8faff", minHeight: "100vh" }}>
      <Typography
        variant="h5"
        sx={{ color: primaryColor, fontWeight: "bold", mb: 2 }}
      >
        İzin Verilmiş Hastalar
      </Typography>

      {/* 🔍 Filtre */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          select
          label="Filtre Türü"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          size="small"
          sx={{ width: 200 }}
        >
          <MenuItem value="all">Tümü</MenuItem>
          <MenuItem value="name">İsim</MenuItem>
          <MenuItem value="email">E-posta</MenuItem>
          <MenuItem value="phone">Telefon</MenuItem>
          <MenuItem value="status">Durum</MenuItem>
        </TextField>

        <TextField
          label="Ara..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          fullWidth
          size="small"
        />
      </Stack>

      <Paper sx={{ p: 2 }}>
        <DataGrid
          rows={filteredPatients}
          columns={columns}
          getRowId={(row) => row.id}
          autoHeight
          pageSizeOptions={[5, 10]}
          loading={loading}
          disableRowSelectionOnClick
        />
      </Paper>

      {/* 🔥 DETAY MODAL */}
      <Dialog
        open={!!selectedPatient}
        onClose={() => setSelectedPatient(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle
          sx={{ display: "flex", justifyContent: "space-between" }}
        >
          Hasta Detayı
          <Button onClick={() => setSelectedPatient(null)}>X</Button>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0 }}>
          <Tabs
            value={detailTab}
            onChange={(e, v) => setDetailTab(v)}
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab label="Kişisel Bilgiler" />
            <Tab label="Mesajlar" />
          </Tabs>

          <Box sx={{ p: 2 }}>
            {detailTab === 0 && selectedPatient && (
              <PatientCardModal patient={selectedPatient} />
            )}

            {detailTab === 1 &&
              selectedPatient &&
              assistantId &&
              typeof window !== "undefined" && (
                <ChatWindow
                  room={`chat_${Math.min(
                    assistantId,
                    selectedPatient.id
                  )}_${Math.max(assistantId, selectedPatient.id)}`}
                  senderId={assistantId}
                  receiverId={selectedPatient.id}
                  role="assistant"
                />
              )}
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default AssistantPatients;