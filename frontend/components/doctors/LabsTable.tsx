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
import { LabReport } from "@/types/LabReport";

interface LabsTableProps {
  labReports: LabReport[];
  onEditComment: (report: LabReport) => void;
  userRole: "doctor" | "patient" | "assistant";
}

interface PatientRow {
  patientId: number;
  firstReport: LabReport;
  fullName: string;
  reportCount: number;
  latestDate: string;
}

const LabsTable: React.FC<LabsTableProps> = ({ labReports, onEditComment }) => {
  const [search, setSearch]       = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const patients: PatientRow[] = useMemo(() => {
    const map = new Map<number, { reports: LabReport[]; firstReport: LabReport }>();

    labReports.forEach((report) => {
      if (!map.has(report.patient.id)) {
        map.set(report.patient.id, { reports: [], firstReport: report });
      }
      map.get(report.patient.id)!.reports.push(report);
    });

    let arr: PatientRow[] = Array.from(map.entries()).map(([id, { reports, firstReport }]) => {
      const dates = reports.map((r) => r.upload_date ? new Date(r.upload_date).getTime() : 0);
      const latest = Math.max(...dates);
      return {
        patientId: id,
        firstReport,
        fullName: firstReport.patient.name || "—",
        reportCount: reports.length,
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
  }, [labReports, search, sortOrder]);

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto" }}>
      {/* Başlık */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#0a2d57">Tahlil Sonuçları</Typography>
          <Typography variant="body2" color="text.secondary">
            Hastalarınıza ait tahlil raporları
          </Typography>
        </Box>
        <Chip
          icon={<PeopleIcon fontSize="small" />}
          label={`${patients.length} hasta`}
          sx={{ bgcolor: "#e3f0ff", color: "#1565c0", fontWeight: 600 }}
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
            <Typography color="text.secondary">Tahlil bulunan hasta yok.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f8faff" }}>
                  <TableCell sx={{ width: 52, borderColor: "#e8edf5" }} />
                  <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5" }}>Ad Soyad</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5" }}>Tahlil Sayısı</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5" }}>Son Yükleme</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5", width: 100 }}>İşlem</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {patients.map((p) => (
                  <TableRow key={p.patientId} sx={{ "&:hover": { bgcolor: "#f0f6ff" } }}>
                    <TableCell sx={{ borderColor: "#f0f4fa", py: 1 }}>
                      <Avatar sx={{ width: 34, height: 34, bgcolor: "#e3f0ff", color: "#1565c0", fontSize: 14, fontWeight: 700 }}>
                        {p.fullName.charAt(0).toUpperCase()}
                      </Avatar>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500, color: "#1a2e4a", borderColor: "#f0f4fa" }}>
                      {p.fullName}
                    </TableCell>
                    <TableCell sx={{ borderColor: "#f0f4fa" }}>
                      <Chip
                        label={`${p.reportCount} rapor`}
                        size="small"
                        sx={{ bgcolor: "#f3f4f6", color: "#555", fontWeight: 500, fontSize: 12 }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: "#6b7a90", borderColor: "#f0f4fa" }}>
                      {p.latestDate}
                    </TableCell>
                    <TableCell sx={{ borderColor: "#f0f4fa" }}>
                      <Button
                        variant="outlined" size="small"
                        onClick={() => onEditComment(p.firstReport)}
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

export default LabsTable;
