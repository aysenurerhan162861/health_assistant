"use client";
import React, { useState, useMemo } from "react";
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, TextField, Typography, MenuItem, Select,
  SelectChangeEvent, FormControl, InputLabel, Chip,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { MrScan } from "@/types/MrScan";
import GradCamViewer from "./GradCamViewer";

interface Props {
  scans: MrScan[];
  onViewDetail: (patientId: number, patientName: string) => void;
}

interface PatientRow {
  patientId: number;
  patientName: string;
  scanCount: number;
  latestScan: MrScan;
  hasUnread: boolean;
}

const DoctorMrTable: React.FC<Props> = ({ scans, onViewDetail }) => {
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const patients: PatientRow[] = useMemo(() => {
    const map = new Map<number, PatientRow>();

    scans.forEach((scan) => {
      const existing = map.get(scan.patient_id);
      const isNewer = !existing || new Date(scan.upload_date) > new Date(existing.latestScan.upload_date);

      map.set(scan.patient_id, {
        patientId: scan.patient_id,
        patientName: scan.patient?.name || `Hasta #${scan.patient_id}`,
        scanCount: (existing?.scanCount || 0) + 1,
        latestScan: isNewer ? scan : existing!.latestScan,
        hasUnread: existing?.hasUnread || (scan.status === "done" && !scan.viewed_by_doctor),
      });
    });

    let arr = Array.from(map.values());

    arr = arr.filter((p) =>
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
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Hastalar
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mb: 2 }}>
        <TextField
          label="Hasta Ara"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Sıralama</InputLabel>
          <Select
            value={sortOrder}
            label="Sıralama"
            onChange={(e: SelectChangeEvent) => setSortOrder(e.target.value as "asc" | "desc")}
          >
            <MenuItem value="desc">Yeniden Eskiye</MenuItem>
            <MenuItem value="asc">Eskiden Yeniye</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f0f0f0" }}>
              <TableCell><strong>Hasta</strong></TableCell>
              <TableCell><strong>MR Sayısı</strong></TableCell>
              <TableCell><strong>Son Yükleme</strong></TableCell>
              <TableCell><strong>Son Durum</strong></TableCell>
              <TableCell><strong>Son Sonuç</strong></TableCell>
              <TableCell><strong>Detay</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {patients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  Henüz MR görüntüsü bulunmuyor.
                </TableCell>
              </TableRow>
            ) : (
              patients.map((p) => (
                <TableRow key={p.patientId}
                  sx={{ backgroundColor: p.hasUnread ? "#fff8e1" : "white" }}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {p.patientName}
                      {p.hasUnread && (
                        <Box sx={{ width: 8, height: 8, bgcolor: "#f44336", borderRadius: "50%" }} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{p.scanCount}</TableCell>
                  <TableCell>{new Date(p.latestScan.upload_date).toLocaleDateString("tr-TR")}</TableCell>
                  <TableCell>
                    <Chip size="small"
                      label={p.latestScan.status === "done" ? "Tamamlandı" : p.latestScan.status === "pending" ? "İşleniyor" : "Hata"}
                      color={p.latestScan.status === "done" ? "success" : p.latestScan.status === "pending" ? "warning" : "error"}
                    />
                  </TableCell>
                  <TableCell>
                    {p.latestScan.status === "done" ? (
                      p.latestScan.lesion_detected
                        ? <WarningAmberIcon sx={{ color: "#ff9800", fontSize: 20 }} />
                        : <CheckCircleIcon sx={{ color: "#4caf50", fontSize: 20 }} />
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    <Button variant="outlined" size="small"
                      onClick={() => onViewDetail(p.patientId, p.patientName)}>
                      Detay
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default DoctorMrTable;