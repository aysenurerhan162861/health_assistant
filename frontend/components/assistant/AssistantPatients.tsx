import React, { useState, useEffect, useMemo } from "react";
import {
  Box, Card, Typography, Avatar, TextField, MenuItem,
  Stack, Button, Dialog, DialogTitle, DialogContent,
  Tabs, Tab, InputAdornment, Chip,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import PeopleIcon from "@mui/icons-material/People";
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
  photoUrl?: string | null;
}

const AssistantPatients: React.FC = () => {
  const [rows, setRows]                       = useState<Patient[]>([]);
  const [filter, setFilter]                   = useState("");
  const [filterType, setFilterType]           = useState("all");
  const [loading, setLoading]                 = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [detailTab, setDetailTab]             = useState(0);

  const assistantId =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")?.id
      : null;

  useEffect(() => {
    if (!assistantId) return;
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:8000/api/assistants/${assistantId}/patients`);
        setRows(res.data);
      } catch (err) {
        console.error("Hastalar alınamadı:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, [assistantId]);

  const filteredPatients = useMemo(() => {
    if (!filter) return rows;
    const lower = filter.toLowerCase();
    return rows.filter((p) => {
      switch (filterType) {
        case "name":   return p.name?.toLowerCase().includes(lower);
        case "email":  return p.email?.toLowerCase().includes(lower);
        case "phone":  return p.phone?.toLowerCase().includes(lower);
        case "status": return p.status?.toLowerCase().includes(lower);
        default:       return (
          p.name?.toLowerCase().includes(lower) ||
          p.email?.toLowerCase().includes(lower) ||
          p.phone?.toLowerCase().includes(lower)
        );
      }
    });
  }, [filter, filterType, rows]);

  const columns: GridColDef[] = [
    {
      field: "photoUrl", headerName: "", width: 60, sortable: false,
      renderCell: (p) => (
        <Avatar src={p.row.profile_image || p.row.photoUrl || ""} sx={{ width: 36, height: 36 }} />
      ),
    },
    { field: "name",  headerName: "Ad Soyad", flex: 1.2, minWidth: 140 },
    { field: "email", headerName: "E-posta",  flex: 1.5, minWidth: 160 },
    { field: "phone", headerName: "Telefon",  flex: 1,   minWidth: 120 },
    {
      field: "status", headerName: "Durum", flex: 0.8, minWidth: 100,
      renderCell: () => (
        <Chip
          label="Hastam" size="small"
          sx={{
            bgcolor: "#e8f5e9",
            color: "#2e7d32",
            fontWeight: 600, fontSize: 12,
          }}
        />
      ),
    },
    {
      field: "detail", headerName: "İşlem", flex: 0.7, minWidth: 90, sortable: false,
      renderCell: (p) => (
        <Button
          variant="outlined" size="small"
          onClick={() => { setSelectedPatient(p.row); setDetailTab(0); }}
          sx={{ borderColor: "#0a2d57", color: "#0a2d57", "&:hover": { bgcolor: "#e3f0ff" } }}
        >
          Detay
        </Button>
      ),
    },
  ];

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto" }}>
      {/* Başlık */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#0a2d57">Hastalarım</Typography>
          <Typography variant="body2" color="text.secondary">
            Erişim iznine sahip olduğunuz hastalar
          </Typography>
        </Box>
        <Chip
          icon={<PeopleIcon fontSize="small" />}
          label={`${filteredPatients.length} hasta`}
          sx={{ bgcolor: "#f3e5f5", color: "#6a1b9a", fontWeight: 600 }}
        />
      </Box>

      {/* Filtre */}
      <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2, p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            select size="small" value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            sx={{ minWidth: 150 }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><FilterListIcon fontSize="small" sx={{ color: "#9aa5b4" }} /></InputAdornment> } }}
          >
            <MenuItem value="all">Tümünde Ara</MenuItem>
            <MenuItem value="name">İsme Göre</MenuItem>
            <MenuItem value="email">E-postaya Göre</MenuItem>
            <MenuItem value="phone">Telefona Göre</MenuItem>
            <MenuItem value="status">Duruma Göre</MenuItem>
          </TextField>
          <TextField
            size="small" fullWidth placeholder="Ara..."
            value={filter} onChange={(e) => setFilter(e.target.value)}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: "#9aa5b4" }} /></InputAdornment> } }}
          />
        </Stack>
      </Card>

      {/* Tablo */}
      <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2 }}>
        <DataGrid
          rows={filteredPatients}
          columns={columns}
          getRowId={(row) => row.id}
          pageSizeOptions={[10, 25]}
          loading={loading}
          disableRowSelectionOnClick
          sx={{
            border: "none",
            "& .MuiDataGrid-columnHeaders": { bgcolor: "#f8faff", color: "#0a2d57", fontWeight: 700 },
            "& .MuiDataGrid-row:hover": { bgcolor: "#f8f0ff" },
            "& .MuiDataGrid-cell": { borderColor: "#f0f4fa" },
          }}
        />
      </Card>

      {/* Detay Modal */}
      <Dialog
        open={!!selectedPatient} onClose={() => setSelectedPatient(null)}
        fullWidth maxWidth="md"
        slotProps={{ paper: { sx: { borderRadius: 3, maxHeight: 620 } } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center",
          borderBottom: "1px solid #e8edf5", pb: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar src={selectedPatient?.profile_image || selectedPatient?.photoUrl || ""} sx={{ width: 36, height: 36 }} />
            <Box>
              <Typography fontWeight={700} color="#0a2d57">{selectedPatient?.name}</Typography>
              <Typography variant="caption" color="text.secondary">{selectedPatient?.email}</Typography>
            </Box>
          </Box>
          <Button size="small" onClick={() => setSelectedPatient(null)} sx={{ color: "#6b7a90" }}>Kapat</Button>
        </DialogTitle>

        <Tabs value={detailTab} onChange={(_, v) => setDetailTab(v)}
          sx={{ px: 3, borderBottom: "1px solid #e8edf5", bgcolor: "#fafbff" }}>
          <Tab label="Kişisel Bilgiler" />
          
        </Tabs>

        <DialogContent sx={{ p: 3 }}>
          {detailTab === 0 && selectedPatient && (
            <PatientCardModal patient={selectedPatient as any} />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default AssistantPatients;
