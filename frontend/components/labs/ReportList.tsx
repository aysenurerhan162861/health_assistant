"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Box, Button, Card, Typography, TextField, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Stack, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import SaveIcon from "@mui/icons-material/Save";
import TestsTable from "./TestsTable";
import { LabReport } from "@/types/LabReport";
import { TestResult, fetchGeminiComment } from "@/services/GeminiApi";
import { updateLabReportComment } from "@/services/LabApi";
interface ReportListProps {
  reports: LabReport[];
  patientId: number;
  refreshReports: () => void;
  userRole: "doctor" | "citizen";
}

const ReportList: React.FC<ReportListProps> = ({ reports, patientId, refreshReports, userRole }) => {
  const [selectedReport, setSelectedReport]   = useState<LabReport | null>(null);
  const [previewOpen, setPreviewOpen]         = useState(false);
  const [commentOpen, setCommentOpen]         = useState(false);
  const [commentText, setCommentText]         = useState("");
  const [commentLoadingId, setCommentLoadingId] = useState<number | null>(null);
  const [fileSearch, setFileSearch]           = useState("");
  const [sortOrder, setSortOrder]             = useState<"asc" | "desc">("desc");
  const [editableReports, setEditableReports] = useState<LabReport[]>(reports);
  const [readReports, setReadReports]         = useState<number[]>([]);
  const [openRowId, setOpenRowId]             = useState<number | null>(null);
  const [accordionComment, setAccordionComment] = useState("");
  const [savingAccordionId, setSavingAccordionId] = useState<number | null>(null);

  useEffect(() => {
    if (userRole !== "doctor") return;
    const saved = localStorage.getItem(`read_reports_patient_${patientId}`);
    if (saved) setReadReports(JSON.parse(saved));
  }, [userRole, patientId]);

  useEffect(() => { setEditableReports(reports); }, [reports]);

  const markAsRead = (reportId: number) => {
    if (userRole !== "doctor") return;
    const updated = [...new Set([...readReports, reportId])];
    setReadReports(updated);
    localStorage.setItem(`read_reports_patient_${patientId}`, JSON.stringify(updated));
  };

  const handlePreview = (report: LabReport) => {
    if (userRole === "doctor") markAsRead(report.id!);
    setSelectedReport(report);
    setPreviewOpen(true);
  };

  const handleOpenComment = async (report: LabReport) => {
    setCommentLoadingId(report.id ?? null);
    setSelectedReport(report);
    try {
      const mapped: TestResult[] = report.parsed_data?.tests?.map((t) => ({ ...t, status: "normal" })) || [];
      setCommentText(await fetchGeminiComment(mapped));
      setCommentOpen(true);
    } catch {
      setCommentText("Yorum alınamadı.");
      setCommentOpen(true);
    } finally {
      setCommentLoadingId(null);
    }
  };

  const handleSaveDoctorComment = async (reportId: number, comment: string) => {
    await updateLabReportComment(reportId, comment);
    refreshReports();
  };

  const toggleAccordion = (report: LabReport | null) => {
    if (!report || openRowId === report.id) {
      setOpenRowId(null);
      setAccordionComment("");
      return;
    }
    setOpenRowId(report.id ?? null);
    setAccordionComment(report.doctor_comment || "");
  };

  const handleSaveAccordion = async (reportId: number) => {
    try {
      setSavingAccordionId(reportId);
      await handleSaveDoctorComment(reportId, accordionComment);
      setOpenRowId(null);
      setAccordionComment("");
    } catch {
      alert("Kaydederken hata oluştu!");
    } finally {
      setSavingAccordionId(null);
    }
  };

  const filteredReports = useMemo(() => {
    let list = editableReports.filter((r) =>
      r.file_name?.toLowerCase().includes(fileSearch.toLowerCase())
    );
    list.sort((a, b) => {
      const da = a.upload_date ? new Date(a.upload_date).getTime() : 0;
      const db = b.upload_date ? new Date(b.upload_date).getTime() : 0;
      return sortOrder === "desc" ? db - da : da - db;
    });
    return list;
  }, [editableReports, fileSearch, sortOrder]);

  return (
    <Box>
      {/* Filtre */}
      <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2, p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            size="small" fullWidth placeholder="Dosya adıyla ara..."
            value={fileSearch} onChange={(e) => setFileSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: "#9aa5b4" }} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            select size="small" value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
            sx={{ minWidth: 170 }}
          >
            <MenuItem value="desc">Yeniden Eskiye</MenuItem>
            <MenuItem value="asc">Eskiden Yeniye</MenuItem>
          </TextField>
        </Stack>
      </Card>

      {/* Tablo */}
      <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2, overflow: "hidden" }}>
        {filteredReports.length === 0 ? (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <Typography color="text.secondary">Tahlil bulunamadı.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f8faff" }}>
                  {userRole === "doctor" && <TableCell sx={{ width: 44, borderColor: "#e8edf5" }} />}
                  <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5" }}>Tarih</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5" }}>Dosya Adı</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5" }}>Detay</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5" }}>Yapay Zeka</TableCell>
                  {userRole !== "doctor" && (
                    <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5" }}>Doktor Notu</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReports.map((report) => {
                  const isUnread = userRole === "doctor" && !readReports.includes(report.id!);
                  return (
                    <React.Fragment key={report.id}>
                      <TableRow
                        sx={{
                          bgcolor: isUnread ? "#fff8f0" : "white",
                          "&:hover": { bgcolor: "#f0f6ff" },
                        }}
                      >
                        {/* Doktor edit ikonu */}
                        {userRole === "doctor" && (
                          <TableCell sx={{ borderColor: "#f0f4fa", py: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => toggleAccordion(report)}
                              sx={{ color: openRowId === report.id ? "#0a2d57" : "#9aa5b4" }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        )}

                        <TableCell sx={{ borderColor: "#f0f4fa", color: "#444" }}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            {isUnread && (
                              <Chip label="Yeni" size="small"
                                sx={{ bgcolor: "#fff3e0", color: "#e65100", fontWeight: 600, fontSize: 10, height: 18 }} />
                            )}
                            <span>{report.upload_date ? new Date(report.upload_date).toLocaleDateString("tr-TR") : "—"}</span>
                          </Stack>
                        </TableCell>

                        <TableCell sx={{ borderColor: "#f0f4fa" }}>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <PictureAsPdfIcon sx={{ fontSize: 16, color: "#e53935" }} />
                            <Typography variant="body2" color="#1a2e4a">{report.file_name}</Typography>
                          </Stack>
                        </TableCell>

                        <TableCell sx={{ borderColor: "#f0f4fa" }}>
                          <Button
                            variant="outlined" size="small"
                            onClick={() => handlePreview(report)}
                            sx={{ borderColor: "#0a2d57", color: "#0a2d57", fontSize: 12,
                              "&:hover": { bgcolor: "#e3f0ff" } }}
                          >
                            Göster
                          </Button>
                        </TableCell>

                        <TableCell sx={{ borderColor: "#f0f4fa" }}>
                          <Button
                            variant="contained" size="small"
                            onClick={() => handleOpenComment(report)}
                            disabled={commentLoadingId === report.id}
                            startIcon={<SmartToyIcon sx={{ fontSize: 14 }} />}
                            sx={{ bgcolor: "#1565c0", "&:hover": { bgcolor: "#0d47a1" }, fontSize: 12 }}
                          >
                            {commentLoadingId === report.id ? "Yükleniyor..." : "Yorum Al"}
                          </Button>
                        </TableCell>

                        {userRole !== "doctor" && (
                          <TableCell sx={{ borderColor: "#f0f4fa", maxWidth: 220 }}>
                            {report.doctor_comment ? (
                              <Typography variant="body2" color="text.secondary"
                                sx={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                                {report.doctor_comment}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="#bbb">Henüz yorum yok</Typography>
                            )}
                          </TableCell>
                        )}
                      </TableRow>

                      {/* Doktor açıklama accordion */}
                      {userRole === "doctor" && openRowId === report.id && (
                        <TableRow>
                          <TableCell colSpan={5} sx={{ p: 0, borderColor: "#e8edf5" }}>
                            <Box sx={{ m: 1.5, p: 2, bgcolor: "#f8faff", borderRadius: 2,
                              border: "1px solid #e0e7ef" }}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                                <Typography variant="subtitle2" fontWeight={700} color="#0a2d57">
                                  Doktor Açıklaması
                                </Typography>
                                <IconButton size="small" onClick={() => toggleAccordion(null)}>
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                              </Stack>
                              <TextField
                                multiline minRows={3} fullWidth
                                value={accordionComment}
                                onChange={(e) => setAccordionComment(e.target.value)}
                                placeholder="Hastaya açıklama yazın..."
                                size="small"
                              />
                              <Stack direction="row" justifyContent="flex-end" mt={1.5}>
                                <Button
                                  variant="contained" size="small"
                                  startIcon={<SaveIcon fontSize="small" />}
                                  onClick={() => handleSaveAccordion(report.id!)}
                                  disabled={savingAccordionId === report.id}
                                  sx={{ bgcolor: "#0a2d57", "&:hover": { bgcolor: "#071d3c" } }}
                                >
                                  {savingAccordionId === report.id ? "Kaydediliyor..." : "Kaydet"}
                                </Button>
                              </Stack>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* PDF Önizleme */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center",
          borderBottom: "1px solid #e8edf5", fontWeight: 700, color: "#0a2d57" }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <PictureAsPdfIcon sx={{ color: "#e53935" }} />
            <span>{selectedReport?.file_name}</span>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" size="small"
              onClick={() => window.open(`http://localhost:8000/api/lab_reports/file/${selectedReport?.id}`)}
              sx={{ borderColor: "#0a2d57", color: "#0a2d57" }}>
              PDF İndir
            </Button>
            <IconButton size="small" onClick={() => setPreviewOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 2.5 }}>
          {selectedReport ? (
            <TestsTable parsedData={selectedReport.parsed_data} />
          ) : (
            <Typography color="text.secondary">Yükleniyor...</Typography>
          )}
        </DialogContent>
      </Dialog>

      {/* Yapay Zeka Yorumu */}
      <Dialog open={commentOpen} onClose={() => setCommentOpen(false)} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1,
          borderBottom: "1px solid #e8edf5", fontWeight: 700, color: "#0a2d57" }}>
          <SmartToyIcon sx={{ color: "#1565c0" }} />
          Yapay Zeka Yorumu
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5 }}>
          <Typography variant="body2" sx={{ whiteSpace: "pre-line", lineHeight: 1.8, color: "#333" }}>
            {commentText}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setCommentOpen(false)} sx={{ color: "#6b7a90" }}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReportList;
