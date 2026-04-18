"use client";
import React, { useState } from "react";
import {
  Button, Box, Typography, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, LinearProgress, IconButton,
} from "@mui/material";
import BiotechIcon from "@mui/icons-material/Biotech";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";

interface Props {
  patientId: number;
  onUploadSuccess: () => void;
}

const ALLOWED_EXTENSIONS = [".nii", ".nii.gz", ".dcm", ".zip"];

const isAllowed = (filename: string): boolean => {
  const fn = filename.toLowerCase();
  return fn.endsWith(".nii") || fn.endsWith(".nii.gz") ||
         fn.endsWith(".dcm") || fn.endsWith(".zip");
};

const UploadMrScan: React.FC<Props> = ({ patientId, onUploadSuccess }) => {
  const [open, setOpen]       = useState(false);
  const [files, setFiles]     = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleOpen  = () => { setOpen(true); setError(null); };
  const handleClose = () => { setOpen(false); setFiles([]); setError(null); };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);

    const invalid = selected.filter(f => !isAllowed(f.name));
    if (invalid.length > 0) {
      setError(
        `Geçersiz dosya(lar): ${invalid.map(f => f.name).join(", ")} — ` +
        `Desteklenen formatlar: .nii, .nii.gz, .dcm, .zip`
      );
      return;
    }

    setError(null);
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      const yeni = selected.filter(f => !existing.has(f.name));
      return [...prev, ...yeni];
    });

    e.target.value = "";
  };

  const handleRemove = (name: string) => {
    setFiles(prev => prev.filter(f => f.name !== name));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach(f => formData.append("files", f));
    formData.append("patient_id", String(patientId));

    const token = localStorage.getItem("token") || "";
    try {
      setLoading(true);
      await axios.post("http://localhost:8000/api/mr_scans/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "token-header": `Bearer ${token}`,
        },
      });
      onUploadSuccess();
      handleClose();
    } catch (err: any) {
      console.error("MR upload failed:", err);
      const detail = err?.response?.data?.detail;
      setError(detail || "MR yükleme başarısız. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const totalMB = files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024;

  // Dosya tipine göre ikon
  const fileIcon = (name: string) => {
    const fn = name.toLowerCase();
    if (fn.endsWith(".zip"))  return "🗜️";
    if (fn.endsWith(".dcm"))  return "🏥";
    return "📄";
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Button
        variant="contained"
        startIcon={<BiotechIcon />}
        onClick={handleOpen}
        sx={{ backgroundColor: "#0a2d57", "&:hover": { backgroundColor: "#082147" } }}
      >
        Yeni MR Yükle
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>MR Görüntüsü Yükle</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>

          <Alert severity="info" icon={false}>
            📂 <strong>MR dosyalarınızı seçin.</strong> Sistem, inme analizi için
            DWI ve ADC sekanslarını otomatik olarak tespit edecektir.
          </Alert>

          <Typography variant="body2" color="text.secondary">
            Desteklenen formatlar:{" "}
            <strong>.dcm</strong> (DICOM),{" "}
            <strong>.zip</strong> (DICOM arşivi),{" "}
            <strong>.nii / .nii.gz</strong> (NIfTI)
          </Typography>

          {/* Dosya seçme alanı */}
          <Box sx={{
            border: "2px dashed #ccc", borderRadius: 2, p: 3, textAlign: "center",
            "&:hover": { borderColor: "#0a2d57", backgroundColor: "#f5f8ff" },
            cursor: "pointer",
          }}>
            <input
              type="file"
              accept=".nii,.nii.gz,.dcm,.zip"
              multiple
              onChange={handleFileChange}
              style={{ display: "none" }}
              id="mr-file-input"
            />
            <label htmlFor="mr-file-input" style={{ cursor: "pointer" }}>
              <BiotechIcon sx={{ fontSize: 40, color: "#0a2d57", mb: 1 }} />
              <Typography>Dosya seçmek için tıklayın</Typography>
              <Typography variant="caption" color="text.secondary">
                DICOM (.dcm), ZIP arşivi veya NIfTI (.nii/.nii.gz) yükleyebilirsiniz
              </Typography>
            </label>
          </Box>

          {/* Seçilen dosyalar listesi */}
          {files.length > 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography variant="body2" fontWeight={600}>
                Seçilen dosyalar ({files.length} adet — {totalMB.toFixed(1)} MB):
              </Typography>
              {files.map(f => (
                <Box
                  key={f.name}
                  sx={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    backgroundColor: "#f0f4ff", borderRadius: 1, px: 1.5, py: 0.5,
                  }}
                >
                  <Typography variant="body2" noWrap sx={{ maxWidth: 340 }}>
                    {fileIcon(f.name)} {f.name}{" "}
                    <Typography component="span" variant="caption" color="text.secondary">
                      ({(f.size / 1024 / 1024).toFixed(1)} MB)
                    </Typography>
                  </Typography>
                  <IconButton size="small" onClick={() => handleRemove(f.name)} disabled={loading}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}

          {error && <Alert severity="error">{error}</Alert>}

          {loading && (
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Yükleniyor ve analiz kuyruğuna alınıyor...
              </Typography>
              <LinearProgress />
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>İptal</Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={files.length === 0 || loading}
            sx={{ backgroundColor: "#0a2d57", "&:hover": { backgroundColor: "#082147" } }}
          >
            {loading ? "Yükleniyor..." : `Yükle ve Analiz Et`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UploadMrScan;