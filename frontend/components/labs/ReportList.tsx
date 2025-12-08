"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import TestsTable from "./TestsTable";
import { LabReport } from "@/types/LabReport";
import { TestResult, fetchGeminiComment } from "@/services/GeminiApi";
import { updateLabReportComment } from "@/services/LabApi";
import axios from "axios";

interface ReportListProps {
  reports: LabReport[];
  patientId: number;
  refreshReports: () => void;
  userRole: "doctor" | "citizen";
}

const ReportList: React.FC<ReportListProps> = ({
  reports,
  patientId,
  refreshReports,
  userRole,
}) => {
  const [selectedReport, setSelectedReport] = useState<LabReport | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState<string>("");
  const [commentLoadingId, setCommentLoadingId] = useState<number | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileSearch, setFileSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [editableReports, setEditableReports] = useState<LabReport[]>(reports);

  const primaryColor = "#0a2d57";

  // 🔥 OKUNAN TAHLİLLER STATE
  const [readReports, setReadReports] = useState<number[]>([]);

  // ✔️ localStorage'dan yükle (sadece doktor)
  useEffect(() => {
    if (userRole !== "doctor") return;

    const key = `read_reports_patient_${patientId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      setReadReports(JSON.parse(saved));
    }
  }, [userRole, patientId]);

  // ✔️ Okundu işaretleme fonksiyonu
  const markReportAsRead = (reportId: number) => {
    if (userRole !== "doctor") return;

    const updated = [...new Set([...readReports, reportId])];
    setReadReports(updated);

    localStorage.setItem(
      `read_reports_patient_${patientId}`,
      JSON.stringify(updated)
    );
  };

  // 📄 PDF önizleme açılırken okundu işaretle
const handlePreview = async (report: LabReport) => {
  if (userRole === "doctor") {
    markReportAsRead(report.id!);
  }

  setSelectedReport(report);
  setPreviewOpen(true);

  const token = localStorage.getItem("token") || "";

  try {
    const res = await fetch(
      `http://localhost:8000/api/lab_reports/file/${report.id}`,
      {
        headers: { "token-header": `Bearer ${token}` }
      }
    );

    if (!res.ok) {
      console.error("PDF alınamadı:", await res.text());
      return;
    }

    const blob = await res.blob();

    if (blob.type !== "application/pdf") {
      console.error("PDF değil:", blob.type);
      return;
    }

    const url = window.URL.createObjectURL(blob);
    window.open(url, "_blank");
  } catch (err) {
    console.error("PDF açılamadı:", err);
  }
};

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setSelectedReport(null);
  };

  // Yapay Zeka Yorumu
  const handleOpenComment = async (report: LabReport) => {
    setCommentLoadingId(report.id ?? null);
    setSelectedReport(report);

    try {
      const mapped: TestResult[] =
        report.parsed_data?.tests?.map((t) => ({ ...t, status: "normal" })) ||
        [];

      const result = await fetchGeminiComment(mapped);
      setCommentText(result);
      setCommentOpen(true);
    } catch {
      setCommentText("Yorum alınamadı.");
      setCommentOpen(true);
    } finally {
      setCommentLoadingId(null);
    }
  };

  const handleCloseComment = () => {
    setCommentOpen(false);
    setSelectedReport(null);
    setCommentText("");
  };

  // Doktor yorum kaydetme
  const handleDoctorCommentChange = (reportId: number, value: string) => {
    setEditableReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, doctor_comment: value } : r))
    );
  };

  const handleSaveDoctorComment = async (
    reportId: number,
    comment: string
  ) => {
    try {
      await updateLabReportComment(reportId, comment);
      refreshReports();
    } catch (err: unknown) {
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
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSelectedFile(e.target.files?.[0] || null);

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("patient_id", String(patientId));

    const token = localStorage.getItem("token") || "";

    try {
      setUploading(true);
      await axios.post(
        "http://localhost:8000/api/lab_reports/upload",
        formData,
        {
          headers: { "token-header": `Bearer ${token}` },
        }
      );
      setUploading(false);
      handleCloseUpload();
      refreshReports();
    } catch (err: unknown) {
      console.error("Upload failed:", err);
      alert("PDF yükleme başarısız!");
      setUploading(false);
    }
  };

  // Filtre + Sıralama
  const filteredReports = useMemo(() => {
    let filtered = editableReports.filter((r) =>
      r.file_name?.toLowerCase().includes(fileSearch.toLowerCase())
    );
    filtered.sort((a, b) => {
      const da = a.upload_date ? new Date(a.upload_date).getTime() : 0;
      const db = b.upload_date ? new Date(b.upload_date).getTime() : 0;
      return sortOrder === "desc" ? db - da : da - db;
    });
    return filtered;
  }, [editableReports, fileSearch, sortOrder]);

  return (
    <Box
      sx={{
        p: 4,
        minHeight: "90vh",
        bgcolor: userRole === "citizen" ? "#e6f0ff" : "transparent",
      }}
    >
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
        {/* Üst Panel */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
            gap: 2,
          }}
        >
          {userRole === "doctor" && null}

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <TextField
              label="Dosya Ara"
              size="small"
              value={fileSearch}
              onChange={(e) => setFileSearch(e.target.value)}
            />

            <TextField
              label="Sırala"
              size="small"
              select
              value={sortOrder}
              onChange={(e) =>
                setSortOrder(e.target.value as "asc" | "desc")
              }
            >
              <MenuItem value="desc">Yeniden Eskiye</MenuItem>
              <MenuItem value="asc">Eskiden Yeniye</MenuItem>
            </TextField>
          </Box>
        </Box>

        {/* Tablolar */}
        <Box sx={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f0f0f0" }}>
                <th style={{ padding: "8px" }}>Tarih</th>
                <th style={{ padding: "8px" }}>Dosya</th>
                <th style={{ padding: "8px" }}>Detay</th>
                <th style={{ padding: "8px" }}>Yapay Zeka Yorumu</th>
                <th style={{ padding: "8px" }}>Doktor Açıklaması</th>
              </tr>
            </thead>

            <tbody>
              {filteredReports.map((report) => (
                <tr
                  key={report.id}
                  style={{
                    backgroundColor:
                      userRole === "doctor"
                        ? readReports.includes(report.id!)
                          ? "white"
                          : "#ffdddd"
                        : "white",
                  }}
                >
                  <td style={{ padding: "8px" }}>
                    {report.upload_date
                      ? new Date(report.upload_date).toLocaleDateString()
                      : "-"}
                  </td>

                  <td style={{ padding: "8px" }}>{report.file_name}</td>

                  <td style={{ padding: "8px" }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handlePreview(report)}
                    >
                      Göster
                    </Button>
                  </td>

                  <td style={{ padding: "8px" }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleOpenComment(report)}
                      disabled={commentLoadingId === report.id}
                    >
                      {commentLoadingId === report.id
                        ? "⏳ Yükleniyor..."
                        : "Yorum Al"}
                    </Button>
                  </td>

                  <td style={{ padding: "8px" }}>
                    {userRole === "doctor" ? (
                      <TextField
                        value={report.doctor_comment || ""}
                        onChange={(e) =>
                          handleDoctorCommentChange(report.id!, e.target.value)
                        }
                        multiline
                        minRows={2}
                        fullWidth
                        variant="outlined"
                        onBlur={() =>
                          handleSaveDoctorComment(
                            report.id!,
                            report.doctor_comment || ""
                          )
                        }
                      />
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      </Paper>

      {/* PDF Modal */}
      <Dialog open={previewOpen} onClose={handleClosePreview} maxWidth="md" fullWidth>
        <DialogTitle>PDF İçeriği</DialogTitle>
        <DialogContent>
          {selectedReport ? (
            <TestsTable parsedData={selectedReport.parsed_data} />
          ) : (
            <Typography>Yükleniyor...</Typography>
          )}
        </DialogContent>
      </Dialog>

      {/* Yorum Modal */}
      <Dialog open={commentOpen} onClose={handleCloseComment} maxWidth="sm" fullWidth>
        <DialogTitle>Yapay Zeka Yorumu</DialogTitle>
        <DialogContent>
          <Typography sx={{ whiteSpace: "pre-line" }}>{commentText}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseComment}>Kapat</Button>
        </DialogActions>
      </Dialog>

      {/* Upload Modal */}
      <Dialog open={uploadOpen} onClose={handleCloseUpload} maxWidth="sm" fullWidth>
        <DialogTitle>Yeni Tahlil Yükle</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <input type="file" accept="application/pdf" onChange={handleFileChange} />
          {selectedFile && <Typography>Seçilen Dosya: {selectedFile.name}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUpload} disabled={uploading}>İptal</Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            sx={{ bgcolor: primaryColor, "&:hover": { bgcolor: "#082147" } }}
          >
            {uploading ? "Yükleniyor..." : "Yükle"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReportList;
