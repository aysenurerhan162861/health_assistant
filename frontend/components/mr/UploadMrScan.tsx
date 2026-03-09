"use client";
import React, { useState } from "react";
import {
  Button, Box, Typography, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, LinearProgress,
} from "@mui/material";
import BiotechIcon from "@mui/icons-material/Biotech";
import axios from "axios";

interface Props {
  patientId: number;
  onUploadSuccess: () => void;
}

const UploadMrScan: React.FC<Props> = ({ patientId, onUploadSuccess }) => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = () => { setOpen(true); setError(null); };
  const handleClose = () => { setOpen(false); setFile(null); setError(null); };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    if (selected && !selected.name.match(/\.(nii|nii\.gz)$/i)) {
      setError("Lütfen geçerli bir NIfTI dosyası seçin (.nii veya .nii.gz)");
      setFile(null);
      return;
    }
    setError(null);
    setFile(selected);
  };

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("patient_id", String(patientId));
    const token = localStorage.getItem("token") || "";
    try {
      setLoading(true);
      await axios.post("http://localhost:8000/api/mr_scans/upload", formData, {
        headers: { "Content-Type": "multipart/form-data", "token-header": `Bearer ${token}` },
      });
      onUploadSuccess();
      handleClose();
    } catch (err) {
      console.error("MR upload failed:", err);
      setError("MR yükleme başarısız. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Button variant="contained" startIcon={<BiotechIcon />} onClick={handleOpen}
        sx={{ backgroundColor: "#0a2d57", "&:hover": { backgroundColor: "#082147" } }}>
        Yeni MR Yükle
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>MR Görüntüsü Yükle</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Desteklenen format: <strong>.nii</strong> veya <strong>.nii.gz</strong> (NIfTI)
          </Typography>

          <Box sx={{
            border: "2px dashed #ccc", borderRadius: 2, p: 3, textAlign: "center",
            "&:hover": { borderColor: "#0a2d57", backgroundColor: "#f5f8ff" },
          }}>
            <input type="file" accept=".nii,.nii.gz" onChange={handleFileChange}
              style={{ display: "none" }} id="mr-file-input" />
            <label htmlFor="mr-file-input" style={{ cursor: "pointer" }}>
              <BiotechIcon sx={{ fontSize: 40, color: "#0a2d57", mb: 1 }} />
              <Typography>Dosya seçmek için tıklayın</Typography>
              <Typography variant="caption" color="text.secondary">.nii / .nii.gz</Typography>
            </label>
          </Box>

          {file && (
            <Alert severity="success" icon={false}>
              ✅ <strong>{file.name}</strong> ({(file.size / 1024 / 1024).toFixed(1)} MB)
            </Alert>
          )}
          {error && <Alert severity="error">{error}</Alert>}
          {loading && (
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>Yükleniyor ve analiz kuyruğuna alınıyor...</Typography>
              <LinearProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>İptal</Button>
          <Button variant="contained" onClick={handleUpload} disabled={!file || loading}
            sx={{ backgroundColor: "#0a2d57", "&:hover": { backgroundColor: "#082147" } }}>
            {loading ? "Yükleniyor..." : "Yükle ve Analiz Et"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UploadMrScan;