"use client";
import React, { useState, useMemo } from "react";
import {
  Box, Button, Card, Typography, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Stack, Chip, InputAdornment, Avatar,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import BiotechIcon from "@mui/icons-material/Biotech";
import PeopleIcon from "@mui/icons-material/People";
import { MrScan } from "@/types/MrScan";

interface Props {
  scans: MrScan[];
  onViewDetail: (patientId: number, patientName: string) => void;
}

interface PatientRow {
  patientId:   number;
  patientName: string;
  scanCount:   number;
  latestScan:  MrScan;
  hasUnread:   boolean;
}

const DoctorMrTable: React.FC<Props> = ({ scans, onViewDetail }) => {
  const [search, setSortSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const patients: PatientRow[] = useMemo(() => {
    const map = new Map<number, PatientRow>();

    scans.forEach((scan) => {
      const existing = map.get(scan.patient_id);
      const isNewer  = !existing || new Date(scan.upload_date) > new Date(existing.latestScan.upload_date);
      map.set(scan.patient_id, {
        patientId:   scan.patient_id,
        patientName: scan.patient?.name || `Hasta #${scan.patient_id}`,
        scanCount:   (existing?.scanCount || 0) + 1,
        latestScan:  isNewer ? scan : existing!.latestScan,
        hasUnread:   existing?.hasUnread || (scan.status === "done" && !scan.viewed_by_doctor),
      });
    });

    let arr = Array.from(map.values()).filter((p) =>
      p.patientName.toLowerCase().includes(search.toLowerCase())
    );

    arr.sort((a, b) => {
      const da = new Date(a.latestScan.upload_date).getTime();
      const db = new Date(b.latestScan.upload_date).getTime();
      return sortOrder === "desc" ? db - da : da - db;
    });

    return arr;
  }, [scans, search, sortOrder]);

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto" }}>
      {/* Başlık */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#0a2d57">MR Analizi</Typography>
          <Typography variant="body2" color="text.secondary">
            Hastalarınıza ait MR görüntü analiz sonuçları
          </Typography>
        </Box>
        <Chip
          icon={<PeopleIcon fontSize="small" />}
          label={`${patients.length} hasta`}
          sx={{ bgcolor: "#ede7f6", color: "#6a1b9a", fontWeight: 600 }}
        />
      </Box>

      {/* Filtre */}
      <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2, p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            size="small" fullWidth placeholder="Hasta adı ile ara..."
            value={search} onChange={(e) => setSortSearch(e.target.value)}
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
            sx={{ minWidth: 200 }}
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
            <MenuItem value="desc">Yeniden Eskiye</MenuItem>
            <MenuItem value="asc">Eskiden Yeniye</MenuItem>
          </TextField>
        </Stack>
      </Card>

      {/* Tablo */}
      <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2, overflow: "hidden" }}>
        {patients.length === 0 ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <BiotechIcon sx={{ fontSize: 40, color: "#d0d7e3", mb: 1 }} />
            <Typography color="text.secondary">MR kaydı bulunan hasta yok.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f8faff" }}>
                  <TableCell sx={{ width: 52, borderColor: "#e8edf5" }} />
                  <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5" }}>Ad Soyad</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5" }}>MR Sayısı</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5" }}>Son Yükleme</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5" }}>Son Durum</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5" }}>Son Sonuç</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5", width: 100 }}>İşlem</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {patients.map((p) => (
                  <TableRow key={p.patientId} sx={{ "&:hover": { bgcolor: "#f0f6ff" } }}>
                    <TableCell sx={{ borderColor: "#f0f4fa", py: 1 }}>
                      <Avatar sx={{ width: 34, height: 34, bgcolor: "#ede7f6", color: "#6a1b9a", fontSize: 14, fontWeight: 700 }}>
                        {p.patientName.charAt(0).toUpperCase()}
                      </Avatar>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500, color: "#1a2e4a", borderColor: "#f0f4fa" }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {p.patientName}
                        {p.hasUnread && (
                          <Chip label="Yeni" size="small"
                            sx={{ bgcolor: "#fff3e0", color: "#e65100", fontWeight: 600, fontSize: 10 }} />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ borderColor: "#f0f4fa" }}>
                      <Chip label={`${p.scanCount} görüntü`} size="small"
                        sx={{ bgcolor: "#f3f4f6", color: "#555", fontWeight: 500, fontSize: 12 }} />
                    </TableCell>
                    <TableCell sx={{ color: "#6b7a90", borderColor: "#f0f4fa" }}>
                      {new Date(p.latestScan.upload_date).toLocaleDateString("tr-TR")}
                    </TableCell>
                    <TableCell sx={{ borderColor: "#f0f4fa" }}>
                      {p.latestScan.status === "done" ? (
                        <Chip label="Tamamlandı" size="small"
                          sx={{ bgcolor: "#e8f5e9", color: "#2e7d32", fontWeight: 600, fontSize: 11 }} />
                      ) : p.latestScan.status === "pending" ? (
                        <Chip label="İşleniyor" size="small"
                          sx={{ bgcolor: "#fff3e0", color: "#e65100", fontWeight: 600, fontSize: 11 }} />
                      ) : (
                        <Chip label="Hata" size="small"
                          sx={{ bgcolor: "#ffebee", color: "#c62828", fontWeight: 600, fontSize: 11 }} />
                      )}
                    </TableCell>
                    <TableCell sx={{ borderColor: "#f0f4fa" }}>
                      {p.latestScan.status === "done" ? (
                        <Chip
                          label={p.latestScan.lesion_detected ? "⚠ Lezyon Var" : "✓ Normal"} size="small"
                          sx={{
                            bgcolor: p.latestScan.lesion_detected ? "#fff3e0" : "#e8f5e9",
                            color:   p.latestScan.lesion_detected ? "#e65100"  : "#2e7d32",
                            fontWeight: 600, fontSize: 11,
                          }}
                        />
                      ) : "—"}
                    </TableCell>
                    <TableCell sx={{ borderColor: "#f0f4fa" }}>
                      <Button
                        variant="outlined" size="small"
                        onClick={() => onViewDetail(p.patientId, p.patientName)}
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

export default DoctorMrTable;
