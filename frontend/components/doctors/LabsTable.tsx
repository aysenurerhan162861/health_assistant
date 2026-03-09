"use client";

import React, { useState, useMemo } from "react";
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TextField, Typography, MenuItem, Select, SelectChangeEvent, FormControl, InputLabel
} from "@mui/material";
import { LabReport } from "@/types/LabReport";

interface LabsTableProps {
  labReports: LabReport[];
  onEditComment: (report: LabReport) => void;
  userRole: "doctor" | "patient" | "assistant";
}

interface PatientRow {
  patientId: number;
  firstReport: LabReport;
  firstName: string;
  lastName: string;
  patientNote: string;
}

const LabsTable: React.FC<LabsTableProps> = ({ labReports, onEditComment, userRole }) => {
  const [fileSearch, setFileSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Aynı hastaları gruplama
  const patients: PatientRow[] = useMemo(() => {
    const map = new Map<number, PatientRow>();

    labReports.forEach((report) => {
      if (!map.has(report.patient.id)) {
        const [firstName, ...lastNameParts] = report.patient.name.split(" ");
        map.set(report.patient.id, {
          patientId: report.patient.id,
          firstReport: report,
          firstName: firstName || "-",
          lastName: lastNameParts.join(" ") || "-",
          patientNote: report.patient_note || "",
        });
      }
    });

    let arr = Array.from(map.values());

    // Filtreleme
    arr = arr.filter((p) =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(fileSearch.toLowerCase())
    );

    // Sıralama
    arr.sort((a, b) => {
      const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
      const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
      return sortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });

    return arr;
  }, [labReports, fileSearch, sortOrder]);

  const handleViewDetail = (patient: PatientRow) => {
    onEditComment(patient.firstReport);
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
        Hastalar
      </Typography>

      <Box mb={2} sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
        <TextField
          label="Hasta Adı Ara"
          size="small"
          value={fileSearch}
          onChange={(e) => setFileSearch(e.target.value)}
        />

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Sıralama</InputLabel>
          <Select
            value={sortOrder}
            label="Sıralama"
            onChange={(e: SelectChangeEvent) =>
              setSortOrder(e.target.value as "asc" | "desc")
            }
          >
            <MenuItem value="asc">Yeniden Eskiye</MenuItem>
            <MenuItem value="desc">Eskiden Yeniye</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>İsim</TableCell>
              <TableCell>Soyisim</TableCell>
              <TableCell>Yaş</TableCell>
              <TableCell>Cinsiyet</TableCell>
              <TableCell>Açıklama</TableCell>
              <TableCell>Detay</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
  {patients.map((p) => (
    <TableRow key={p.patientId}>
      <TableCell>{p.firstName}</TableCell>
      <TableCell>{p.lastName}</TableCell>
      <TableCell>-</TableCell> {/* Yaş yok */}
      <TableCell>-</TableCell> {/* Cinsiyet yok */}
      <TableCell>
        <TextField
          value={p.patientNote}
          multiline
          minRows={2}
          fullWidth
          InputProps={{ readOnly: true }}
          variant="outlined"
          size="small"
        />
      </TableCell>
      <TableCell>
        <Button
          variant="outlined"
          size="small"
          onClick={() => handleViewDetail(p)}
        >
          Detay
        </Button>
      </TableCell>
    </TableRow>
  ))}
</TableBody>

        </Table>
      </TableContainer>
    </Box>
  );
};

export default LabsTable;
