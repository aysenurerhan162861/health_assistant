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
import EditIcon from "@mui/icons-material/Edit";
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

  // Accordion state (doktor için)
  const [openRowId, setOpenRowId] = useState<number | null>(null);
  const [accordionComment, setAccordionComment] = useState<string>("");
  const [savingAccordionId, setSavingAccordionId] = useState<number | null>(null);

  // ✔️ localStorage'dan yükle (sadece doktor)
  useEffect(() => {
    if (userRole !== "doctor") return;

    const key = `read_reports_patient_${patientId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      setReadReports(JSON.parse(saved));
    }
  }, [userRole, patientId]);

  // Eğer parent'tan reports değişirse editableReports güncelle
  useEffect(() => {
    setEditableReports(reports);
  }, [reports]);

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
  const handlePreview = (report: LabReport) => {
  if (userRole === "doctor") {
    markReportAsRead(report.id!);
  }

  setSelectedReport(report);
  setPreviewOpen(true);
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

  // Doktor yorum kaydetme (genel, API çağıran)
  const handleSaveDoctorComment = async (reportId: number, comment: string) => {
    try {
      await updateLabReportComment(reportId, comment);
      refreshReports();
    } catch (err: unknown) {
      console.error(err);
      alert("Doktor açıklaması kaydedilemedi!");
    }
  };

  // Accordion açma / kapama (doktor)
  const toggleAccordionForReport = (report: LabReport | null) => {
    if (!report) {
      setOpenRowId(null);
      setAccordionComment("");
      return;
    }

    // Eğer aynı rapor açıksa kapat
    if (openRowId === report.id) {
      setOpenRowId(null);
      setAccordionComment("");
      return;
    }

    // Açılırken mevcut doktor açıklamasını doldur
    setOpenRowId(report.id ?? null);
    setAccordionComment(report.doctor_comment || "");
  };

  // Accordion içindeki kaydetme butonu
  const handleSaveAccordion = async (reportId: number) => {
    try {
      setSavingAccordionId(reportId);
      await handleSaveDoctorComment(reportId, accordionComment);
      setSavingAccordionId(null);
      setOpenRowId(null);
      setAccordionComment("");
    } catch (err) {
      console.error(err);
      setSavingAccordionId(null);
      alert("Kaydederken hata oluştu!");
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
                {userRole === "doctor" && <th style={{ padding: "8px" }}></th>}
                <th style={{ padding: "8px" }}>Tarih</th>
                <th style={{ padding: "8px" }}>Dosya</th>
                <th style={{ padding: "8px" }}>Detay</th>
                <th style={{ padding: "8px" }}>Yapay Zeka Yorumu</th>
                {/* Sadece citizen (hasta) görsün */}
{userRole !== "doctor" && (
<th style={{ padding: "8px" }}>Doktor Açıklaması</th>
)}
              </tr>
            </thead>

            <tbody>
              {filteredReports.map((report) => (
                <React.Fragment key={report.id}>
                  <tr
                    style={{
                      backgroundColor:
                        userRole === "doctor"
                          ? readReports.includes(report.id!) 
                            ? "white"
                            : "#ffdddd"
                          : "white",
                    }}
                  >
                    {/* Doktor için satır başındaki kalem ikonu */}
                    {userRole === "doctor" && (
                      <td style={{ padding: "8px", verticalAlign: "top", width: 48 }}>
                        <IconButton
                          size="small"
                          onClick={() => toggleAccordionForReport(report)}
                        >
                          <EditIcon />
                        </IconButton>
                      </td>
                    )}

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

                    {/* Doktor açıklaması sütunu:
                        - Hasta: readOnly TextField (aynı görünüm)
                        - Doktor: plain metin göster (düzenleme accordion ile) */}
                  {userRole !== "doctor" && (
<td style={{ padding: "8px", verticalAlign: "top" }}>
<TextField
value={report.doctor_comment || ""}
multiline
minRows={2}
fullWidth
InputProps={{ readOnly: true }}
variant="outlined"
/>
</td>
)}
                  </tr>

                  {/* Accordion satırı — sadece doktor için */}
                  {userRole === "doctor" && openRowId === report.id && (
                    <tr>
                      <td colSpan={6}>
                        <Box
                          sx={{
                            mt: 1,
                            p: 2,
                            borderRadius: 2,
                            boxShadow: 1,
                            backgroundColor: "#f7f9fc",
                            border: "1px solid #e0e7ef",
                          }}
                        >
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              Açıklama Düzenle
                            </Typography>

                            <IconButton
                              size="small"
                              onClick={() => toggleAccordionForReport(null)}
                            >
                              <CloseIcon />
                            </IconButton>
                          </Box>

                          <TextField
                            label="Doktor Açıklaması"
                            multiline
                            minRows={4}
                            fullWidth
                            value={accordionComment}
                            onChange={(e) => setAccordionComment(e.target.value)}
                            variant="outlined"
                          />

                          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                            <Button
                              variant="contained"
                              onClick={() => handleSaveAccordion(report.id!)}
                              disabled={savingAccordionId === report.id}
                              sx={{ bgcolor: primaryColor, "&:hover": { bgcolor: "#082147" } }}
                            >
                              {savingAccordionId === report.id ? "Kaydediliyor..." : "Kaydet"}
                            </Button>
                          </Box>
                        </Box>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </Box>
      </Paper>

      {/* PDF Modal */}
<Dialog open={previewOpen} onClose={handleClosePreview} maxWidth="md" fullWidth>

  <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    PDF İçeriği

    <Box sx={{ display: "flex", gap: 1 }}>
      {/* PDF İndir Butonu */}
      <Button
        variant="outlined"
        onClick={() =>
          window.open(
            `http://localhost:8000/api/lab_reports/file/${selectedReport?.id}`
          )
        }
      >
        PDF İndir
      </Button>

      {/* Kapatma (X) */}
      <IconButton onClick={handleClosePreview}>
        <CloseIcon />
      </IconButton>
    </Box>
  </DialogTitle>

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
