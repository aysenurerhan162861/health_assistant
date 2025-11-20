// ReportList.tsx
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
import { LabReport } from "@/types/LabReport";
import axios from "axios";

interface ReportListProps {
  reports: LabReport[];
  patientId: number;
  refreshReports: () => void;
}

const ReportList: React.FC<ReportListProps> = ({ reports, patientId, refreshReports }) => {
  const [selectedReport, setSelectedReport] = useState<LabReport | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Yeni tahlil dialogu
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

  const handleOpenUpload = () => setUploadOpen(true);
  const handleCloseUpload = () => {
    setUploadOpen(false);
    setSelectedFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("patient_id", patientId.toString());

    setUploading(true);
    try {
      await axios.post("http://localhost:8000/api/lab_reports/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploading(false);
      handleCloseUpload();
      refreshReports();
    } catch (error) {
      console.error(error);
      setUploading(false);
    }
  };

  const handleOpenPdf = (filePath: string) => {
    // PDF’i yeni sekmede açar, kullanıcı hem önizleyebilir hem indirebilir
    window.open(`http://localhost:8000/${filePath}`, "_blank");
  };

  return (
    <Box>
      {/* Yeni Tahlil Butonu */}
      <Box mb={2}>
        <Button variant="contained" onClick={handleOpenUpload}>
          Yeni Tahlil Ekle
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tarih</TableCell>
              <TableCell>Dosya</TableCell>
              <TableCell>Detay</TableCell>
              <TableCell>Önizleme / İndir</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell>{report.upload_date ? new Date(report.upload_date).toLocaleDateString() : "-"}</TableCell>
                <TableCell>{report.file_name}</TableCell>
                <TableCell>
                  <Button variant="outlined" size="small" onClick={() => handlePreview(report)}>
                    Göster
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    size="small"
                    href={`http://localhost:8000/${report.file_path}`}
                    target="_blank"
                  >
                    Önizle / İndir
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* PDF Önizleme Dialog */}
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

      {/* Yeni Tahlil Yükleme Dialog */}
      <Dialog open={uploadOpen} onClose={handleCloseUpload} maxWidth="sm" fullWidth>
        <DialogTitle>Yeni Tahlil Yükle</DialogTitle>
        <DialogContent>
          <input type="file" accept=".pdf" onChange={handleFileChange} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUpload}>İptal</Button>
          <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
            {uploading ? "Yükleniyor..." : "Yükle"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReportList;
