"use client";

import React, { useState, useMemo } from "react";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Typography,
  MenuItem,
  Select,
  SelectChangeEvent,
  FormControl,
  InputLabel,
} from "@mui/material";
import { BloodPressureTracking } from "@/types/BloodPressure";
import { User } from "@/types/user";

interface BloodPressureTableProps {
  trackings: (BloodPressureTracking & { patient?: User })[];
  onViewDetail: (tracking: BloodPressureTracking & { patient?: User }) => void;
  userRole: "doctor" | "patient";
}

interface PatientRow {
  patientId: number;
  firstTracking: BloodPressureTracking & { patient?: User };
  firstName: string;
  lastName: string;
  age: number | null;
  gender: string | null;
  patientNote: string;
}

const BloodPressureTable: React.FC<BloodPressureTableProps> = ({
  trackings,
  onViewDetail,
  userRole,
}) => {
  const [fileSearch, setFileSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Aynı hastaları gruplama
  const patients: PatientRow[] = useMemo(() => {
    const map = new Map<number, PatientRow>();

    trackings.forEach((tracking: any) => {
      if (tracking.patient && !map.has(tracking.patient.id)) {
        const [firstName, ...lastNameParts] = tracking.patient.name.split(" ");
        map.set(tracking.patient.id, {
          patientId: tracking.patient.id,
          firstTracking: tracking,
          firstName: firstName || "-",
          lastName: lastNameParts.join(" ") || " ",
          age: tracking.patient.age || null,
          gender: tracking.patient.gender || null,
          patientNote: tracking.patient.note || "",
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
  }, [trackings, fileSearch, sortOrder]);

  const handleViewDetail = (patient: PatientRow) => {
    onViewDetail(patient.firstTracking);
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
            <MenuItem value="asc">A'dan Z'ye</MenuItem>
            <MenuItem value="desc">Z'den A'ya</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Hasta Adı Soyadı</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Yaş</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Cinsiyet</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Açıklama</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Detay</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {patients.map((p) => (
              <TableRow key={p.patientId} hover>
                <TableCell>{`${p.firstName} ${p.lastName}`}</TableCell>
                <TableCell>{p.age || "-"}</TableCell>
                <TableCell>{p.gender || "-"}</TableCell>
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
                  <Button variant="outlined" size="small" onClick={() => handleViewDetail(p)}>
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

export default BloodPressureTable;

