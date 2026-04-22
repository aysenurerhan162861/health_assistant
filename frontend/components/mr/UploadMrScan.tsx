"use client";
import React, { useState } from "react";
import {
  Button, Box, Typography, Dialog, DialogTitle,
  DialogContent, Alert, LinearProgress, IconButton, Stack,
} from "@mui/material";
import BiotechIcon from "@mui/icons-material/Biotech";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import axios from "axios";

interface Props {
  patientId: number;
  onUploadSuccess: () => void;
}

const isAllowed = (filename: string): boolean => {
  const fn = filename.toLowerCase();
  return fn.endsWith(".nii") || fn.endsWith(".nii.gz") ||
         fn.endsWith(".dcm") || fn.endsWith(".zip");
};

const fileIcon = (name: string): string => {
  const fn = name.toLowerCase();
  if (fn.endsWith(".zip")) return "🗜️";
  if (fn.endsWith(".dcm")) return "🏥";
  return "📄";
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
    const invalid  = selected.filter((f) => !isAllowed(f.name));
    if (invalid.length > 0) {
      setError(`Geçersiz dosya(lar): ${invalid.map((f) => f.name).join(", ")} — Desteklenen formatlar: .nii, .nii.gz, .dcm, .zip`);
      return;
    }
    setError(null);
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      return [...prev, ...selected.filter((f) => !existing.has(f.name))];
    });
    e.target.value = "";
  };

  const handleRemove = (name: string) => setFiles((prev) => prev.filter((f) => f.name !== name));

  const handleUpload = async () => {
    if (files.length === 0) return;
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    formData.append("patient_id", String(patientId));
    const token = localStorage.getItem("token") || "";
    try {
      setLoading(true);
      await axios.post("http://localhost:8000/api/mr_scans/upload", formData, {
        headers: { "Content-Type": "multipart/form-data", "token-header": `Bearer ${token}` },
      });
      onUploadSuccess();
      handleClose();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(detail || "MR yükleme başarısız. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const totalMB = files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024;

  return (
    <>
      <Button
        variant="contained" startIcon={<BiotechIcon />} onClick={handleOpen}
        sx={{ bgcolor: "#6a1b9a", "&:hover": { bgcolor: "#4a148c" } }}
      >
        Yeni MR Yükle
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
        <DialogTitle sx={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderBottom: "1px solid #e8edf5", pb: 1.5,
        }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <BiotechIcon sx={{ color: "#6a1b9a" }} />
            <Typography fontWeight={700} color="#0a2d57">MR Görüntüsü Yükle</Typography>
          </Stack>
          <IconButton size="small" onClick={handleClose} sx={{ color: "#9aa5b4" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 2.5 }}>
          <Stack spacing={2}>
            <Alert severity="info" icon={false} sx={{ borderRadius: 2 }}>
              <Typography variant="body2">
                <strong>📂 MR dosyalarınızı seçin.</strong> Sistem, inme analizi için DWI ve ADC sekanslarını
                otomatik olarak tespit edecektir.
              </Typography>
            </Alert>

            <Typography variant="body2" color="text.secondary">
              Desteklenen formatlar:{" "}
              <strong>.dcm</strong> (DICOM), <strong>.zip</strong> (DICOM arşivi),{" "}
              <strong>.nii / .nii.gz</strong> (NIfTI)
            </Typography>

            {/* Drag-drop alanı */}
            <Box
              component="label" htmlFor="mr-file-input"
              sx={{
                border: "2px dashed #d0d7e3", borderRadius: 2, p: 4,
                textAlign: "center", cursor: "pointer", display: "block",
                transition: "all .2s",
                "&:hover": { borderColor: "#6a1b9a", bgcolor: "#faf4ff" },
              }}
            >
              <input
                id="mr-file-input" type="file"
                accept=".nii,.nii.gz,.dcm,.zip" multiple
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              <CloudUploadIcon sx={{ fontSize: 40, color: "#6a1b9a", mb: 1 }} />
              <Typography fontWeight={600} color="#0a2d57">Dosya seçmek için tıklayın</Typography>
              <Typography variant="caption" color="text.secondary">
                DICOM (.dcm), ZIP arşivi veya NIfTI (.nii / .nii.gz)
              </Typography>
            </Box>

            {/* Seçilen dosyalar */}
            {files.length > 0 && (
              <Box>
                <Typography variant="body2" fontWeight={600} mb={1}>
                  Seçilen dosyalar ({files.length} adet — {totalMB.toFixed(1)} MB):
                </Typography>
                <Stack spacing={0.75}>
                  {files.map((f) => (
                    <Box key={f.name} sx={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      bgcolor: "#f3e8ff", borderRadius: 1.5, px: 1.5, py: 0.75,
                    }}>
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
                </Stack>
              </Box>
            )}

            {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

            {loading && (
              <Box>
                <Typography variant="body2" mb={1} color="text.secondary">
                  Yükleniyor ve analiz kuyruğuna alınıyor...
                </Typography>
                <LinearProgress sx={{ borderRadius: 1, "& .MuiLinearProgress-bar": { bgcolor: "#6a1b9a" } }} />
              </Box>
            )}

            {/* Butonlar */}
            <Stack direction="row" justifyContent="flex-end" spacing={1} pt={0.5}>
              <Button onClick={handleClose} disabled={loading} sx={{ color: "#6b7a90" }}>
                İptal
              </Button>
              <Button
                variant="contained" startIcon={<SaveIcon />}
                onClick={handleUpload} disabled={files.length === 0 || loading}
                sx={{ bgcolor: "#6a1b9a", "&:hover": { bgcolor: "#4a148c" } }}
              >
                {loading ? "Yükleniyor..." : "Yükle ve Analiz Et"}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UploadMrScan;
