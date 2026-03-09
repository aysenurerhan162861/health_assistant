"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  Box,
  IconButton,
  Typography,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EditIcon from "@mui/icons-material/Edit";
import { BloodPressureTracking, PatientInfo } from "@/types/BloodPressure";
import { User } from "@/types/user";
import {
  getPatientTrackingsForDoctor,
  updateTrackingDoctorComment,
} from "@/services/BloodPressureApi";

interface BloodPressureModalProps {
  open: boolean;
  onClose: () => void;
  tracking: (BloodPressureTracking & { patient?: User }) | null;
  userRole?: "doctor" | "assistant";
  allTrackings?: (BloodPressureTracking & { patient?: User })[];
}

const BloodPressureModal: React.FC<BloodPressureModalProps> = ({
  open,
  onClose,
  tracking,
  userRole = "doctor",
  allTrackings = [],
}) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [patientTrackings, setPatientTrackings] = useState<BloodPressureTracking[]>([]);
  const [loading, setLoading] = useState(false);
  const [openAccordionId, setOpenAccordionId] = useState<number | null>(null);
  const [openCommentAccordionId, setOpenCommentAccordionId] = useState<number | null>(null);
  const [commentTexts, setCommentTexts] = useState<Record<number, string>>({});
  const [savingCommentId, setSavingCommentId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!tracking?.patient?.id) {
        setPatientTrackings([]);
        return;
      }
      try {
        setLoading(true);
        if (userRole === "assistant") {
          // allTrackings içinden bu hastanın kayıtlarını filtrele
          const filtered = allTrackings.filter((t: any) =>
            t.patient_id === tracking.patient!.id || t.patient?.id === tracking.patient!.id
          );
          const completed = filtered.filter((t) => t.is_completed === "tamamlandı");
          setPatientTrackings(completed.length > 0 ? completed : filtered);
        } else {
          const trackings = await getPatientTrackingsForDoctor(tracking.patient.id);
          const completedTrackings = trackings.filter((t) => t.is_completed === "tamamlandı");
          setPatientTrackings(completedTrackings);
          const comments: Record<number, string> = {};
          completedTrackings.forEach((t) => {
            if (t.doctor_comment) comments[t.id] = t.doctor_comment;
          });
          setCommentTexts(comments);
        }
      } catch (err) {
        console.error("Tansiyon takipleri alınamadı:", err);
        setPatientTrackings([]);
      } finally {
        setLoading(false);
      }
    };

    if (open && tracking) fetchData();
  }, [tracking, open, userRole]);

  if (!tracking) return null;

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => setTabIndex(newValue);

  const toggleAccordion = (trackingId: number) => {
    setOpenAccordionId(openAccordionId === trackingId ? null : trackingId);
  };

  const toggleCommentAccordion = (trackingId: number) => {
    if (openAccordionId !== trackingId) setOpenAccordionId(trackingId);
    if (openCommentAccordionId === trackingId) {
      setOpenCommentAccordionId(null);
    } else {
      setOpenCommentAccordionId(trackingId);
      if (!commentTexts[trackingId]) {
        setCommentTexts((prev) => ({ ...prev, [trackingId]: "" }));
      }
    }
  };

  const handleSaveComment = async (trackingId: number) => {
    try {
      setSavingCommentId(trackingId);
      const updated = await updateTrackingDoctorComment(trackingId, commentTexts[trackingId] || "");
      setPatientTrackings((prev) => prev.map((t) => (t.id === trackingId ? updated : t)));
      setOpenCommentAccordionId(null);
    } catch (err) {
      console.error("Yorum kaydedilemedi:", err);
      alert("Yorum kaydedilemedi!");
    } finally {
      setSavingCommentId(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        Detaylar
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ display: "flex", flexDirection: "column", height: "70vh", p: 0 }}>
        <Box sx={{ px: 3 }}>
          <Tabs value={tabIndex} onChange={handleTabChange}>
            <Tab label="Kişisel Bilgiler" />
            <Tab label="Tansiyon Ölçümleri" />
          </Tabs>
        </Box>

        <Box sx={{ flex: 1, overflowY: "auto", p: 3 }}>
          {/* TAB 0 - Kişisel Bilgiler */}
          {tabIndex === 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box><Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>Hasta Adı Soyadı:</Typography><Typography variant="body1">{tracking.patient?.name || "-"}</Typography></Box>
              <Box><Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>Yaş:</Typography><Typography variant="body1">{tracking.patient?.age || "-"}</Typography></Box>
              <Box><Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>Cinsiyet:</Typography><Typography variant="body1">{tracking.patient?.gender || "-"}</Typography></Box>
              <Box><Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>Telefon:</Typography><Typography variant="body1">{(tracking.patient as PatientInfo)?.phone || "-"}</Typography></Box>
              <Box><Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>Email:</Typography><Typography variant="body1">{(tracking.patient as PatientInfo)?.email || "-"}</Typography></Box>
              <Box><Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>Kan Grubu:</Typography><Typography variant="body1">{(tracking.patient as PatientInfo)?.blood_type || "-"}</Typography></Box>
              <Box><Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>Kronik Hastalıklar:</Typography><Typography variant="body1">{(tracking.patient as PatientInfo)?.chronic_diseases || "-"}</Typography></Box>
              <Box><Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>Alerjiler:</Typography><Typography variant="body1">{(tracking.patient as PatientInfo)?.allergies || "-"}</Typography></Box>
              <Box><Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>Notlar / Açıklamalar:</Typography><Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>{tracking.patient?.note || "-"}</Typography></Box>
            </Box>
          )}

          {/* TAB 1 - Tansiyon Ölçümleri */}
          {tabIndex === 1 && (
            <Box>
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}><CircularProgress /></Box>
              ) : patientTrackings.length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                  Henüz tamamlanmış tansiyon takibi bulunmuyor.
                </Typography>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {patientTrackings.map((t) => (
                    <Accordion
                      key={t.id}
                      expanded={openAccordionId === t.id}
                      onChange={() => toggleAccordion(t.id)}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", pr: 2 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {new Date(t.date).toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" })}
                            </Typography>
                            <Chip
                              label={t.is_completed === "tamamlandı" ? "Tamamlandı" : "Eksik"}
                              color={t.is_completed === "tamamlandı" ? "success" : "warning"}
                              size="small"
                            />
                            {/* Edit butonu sadece doktora görünür */}
                            {userRole !== "assistant" && (
                              <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleCommentAccordion(t.id); }} sx={{ ml: 1 }}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {t.start_time} - {t.end_time} ({t.period_hours} saat)
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          {/* Doktor Açıklama - sadece doktora */}
                          {userRole !== "assistant" && openCommentAccordionId === t.id && (
                            <Box sx={{ p: 2, borderRadius: 2, backgroundColor: "#f7f9fc", border: "1px solid #e0e7ef", mb: 2 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Doktor Açıklaması</Typography>
                              <TextField
                                label="Açıklama"
                                multiline
                                minRows={3}
                                fullWidth
                                value={commentTexts[t.id] || ""}
                                onChange={(e) => setCommentTexts((prev) => ({ ...prev, [t.id]: e.target.value }))}
                                variant="outlined"
                                size="small"
                              />
                              <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", mt: 2 }}>
                                <Button variant="outlined" size="small" onClick={() => setOpenCommentAccordionId(null)} disabled={savingCommentId === t.id}>Kapat</Button>
                                <Button variant="contained" size="small" onClick={() => handleSaveComment(t.id)} disabled={savingCommentId === t.id} sx={{ bgcolor: "#0a2d57", "&:hover": { bgcolor: "#082147" } }}>
                                  {savingCommentId === t.id ? "Kaydediliyor..." : "Kaydet"}
                                </Button>
                              </Box>
                            </Box>
                          )}

                          {/* Mevcut Doktor Yorumu */}
                          {t.doctor_comment && openCommentAccordionId !== t.id && (
                            <Box sx={{ p: 2, borderRadius: 1, backgroundColor: "#f0f0f0", border: "1px solid #e0e0e0" }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Doktor Yorumu:</Typography>
                              <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>{t.doctor_comment}</Typography>
                            </Box>
                          )}

                          {/* Ölçüm Tablosu */}
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: "bold" }}>Saat</TableCell>
                                  <TableCell sx={{ fontWeight: "bold" }}>Sistolik</TableCell>
                                  <TableCell sx={{ fontWeight: "bold" }}>Diyastolik</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {(t.measurements || [])
                                  .filter((m) => m.systolic !== null && m.diastolic !== null)
                                  .map((measurement) => (
                                    <TableRow key={measurement.id}>
                                      <TableCell>{measurement.measurement_time}</TableCell>
                                      <TableCell>{measurement.systolic}</TableCell>
                                      <TableCell>{measurement.diastolic}</TableCell>
                                    </TableRow>
                                  ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default BloodPressureModal;