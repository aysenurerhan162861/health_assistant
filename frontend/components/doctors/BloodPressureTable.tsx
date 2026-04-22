"use client";

import React, { useState, useMemo } from "react";
import {
  Box, Button, Card, Typography, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Stack, Chip, InputAdornment, Avatar,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import PeopleIcon from "@mui/icons-material/People";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import { BloodPressureTracking } from "@/types/BloodPressure";
import { User } from "@/types/user";

interface BloodPressureTableProps {
  trackings: (BloodPressureTracking & { patient?: User })[];
  onViewDetail: (tracking: BloodPressureTracking & { patient?: User }) => void;
  userRole: "doctor" | "patient" | "assistant";
}

interface PatientRow {
  patientId: number;
  firstTracking: BloodPressureTracking & { patient?: User };
  fullName: string;
  trackingCount: number;
  completedCount: number;
  latestDate: string;
}

const BloodPressureTable: React.FC<BloodPressureTableProps> = ({ trackings, onViewDetail }) => {
  const [search, setSearch]       = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const patients: PatientRow[] = useMemo(() => {
    const map = new Map<number, { list: (BloodPressureTracking & { patient?: User })[]; first: BloodPressureTracking & { patient?: User } }>();

    trackings.forEach((t: any) => {
      if (!t.patient) return;
      if (!map.has(t.patient.id)) map.set(t.patient.id, { list: [], first: t });
      map.get(t.patient.id)!.list.push(t);
    });

    let arr: PatientRow[] = Array.from(map.entries()).map(([id, { list, first }]) => {
      const dates = list.map((t) => new Date(t.date).getTime());
      const latest = Math.max(...dates);
      return {
        patientId: id,
        firstTracking: first,
        fullName: (first as any).patient?.name || "—",
        trackingCount: list.length,
        completedCount: list.filter((t) => t.is_completed === "tamamlandı").length,
        latestDate: latest ? new Date(latest).toLocaleDateString("tr-TR") : "—",
      };
    });

    if (search) {
      const lower = search.toLowerCase();
      arr = arr.filter((p) => p.fullName.toLowerCase().includes(lower));
    }

    arr.sort((a, b) =>
      sortOrder === "asc"
        ? a.fullName.localeCompare(b.fullName, "tr")
        : b.fullName.localeCompare(a.fullName, "tr")
    );

    return arr;
  }, [trackings, search, sortOrder]);

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto" }}>
      {/* Başlık */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#0a2d57"></Typography>
          <Typography variant="body2" color="text.secondary">
            Hastalarınıza ait tansiyon ölçüm kayıtları
          </Typography>
        </Box>
        <Chip
          icon={<PeopleIcon fontSize="small" />}
          label={`${patients.length} hasta`}
          sx={{ bgcolor: "#fce4ec", color: "#c62828", fontWeight: 600 }}
        />
      </Box>

      {/* Filtre */}
      <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2, p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            size="small" fullWidth placeholder="Hasta adı ile ara..."
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
          <TextField
            select size="small" value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
            sx={{ minWidth: 180 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterListIcon fontSize="small" sx={{ color: "#9aa5b4" }} />
                  </InputAdornment>
                ),
              },
            }}
          >
            <MenuItem value="asc">A → Z</MenuItem>
            <MenuItem value="desc">Z → A</MenuItem>
          </TextField>
        </Stack>
      </Card>

      {/* Tablo */}
      <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2, overflow: "hidden" }}>
        {patients.length === 0 ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <MonitorHeartIcon sx={{ fontSize: 40, color: "#d0d7e3", mb: 1 }} />
            <Typography color="text.secondary">Tansiyon kaydı bulunan hasta yok.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f8faff" }}>
                  <TableCell sx={{ width: 52, borderColor: "#e8edf5" }} />
                  <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5" }}>Ad Soyad</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5" }}>Kayıt Sayısı</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5" }}>Tamamlanan</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5" }}>Son Kayıt</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5", width: 100 }}>İşlem</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {patients.map((p) => (
                  <TableRow key={p.patientId} sx={{ "&:hover": { bgcolor: "#f0f6ff" } }}>
                    <TableCell sx={{ borderColor: "#f0f4fa", py: 1 }}>
                      <Avatar sx={{ width: 34, height: 34, bgcolor: "#fce4ec", color: "#c62828", fontSize: 14, fontWeight: 700 }}>
                        {p.fullName.charAt(0).toUpperCase()}
                      </Avatar>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500, color: "#1a2e4a", borderColor: "#f0f4fa" }}>
                      {p.fullName}
                    </TableCell>
                    <TableCell sx={{ borderColor: "#f0f4fa" }}>
                      <Chip label={`${p.trackingCount} kayıt`} size="small"
                        sx={{ bgcolor: "#f3f4f6", color: "#555", fontWeight: 500, fontSize: 12 }} />
                    </TableCell>
                    <TableCell sx={{ borderColor: "#f0f4fa" }}>
                      <Chip
                        label={`${p.completedCount} tamamlandı`} size="small"
                        sx={{
                          bgcolor: p.completedCount > 0 ? "#e8f5e9" : "#f3f4f6",
                          color: p.completedCount > 0 ? "#2e7d32" : "#9aa5b4",
                          fontWeight: 500, fontSize: 12,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: "#6b7a90", borderColor: "#f0f4fa" }}>
                      {p.latestDate}
                    </TableCell>
                    <TableCell sx={{ borderColor: "#f0f4fa" }}>
                      <Button
                        variant="outlined" size="small"
                        onClick={() => onViewDetail(p.firstTracking)}
                        sx={{ borderColor: "#0a2d57", color: "#0a2d57", fontSize: 12,
                          "&:hover": { bgcolor: "#e3f0ff" } }}
                      >
                        Detay
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Box>
  );
};

export default BloodPressureTable;
