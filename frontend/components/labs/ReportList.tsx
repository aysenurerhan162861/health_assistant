// components/labs/ReportListWithComment.tsx
"use client";

import React, { useState } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from "@mui/material";
import TestsTable from "./TestsTable";
import HealthComment from "./HealthComment";
import axios from "axios";
import { LabReport } from "@/types/LabReport";
import { TestResult } from "@/services/GeminiApi";

interface ReportListProps {
  reports: LabReport[];
  patientId: number;
  refreshReports: () => void;
}

const ReportList: React.FC<ReportListProps> = ({ reports, patientId, refreshReports }) => {
  const [selectedReport, setSelectedReport] = useState<LabReport | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Yorum Modal state
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentTestResults, setCommentTestResults] = useState<TestResult[] | null>(null);

  // Yeni Tahlil Modal state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handlePreview = (report: LabReport) => {
    setSelectedReport(report);
    setPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setSelectedReport(null);
  };

  const handleOpenComment = (report: LabReport) => {
    setSelectedReport(report);
    // Gemini API için TestResult array'i oluştur
    const mapped: TestResult[] = report.parsed_data.tests.map((t) => ({
      ...t,
      status: "normal", // normal, low, high olacak şekilde ihtiyaca göre düzenlenebilir
    }));
    setCommentTestResults(mapped);
    setCommentOpen(true); // modal açılıyor
  };

  const handleCloseComment = () => {
    setCommentOpen(false);
    setSelectedReport(null);
    setCommentTestResults(null);
  };

  const handleOpenUpload = () => setUploadOpen(true);
  const handleCloseUpload = () => {
    setUploadOpen(false);
    setSelectedFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(e.target.files?.[0] ?? null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("patient_id", String(patientId));

    try {
      setUploading(true);
      await axios.post("http://localhost:8000/api/lab_reports/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploading(false);
      handleCloseUpload();
      refreshReports(); // tabloyu yenile
    } catch (err) {
      console.error(err);
      alert("PDF yükleme başarısız!");
      setUploading(false);
    }
  };

  return (
    <Box>
      {/* ---------- Yeni Tahlil Ekle Butonu ---------- */}
      <Box mb={2}>
        <Button variant="contained" onClick={handleOpenUpload}>
          Yeni Tahlil Ekle
        </Button>
      </Box>

      {/* ---------- Tahliller Tablosu ---------- */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tarih</TableCell>
              <TableCell>Dosya</TableCell>
              <TableCell>Detay</TableCell>
              <TableCell>Yorum Al</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell>
                  {report.upload_date ? new Date(report.upload_date).toLocaleDateString() : "-"}
                </TableCell>
                <TableCell>{report.file_name}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handlePreview(report)}
                  >
                    Göster
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleOpenComment(report)}
                  >
                    Yorum Al
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ---------- PDF Önizleme Modal ---------- */}
      <Dialog open={previewOpen} onClose={handleClosePreview} maxWidth="md" fullWidth>
        <DialogTitle>PDF İçeriği / Test Detayları</DialogTitle>
        <DialogContent>
          {selectedReport ? (
            <TestsTable parsedData={selectedReport.parsed_data} />
          ) : (
            <Typography>Yükleniyor...</Typography>
          )}
        </DialogContent>
      </Dialog>

      {/* ---------- Yorum Modal ---------- */}
      <Dialog open={commentOpen} onClose={handleCloseComment} maxWidth="sm" fullWidth>
        <DialogTitle>Yapay Zeka Yorumu</DialogTitle>
        <DialogContent>
          {commentTestResults ? (
            <HealthComment testResults={commentTestResults} />
          ) : (
            <Typography>Yorum yükleniyor...</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseComment}>Kapat</Button>
        </DialogActions>
      </Dialog>

      {/* ---------- Yeni Tahlil Yükleme Modal ---------- */}
      <Dialog open={uploadOpen} onClose={handleCloseUpload} maxWidth="sm" fullWidth>
        <DialogTitle>Yeni Tahlil Yükle</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <input type="file" accept="application/pdf" onChange={handleFileChange} />
          {selectedFile && <Typography>Seçilen Dosya: {selectedFile.name}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUpload} disabled={uploading}>
            İptal
          </Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? "Yükleniyor..." : "Yükle"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReportList;
