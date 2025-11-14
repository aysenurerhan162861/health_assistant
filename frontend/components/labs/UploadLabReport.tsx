import React, { useState } from "react";
import { Button, Box, Typography } from "@mui/material";
import axios from "axios";

interface UploadLabReportProps {
  patientId: number;
  onUploadSuccess: () => void; // tabloyu yenilemek için callback
}

const UploadLabReport: React.FC<UploadLabReportProps> = ({ patientId, onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile: File | null = e.target.files?.[0] ?? null;
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("patient_id", String(patientId));

    try {
      setLoading(true);
      await axios.post("http://localhost:8000/api/lab_reports/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFile(null);
      onUploadSuccess();
    } catch (err) {
      console.error("Upload failed:", err);
      alert("PDF yükleme başarısız!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mb: 3, display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography variant="h6">Yeni Tahlil Yükle</Typography>
      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
      />
      <Button
        variant="contained"
        color="primary"
        disabled={!file || loading}
        onClick={handleUpload}
      >
        {loading ? "Yükleniyor..." : "Yükle"}
      </Button>
    </Box>
  );
};

export default UploadLabReport;
