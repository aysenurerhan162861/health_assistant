// src/components/assistant/AssistantPatients.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Avatar,
  TextField,
  MenuItem,
  Stack,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import axios from "axios";

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
  const [filterType, setFilterType] = useState("all"); // 🔹 yeni eklendi
  const [loading, setLoading] = useState(false);

  const primaryColor = "#0a2d57";

  // Giriş yapan kullanıcı (asistan)
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

  // 🔍 Filtreleme (alan seçimine göre)
  const filteredPatients = useMemo(() => {
    if (!filter) return rows;
    const lowerFilter = filter.toLowerCase();

    return rows.filter((p) => {
      switch (filterType) {
        case "name":
          return p.name?.toLowerCase().includes(lowerFilter);
        case "email":
          return p.email?.toLowerCase().includes(lowerFilter);
        case "phone":
          return p.phone?.toLowerCase().includes(lowerFilter);
        case "status":
          return p.status?.toLowerCase().includes(lowerFilter);
        default: // "all"
          return (
            p.name?.toLowerCase().includes(lowerFilter) ||
            p.email?.toLowerCase().includes(lowerFilter) ||
            p.phone?.toLowerCase().includes(lowerFilter) ||
            p.status?.toLowerCase().includes(lowerFilter)
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
  ];

  return (
    <Box sx={{ p: 4, bgcolor: "#f8faff", minHeight: "100vh" }}>
      <Typography
        variant="h5"
        sx={{ color: primaryColor, fontWeight: "bold", mb: 2 }}
      >
        İzin Verilmiş Hastalar
      </Typography>

      {/* 🔽 Filtreleme alanı */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          select
          label="Filtre Türü"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          size="small"
          sx={{ width: "200px" }}
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
          sx={{
            "& .MuiDataGrid-columnHeader": { backgroundColor: "#e3f2fd" },
            "& .MuiDataGrid-cell": { outline: "none !important" },
          }}
        />
      </Paper>
    </Box>
  );
};

export default AssistantPatients;
