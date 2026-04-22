"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, Tabs, Tab, Box,
  IconButton, Typography, CircularProgress, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Button, Stack, Avatar, Collapse,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import PersonIcon from "@mui/icons-material/Person";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { BloodPressureTracking, PatientInfo } from "@/types/BloodPressure";
import { User } from "@/types/user";
import { getPatientTrackingsForDoctor, updateTrackingDoctorComment } from "@/services/BloodPressureApi";
import PatientCardContent from "../patients/PatientCardContent";

interface BloodPressureModalProps {
  open: boolean;
  onClose: () => void;
  tracking: (BloodPressureTracking & { patient?: User }) | null;
  userRole?: "doctor" | "assistant";
  allTrackings?: (BloodPressureTracking & { patient?: User })[];
}

const getBPStatus = (systolic: number | null, diastolic: number | null) => {
  if (systolic === null || diastolic === null) return null;
  if (systolic >= 140 || diastolic >= 90) return { label: "Yüksek", bgcolor: "#ffebee", color: "#c62828" };
  if (systolic >= 120 || diastolic >= 80) return { label: "Sınırda", bgcolor: "#fff3e0", color: "#e65100" };
  return { label: "Normal", bgcolor: "#e8f5e9", color: "#2e7d32" };
};

const BloodPressureModal: React.FC<BloodPressureModalProps> = ({
  open, onClose, tracking, userRole = "doctor", allTrackings = [],
}) => {
  const [tabIndex, setTabIndex]                         = useState(0);
  const [patientTrackings, setPatientTrackings]         = useState<BloodPressureTracking[]>([]);
  const [loading, setLoading]                           = useState(false);
  const [openAccordionId, setOpenAccordionId]           = useState<number | null>(null);
  const [openCommentId, setOpenCommentId]               = useState<number | null>(null);
  const [commentTexts, setCommentTexts]                 = useState<Record<number, string>>({});
  const [savingCommentId, setSavingCommentId]           = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!tracking?.patient?.id) { setPatientTrackings([]); return; }
      try {
        setLoading(true);
        if (userRole === "assistant") {
          const filtered = allTrackings.filter((t: any) =>
            t.patient_id === tracking.patient!.id || t.patient?.id === tracking.patient!.id
          );
          const completed = filtered.filter((t) => t.is_completed === "tamamlandı");
          setPatientTrackings(completed.length > 0 ? completed : filtered);
        } else {
          const list = await getPatientTrackingsForDoctor(tracking.patient.id);
          const completed = list.filter((t) => t.is_completed === "tamamlandı");
          setPatientTrackings(completed);
          const comments: Record<number, string> = {};
          completed.forEach((t) => { if (t.doctor_comment) comments[t.id] = t.doctor_comment; });
          setCommentTexts(comments);
        }
      } catch { setPatientTrackings([]); }
      finally { setLoading(false); }
    };
    if (open && tracking) fetchData();
  }, [tracking, open, userRole]);

  if (!tracking) return null;

  const handleSaveComment = async (trackingId: number) => {
    try {
      setSavingCommentId(trackingId);
      const updated = await updateTrackingDoctorComment(trackingId, commentTexts[trackingId] || "");
      setPatientTrackings((prev) => prev.map((t) => (t.id === trackingId ? updated : t)));
      setOpenCommentId(null);
    } catch { alert("Yorum kaydedilemedi!"); }
    finally { setSavingCommentId(null); }
  };

  const patient = tracking.patient as PatientInfo | undefined;
  const initials = patient?.name?.charAt(0).toUpperCase() || "?";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3, maxHeight: "88vh" } } }}>

      {/* Başlık */}
      <DialogTitle sx={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: "1px solid #e8edf5", pb: 1.5,
      }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ width: 36, height: 36, bgcolor: "#fce4ec", color: "#c62828", fontWeight: 700 }}>
            {initials}
          </Avatar>
          <Box>
            <Typography fontWeight={700} color="#0a2d57" lineHeight={1.2}>{patient?.name}</Typography>
            <Typography variant="caption" color="text.secondary">Tansiyon Takip Detayı</Typography>
          </Box>
        </Stack>
        <IconButton size="small" onClick={onClose} sx={{ color: "#9aa5b4" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Sekmeler */}
      <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)}
        sx={{ px: 3, borderBottom: "1px solid #e8edf5", bgcolor: "#fafbff" }}>
        <Tab icon={<PersonIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Kişisel Bilgiler" />
        <Tab icon={<MonitorHeartIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Tansiyon Ölçümleri" />
      </Tabs>

      <DialogContent sx={{ p: 3, overflowY: "auto" }}>
        {/* Tab 0 - Kişisel Bilgiler */}
        {tabIndex === 0 && (
          <PatientCardContent patient={{ id: patient?.id ?? 0, ...patient } as any} />
        )}

        {/* Tab 1 - Tansiyon Ölçümleri */}
        {tabIndex === 1 && (
          loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
              <CircularProgress sx={{ color: "#c62828" }} />
            </Box>
          ) : patientTrackings.length === 0 ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <MonitorHeartIcon sx={{ fontSize: 36, color: "#d0d7e3", mb: 1 }} />
              <Typography color="text.secondary">Henüz tamamlanmış tansiyon takibi bulunmuyor.</Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {patientTrackings.map((t) => (
                <Box key={t.id} sx={{ border: "1px solid #e8edf5", borderRadius: 2, overflow: "hidden" }}>
                  {/* Takip başlığı */}
                  <Box
                    onClick={() => setOpenAccordionId(openAccordionId === t.id ? null : t.id)}
                    sx={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      px: 2, py: 1.5, bgcolor: "#f8faff", cursor: "pointer",
                      "&:hover": { bgcolor: "#f0f6ff" },
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Typography variant="subtitle2" fontWeight={700} color="#0a2d57">
                        {new Date(t.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                      </Typography>
                      <Chip
                        label={t.is_completed === "tamamlandı" ? "Tamamlandı" : "Eksik"} size="small"
                        sx={{
                          bgcolor: t.is_completed === "tamamlandı" ? "#e8f5e9" : "#fff3e0",
                          color: t.is_completed === "tamamlandı" ? "#2e7d32" : "#e65100",
                          fontWeight: 600, fontSize: 11,
                        }}
                      />
                      {userRole !== "assistant" && (
                        <IconButton size="small" onClick={(e) => {
                          e.stopPropagation();
                          setOpenAccordionId(t.id);
                          setOpenCommentId(openCommentId === t.id ? null : t.id);
                          if (!commentTexts[t.id]) setCommentTexts((prev) => ({ ...prev, [t.id]: "" }));
                        }} sx={{ color: "#9aa5b4" }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="caption" color="text.secondary">
                        {t.start_time} – {t.end_time} · {t.period_hours}s aralık
                      </Typography>
                      {openAccordionId === t.id ? <ExpandLessIcon sx={{ color: "#9aa5b4" }} /> : <ExpandMoreIcon sx={{ color: "#9aa5b4" }} />}
                    </Stack>
                  </Box>

                  <Collapse in={openAccordionId === t.id}>
                    <Box sx={{ p: 2 }}>
                      {/* Doktor yorum düzenleme */}
                      {userRole !== "assistant" && openCommentId === t.id && (
                        <Box sx={{ mb: 2, p: 2, bgcolor: "#f8faff", borderRadius: 2, border: "1px solid #e0e7ef" }}>
                          <Typography variant="subtitle2" fontWeight={700} color="#0a2d57" mb={1}>
                            Doktor Açıklaması
                          </Typography>
                          <TextField
                            multiline minRows={3} fullWidth size="small"
                            value={commentTexts[t.id] || ""}
                            onChange={(e) => setCommentTexts((prev) => ({ ...prev, [t.id]: e.target.value }))}
                            placeholder="Hasta için açıklama yazın..."
                          />
                          <Stack direction="row" justifyContent="flex-end" spacing={1} mt={1.5}>
                            <Button size="small" onClick={() => setOpenCommentId(null)}
                              disabled={savingCommentId === t.id} sx={{ color: "#6b7a90" }}>
                              Kapat
                            </Button>
                            <Button variant="contained" size="small"
                              startIcon={<SaveIcon fontSize="small" />}
                              onClick={() => handleSaveComment(t.id)}
                              disabled={savingCommentId === t.id}
                              sx={{ bgcolor: "#0a2d57", "&:hover": { bgcolor: "#071d3c" } }}>
                              {savingCommentId === t.id ? "Kaydediliyor..." : "Kaydet"}
                            </Button>
                          </Stack>
                        </Box>
                      )}

                      {/* Mevcut doktor yorumu */}
                      {t.doctor_comment && openCommentId !== t.id && (
                        <Box sx={{ mb: 2, p: 2, bgcolor: "#f8faff", borderRadius: 2, border: "1px solid #e8edf5" }}>
                          <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                            Doktor Yorumu
                          </Typography>
                          <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                            {t.doctor_comment}
                          </Typography>
                        </Box>
                      )}

                      {/* Ölçüm tablosu */}
                      <Box sx={{ border: "1px solid #e8edf5", borderRadius: 2, overflow: "hidden" }}>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ bgcolor: "#f8faff" }}>
                                <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5" }}>Saat</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5" }}>Sistolik</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5" }}>Diyastolik</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5" }}>Durum</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {(t.measurements || [])
                                .filter((m) => m.systolic !== null && m.diastolic !== null)
                                .map((m) => {
                                  const bpStatus = getBPStatus(m.systolic, m.diastolic);
                                  return (
                                    <TableRow key={m.id} sx={{ "&:hover": { bgcolor: "#f0f6ff" } }}>
                                      <TableCell sx={{ borderColor: "#f0f4fa", fontWeight: 500 }}>
                                        {m.measurement_time}
                                      </TableCell>
                                      <TableCell sx={{ borderColor: "#f0f4fa", fontWeight: 600,
                                        color: bpStatus?.color || "#333" }}>
                                        {m.systolic}
                                      </TableCell>
                                      <TableCell sx={{ borderColor: "#f0f4fa", fontWeight: 600,
                                        color: bpStatus?.color || "#333" }}>
                                        {m.diastolic}
                                      </TableCell>
                                      <TableCell sx={{ borderColor: "#f0f4fa" }}>
                                        {bpStatus && (
                                          <Chip label={bpStatus.label} size="small"
                                            sx={{ bgcolor: bpStatus.bgcolor, color: bpStatus.color,
                                              fontWeight: 600, fontSize: 11 }} />
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    </Box>
                  </Collapse>
                </Box>
              ))}
            </Stack>
          )
        )}
      </DialogContent>

      <Box sx={{ display: "flex", justifyContent: "flex-end", px: 3, pb: 2, borderTop: "1px solid #e8edf5" }}>
        <Button variant="outlined" onClick={onClose} sx={{ color: "#6b7a90", borderColor: "#d0d7e3" }}>
          Kapat
        </Button>
      </Box>
    </Dialog>
  );
};

export default BloodPressureModal;
