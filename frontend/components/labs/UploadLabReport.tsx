"use client";
import React, { useState } from "react";
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, Box,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import axios from "axios";

interface UploadModalProps {
  patientId: number;
  onUploadSuccess: () => void;
}

const UploadLabReportModal: React.FC<UploadModalProps> = ({ patientId, onUploadSuccess }) => {
  const [open, setOpen]       = useState(false);
  const [file, setFile]       = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
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
        headers: { "Content-Type": "multipart/form-data", "token-header": `Bearer ${token}` },
      });
      onUploadSuccess();
      setOpen(false);
      setFile(null);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("PDF yükleme başarısız!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<CloudUploadIcon />}
        onClick={() => setOpen(true)}
        sx={{ bgcolor: "#0a2d57", "&:hover": { bgcolor: "#071d3c" }, borderRadius: 2 }}
      >
        Yeni Tahlil Yükle
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
        <DialogTitle sx={{ borderBottom: "1px solid #e8edf5", fontWeight: 700, color: "#0a2d57" }}>
          Tahlil Yükle
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box
            component="label"
            sx={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 1.5, p: 3, border: "2px dashed #b0bec5", borderRadius: 2,
              cursor: "pointer", bgcolor: "#f8faff",
              "&:hover": { borderColor: "#1565c0", bgcolor: "#e3f0ff" },
              transition: "all 0.2s",
            }}
          >
            <CloudUploadIcon sx={{ fontSize: 40, color: "#1565c0" }} />
            <Typography variant="body2" color="text.secondary">
              PDF dosyasını seçmek için tıklayın
            </Typography>
            <input type="file" accept="application/pdf" hidden onChange={handleFileChange} />
          </Box>
          {file && (
            <Typography variant="body2" sx={{ mt: 1.5, color: "#2e7d32", fontWeight: 500 }}>
              Seçilen: {file.name}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpen(false)} disabled={loading} sx={{ color: "#6b7a90" }}>
            İptal
          </Button>
          <Button
            variant="contained" onClick={handleUpload}
            disabled={!file || loading}
            sx={{ bgcolor: "#0a2d57", "&:hover": { bgcolor: "#071d3c" } }}
          >
            {loading ? "Yükleniyor..." : "Yükle"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UploadLabReportModal;
