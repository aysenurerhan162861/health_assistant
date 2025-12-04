import React, { useState } from "react";
import {
  Button,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import axios from "axios";

interface UploadModalProps {
  patientId: number;
  onUploadSuccess: () => void;
}

const UploadLabReportModal: React.FC<UploadModalProps> = ({ patientId, onUploadSuccess }) => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile: File | null = e.target.files?.[0] ?? null;
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("patient_id", String(patientId));

    const token = localStorage.getItem("token") || "";

    try {
      setLoading(true);
      await axios.post("http://localhost:8000/api/lab_reports/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "token-header": `Bearer ${token}`, // ⚡ Token eklendi
        },
      });
      onUploadSuccess(); // Başarılı yükleme sonrası parent refresh
      handleClose();
    } catch (err) {
      console.error("Upload failed:", err);
      alert("PDF yükleme başarısız!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Button variant="contained" onClick={handleOpen}>Yeni Tahlil Ekle</Button>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Yeni Tahlil Yükle</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <input type="file" accept="application/pdf" onChange={handleFileChange} />
          {file && <Typography>Seçilen Dosya: {file.name}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>İptal</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpload}
            disabled={!file || loading}
          >
            {loading ? "Yükleniyor..." : "Yükle"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UploadLabReportModal;
