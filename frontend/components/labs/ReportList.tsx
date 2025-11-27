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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  MenuItem,
} from "@mui/material";
import TestsTable from "./TestsTable";
import HealthComment from "./HealthComment";
import { LabReport } from "@/types/LabReport";
import { TestResult } from "@/services/GeminiApi";
import { updateLabReportComment } from "@/services/LabApi";
import axios from "axios";

interface ReportListProps {
  reports: LabReport[];
  patientId: number;
  refreshReports: () => void;
  userRole: "doctor" | "patient";
}

const ReportList: React.FC<ReportListProps> = ({ reports, patientId, refreshReports, userRole }) => {
  const [selectedReport, setSelectedReport] = useState<LabReport | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentTestResults, setCommentTestResults] = useState<TestResult[] | null>(null);

  // Upload Modal state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Filtre state
  const [filterType, setFilterType] = useState("file"); // "file" | "date"
  const [fileSearch, setFileSearch] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  // Yeni state: reports editable için
  const [editableReports, setEditableReports] = useState<LabReport[]>(reports);

  const filteredReports = useMemo(() => {
    return editableReports.filter((r) => {
      const uploadDate = r.upload_date ? new Date(r.upload_date) : null;

      if (filterType === "file" && fileSearch) {
        if (!r.file_name.toLowerCase().includes(fileSearch.toLowerCase())) return false;
      }

      if (filterType === "date") {
        if (dateStart && uploadDate && uploadDate < new Date(dateStart)) return false;
        if (dateEnd && uploadDate && uploadDate > new Date(dateEnd)) return false;
      }

      return true;
    });
  }, [editableReports, filterType, fileSearch, dateStart, dateEnd]);

  // PDF Önizleme
  const handlePreview = (report: LabReport) => {
    setSelectedReport(report);
    setPreviewOpen(true);
  };
  const handleClosePreview = () => {
    setPreviewOpen(false);
    setSelectedReport(null);
  };

  // Yorum + Doktor Açıklaması
  const handleOpenComment = (report: LabReport) => {
    setSelectedReport(report);
    const mapped: TestResult[] = report.parsed_data.tests.map((t) => ({ ...t, status: "normal" }));
    setCommentTestResults(mapped);
    setCommentOpen(true);
  };
  const handleCloseComment = () => {
    setCommentOpen(false);
    setSelectedReport(null);
    setCommentTestResults(null);
  };

  // Doktor açıklamasını tablo içinde değiştir
  const handleDoctorCommentChange = (reportId: number, value: string) => {
    setEditableReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, doctor_comment: value } : r))
    );
  };

  const handleSaveDoctorComment = async (reportId: number, comment: string) => {
    try {
      await updateLabReportComment(reportId, comment);
      refreshReports();
    } catch (err) {
      console.error(err);
      alert("Doktor açıklaması kaydedilemedi!");
    }
  };

  // Upload
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
      refreshReports();
    } catch (err) {
      console.error(err);
      alert("PDF yükleme başarısız!");
      setUploading(false);
    }
  };

  return (
    <Box>
      {/* Yeni Tahlil Ekle */}
      {userRole === "doctor" && (
        <Box mb={2}>
          <Button variant="contained" onClick={handleOpenUpload}>Yeni Tahlil Ekle</Button>
        </Box>
      )}

      {/* Filtre Paneli */}
      <Box sx={{ display: "flex", gap: 2, mb: 2, p: 1, border: "1px solid #ddd", borderRadius: "8px", alignItems: "center" }}>
        <TextField label="Filtre Türü" select size="small" value={filterType} onChange={(e) => setFilterType(e.target.value)} sx={{ width: 160 }}>
          <MenuItem value="file">Dosya Adı</MenuItem>
          <MenuItem value="date">Tarih</MenuItem>
        </TextField>
        {filterType === "file" && <TextField label="Ara" size="small" value={fileSearch} onChange={(e) => setFileSearch(e.target.value)} sx={{ width: 250 }} />}
        {filterType === "date" && (
          <>
            <TextField type="date" label="Başlangıç" size="small" value={dateStart} onChange={(e) => setDateStart(e.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField type="date" label="Bitiş" size="small" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} InputLabelProps={{ shrink: true }} />
          </>
        )}
      </Box>

      {/* Tahliller Tablosu */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tarih</TableCell>
              <TableCell>Dosya</TableCell>
              <TableCell>Detay</TableCell>
              <TableCell>Yapay Zeka Yorumu</TableCell>
              <TableCell>Doktor Açıklaması</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredReports.map((report) => (
              <TableRow key={report.id}>
                <TableCell>{report.upload_date ? new Date(report.upload_date).toLocaleDateString() : "-"}</TableCell>
                <TableCell>{report.file_name}</TableCell>
                <TableCell>
                  <Button variant="outlined" size="small" onClick={() => handlePreview(report)}>Göster</Button>
                </TableCell>
                <TableCell>
                  <Button variant="contained" size="small" onClick={() => handleOpenComment(report)}>Yorum Al</Button>
                </TableCell>
                <TableCell>
                  {userRole === "doctor" ? (
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <TextField
                        value={report.doctor_comment || ""}
                        onChange={(e) => handleDoctorCommentChange(report.id, e.target.value)}
                        multiline
                        minRows={2}
                        fullWidth
                        variant="outlined"
                      />
                      <Button
                        variant="contained"
                        onClick={() => handleSaveDoctorComment(report.id, report.doctor_comment || "")}
                      >
                        Kaydet
                      </Button>
                    </Box>
                  ) : (
                    <TextField
                      value={report.doctor_comment || ""}
                      multiline
                      minRows={2}
                      fullWidth
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* PDF Önizleme */}
      <Dialog open={previewOpen} onClose={handleClosePreview} maxWidth="md" fullWidth>
        <DialogTitle>PDF İçeriği</DialogTitle>
        <DialogContent>
          {selectedReport ? <TestsTable parsedData={selectedReport.parsed_data} /> : <Typography>Yükleniyor...</Typography>}
        </DialogContent>
      </Dialog>

      {/* Yorum Modal */}
      <Dialog open={commentOpen} onClose={handleCloseComment} maxWidth="sm" fullWidth>
        <DialogTitle>Yapay Zeka Yorumu</DialogTitle>
        <DialogContent>
          {commentTestResults && <HealthComment testResults={commentTestResults} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseComment}>Kapat</Button>
        </DialogActions>
      </Dialog>

      {/* Upload */}
      {userRole === "doctor" && (
        <Dialog open={uploadOpen} onClose={handleCloseUpload} maxWidth="sm" fullWidth>
          <DialogTitle>Yeni Tahlil Yükle</DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <input type="file" accept="application/pdf" onChange={handleFileChange} />
            {selectedFile && <Typography>Seçilen Dosya: {selectedFile.name}</Typography>}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseUpload} disabled={uploading}>İptal</Button>
            <Button variant="contained" onClick={handleUpload} disabled={!selectedFile || uploading}>
              {uploading ? "Yükleniyor..." : "Yükle"}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default ReportList;
