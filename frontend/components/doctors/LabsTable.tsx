"use client";

import React, { useState, useMemo } from "react";
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TextField, Typography, MenuItem, Select, SelectChangeEvent, FormControl, InputLabel
} from "@mui/material";
import { LabReport } from "@/types/LabReport";
import { markLabReportViewed } from "@/services/LabApi"; // burası rapor bazlı

interface LabsTableProps {
  labReports: LabReport[];
  onEditComment: (report: LabReport) => void;
  userRole: "doctor" | "patient";
}

const LabsTable: React.FC<LabsTableProps> = ({ labReports, onEditComment, userRole }) => {
  const [fileSearch, setFileSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const filteredReports = useMemo(() => {
    let filtered = labReports.filter(r =>
      r.file_name.toLowerCase().includes(fileSearch.toLowerCase()) ||
      r.patient.name.toLowerCase().includes(fileSearch.toLowerCase())
    );
    filtered.sort((a, b) => {
      const dateA = new Date(a.upload_date || "").getTime();
      const dateB = new Date(b.upload_date || "").getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
    return filtered;
  }, [labReports, fileSearch, sortOrder]);

  const handleViewDetail = async (report: LabReport) => {
    if (userRole === "doctor" && !report.viewed_by_doctor) {
      try {
        await markLabReportViewed(report.id); // sadece rapor bazlı
        report.viewed_by_doctor = true; // frontend anlık güncelleme
      } catch (err) {
        console.error("Lab raporu görüntülenme durumu kaydedilemedi", err);
      }
    }
    onEditComment(report);
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
        Hasta Tahlilleri
      </Typography>

      <Box mb={2} sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
        <TextField
          label="Hasta Adı veya Dosya Ara"
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
              setSortOrder(e.target.value as "desc" | "asc")
            }
          >
            <MenuItem value="desc">Yeniden Eskiye</MenuItem>
            <MenuItem value="asc">Eskiden Yeniye</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 120 }}>Tarih</TableCell>
              <TableCell sx={{ width: 150 }}>Hasta Adı</TableCell>
              <TableCell sx={{ width: 150 }}>Dosya</TableCell>
              <TableCell sx={{ width: 200 }}>Hasta Açıklaması</TableCell>
              <TableCell sx={{ width: 100 }}>Detay</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredReports.map((report) => {
              const isUnviewed =
                userRole === "doctor" && !report.viewed_by_doctor; // rapor bazlı

              return (
                <TableRow
                  key={report.id}
                  sx={{ backgroundColor: isUnviewed ? "#ffe5e5" : "inherit" }}
                >
                  <TableCell>
                    {report.upload_date ? new Date(report.upload_date).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell>{report.patient.name}</TableCell>
                  <TableCell>{report.file_name}</TableCell>
                  <TableCell>
                    <TextField
                      value={report.patient_note || ""}
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
                      onClick={() => handleViewDetail(report)}
                    >
                      Detay
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default LabsTable;
