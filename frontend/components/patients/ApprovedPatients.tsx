"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Box, Card, Typography, Avatar, Button, Dialog, DialogTitle,
  DialogContent, MenuItem, TextField, Snackbar, Alert, Stack,
  Tabs, Tab, InputAdornment, Chip, Divider, IconButton, CircularProgress
} from "@mui/material";
import SearchIcon         from "@mui/icons-material/Search";
import PeopleIcon         from "@mui/icons-material/People";
import PersonIcon         from "@mui/icons-material/Person";
import ChatIcon           from "@mui/icons-material/Chat";
import CloseIcon          from "@mui/icons-material/Close";
import AssignmentIndIcon  from "@mui/icons-material/AssignmentInd";

import { getApprovedPatients }                         from "../../services/PatientApi";
import { getStaffList }                                from "../../services/StaffApi";
import { grantPatientPermission, revokePatientPermission } from "../../services/AssistantApi";
import { User }           from "../../types/Staff";
import PatientCardModal   from "./PatientCardContent";
import ChatWindow         from "../message/ChatWindow";
import { useSearchParams } from "next/navigation";
import GradCamViewer from "components/mr/GradCamViewer";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import DownloadIcon from "@mui/icons-material/Download";
import ReportList from "components/labs/ReportList";
import PatientMealsTable from "components/doctors/PatientMealsTable";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Collapse,
} from "@mui/material";
import { getPatientTrackingsForDoctor, updateTrackingDoctorComment } from "@/services/BloodPressureApi";
import { getPatientLabReports } from "@/services/LabApi";
import { getPatientMealsForDoctor } from "@/services/MealApi";
import BiotechIcon from "@mui/icons-material/Biotech";
import ScienceIcon from "@mui/icons-material/Science";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import axios from "axios";

const initials = (name?: string) =>
  (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

const ApprovedPatients: React.FC = () => {
  const [patients, setPatients]                   = useState<User[]>([]);
  const [loading, setLoading]                     = useState(false);
  const [staff, setStaff]                         = useState<User[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [selectedAssistant, setSelectedAssistant] = useState<number | null>(null);
  const [snackbar, setSnackbar]                   = useState<{ open: boolean; message: string; severity: "success" | "error" | "info" }>({ open: false, message: "", severity: "info" });
  const [doctorId, setDoctorId]                   = useState<number | null>(null);
  const [selectedPatient, setSelectedPatient]     = useState<User | null>(null);
  const [detailTab, setDetailTab]                 = useState(0);
  const [search, setSearch]                       = useState("");
  const [mrScans, setMrScans] = useState<any[]>([]);
  const [labReports, setLabReports] = useState<any[]>([]);
  const [meals, setMeals] = useState<any[]>([]);
  const [bpTrackings, setBpTrackings] = useState<any[]>([]);
  const [tabLoading, setTabLoading] = useState(false);
  const [mrCommentId, setMrCommentId] = useState<number | null>(null);
const [mrCommentText, setMrCommentText] = useState("");
const [mrSaving, setMrSaving] = useState(false);

const [openAccordionId, setOpenAccordionId] = useState<number | null>(null);
const [openCommentId, setOpenCommentId] = useState<number | null>(null);
const [commentTexts, setCommentTexts] = useState<Record<number, string>>({});
const [savingCommentId, setSavingCommentId] = useState<number | null>(null);

  const searchParams = useSearchParams();
  const openChat     = searchParams.get("openChat");

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const u = JSON.parse(localStorage.getItem("user") || "{}");
        setDoctorId(u.id ?? null);
      } catch { /* ignore */ }
    }
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [patientsData, staffData] = await Promise.all([
        getApprovedPatients(),
        getStaffList(),
      ]);
      setPatients(patientsData);
      setStaff(staffData);
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || "Veri alınamadı", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (openChat && patients.length > 0) {
      const target = patients.find((p) => p.id === Number(openChat));
      if (target) { setSelectedPatient(target); setDetailTab(2); }
    }
  }, [openChat, patients]);

  useEffect(() => {
  if (!selectedPatient) return;
  const token = localStorage.getItem("token") || "";
  const headers = { "token-header": `Bearer ${token}` };
  const pid = selectedPatient.id;

  const fetchTabData = async () => {
    setTabLoading(true);
    try {
      if (detailTab === 3) {
        const res = await axios.get(`http://localhost:8000/api/mr_scans/patient/${pid}`, { headers });
        setMrScans(res.data);
      }
      if (detailTab === 4) {
        const res = await axios.get(`http://localhost:8000/api/lab_reports/patient/${pid}`, { headers });
        setLabReports(res.data);
      }
      if (detailTab === 5) {
        const res = await axios.get(`http://localhost:8000/api/meals/doctor/patients/${pid}/meals`, { headers });
        setMeals(res.data);
      }
      if (detailTab === 6) {
        const res = await axios.get(`http://localhost:8000/api/blood_pressure/doctor/patients/${pid}/trackings`, { headers });
        const completed = res.data.filter((t: any) => t.is_completed === "tamamlandı");
        setBpTrackings(completed);
        const comments: Record<number, string> = {};
        completed.forEach((t: any) => { if (t.doctor_comment) comments[t.id] = t.doctor_comment; });
        setCommentTexts(comments);
      }
    } catch (err) {
      console.error("Tab verisi alınamadı:", err);
    } finally {
      setTabLoading(false);
    }
  };

  fetchTabData();
}, [detailTab, selectedPatient]);

  const handleGrantPermission = async () => {
    if (!selectedPatientId || !selectedAssistant || !doctorId) {
      setSnackbar({ open: true, message: "Lütfen bir hasta ve asistan seçin", severity: "info" });
      return;
    }
    try {
      await grantPatientPermission(doctorId, selectedAssistant, selectedPatientId);
      setSnackbar({ open: true, message: "İzin başarıyla verildi", severity: "success" });
      setSelectedAssistant(null);
      fetchData();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.detail || "İzin verilemedi", severity: "error" });
    }
  };

  const handleRevokePermission = async () => {
    if (!selectedPatientId || !selectedAssistant || !doctorId) {
      setSnackbar({ open: true, message: "Lütfen bir hasta ve asistan seçin", severity: "info" });
      return;
    }
    try {
      await revokePatientPermission(doctorId, selectedAssistant, selectedPatientId);
      setSnackbar({ open: true, message: "İzin başarıyla kaldırıldı", severity: "success" });
      setSelectedAssistant(null);
      fetchData();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.detail || "İzin kaldırılamadı", severity: "error" });
    }
  };

const openDetail = (patient: User, tab = 0) => {
  setSelectedPatient(patient);
  setSelectedPatientId(patient.id);
  setDetailTab(tab);
  setSelectedAssistant(null);
  setMrScans([]);
  setLabReports([]);
  setMeals([]);
  setBpTrackings([]);
  setOpenAccordionId(null);
  setOpenCommentId(null);
  setMrCommentId(null);
  setMrCommentText("");
};

const handleSaveBpComment = async (trackingId: number) => {
  try {
    setSavingCommentId(trackingId);
    const updated = await updateTrackingDoctorComment(trackingId, commentTexts[trackingId] || "");
    setBpTrackings((prev: any[]) => prev.map((t) => (t.id === trackingId ? updated : t)));
    setOpenCommentId(null);
  } catch { alert("Yorum kaydedilemedi!"); }
  finally { setSavingCommentId(null); }
};

const handleSaveMrComment = async (scanId: number) => {
  try {
    setMrSaving(true);
    const token = localStorage.getItem("token") || "";
    await axios.patch(
      `http://localhost:8000/api/mr_scans/${scanId}/doctor-comment`,
      { doctor_comment: mrCommentText },
      { headers: { "token-header": `Bearer ${token}` } }
    );
    setMrScans((prev: any[]) => prev.map((s) => s.id === scanId ? { ...s, doctor_comment: mrCommentText, viewed_by_doctor: true } : s));
    setMrCommentId(null);
    setMrCommentText("");
  } catch { alert("Yorum kaydedilemedi!"); }
  finally { setMrSaving(false); }
};

const isSuspicious = (scan: any): boolean => {
  if (scan.lesion_detected) return false;
  const volume = scan.lesion_volume ?? 0;
  return volume > 0 && volume < 200;
};

const getBPStatus = (systolic: number | null, diastolic: number | null) => {
  if (systolic === null || diastolic === null) return null;
  if (systolic >= 140 || diastolic >= 90) return { label: "Yüksek", bgcolor: "#ffebee", color: "#c62828" };
  if (systolic >= 120 || diastolic >= 80) return { label: "Sınırda", bgcolor: "#fff3e0", color: "#e65100" };
  return { label: "Normal", bgcolor: "#e8f5e9", color: "#2e7d32" };
};

  const filtered = useMemo(() =>
    patients.filter((p) =>
      !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase())
    ), [patients, search]);

  return (
    <Box>
      {/* Başlık */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#0a2d57">Onaylı Hastalar</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Onaylanan hastaların listesi ve detay bilgileri
          </Typography>
        </Box>
        <Chip
          icon={<PeopleIcon fontSize="small" />}
          label={`${filtered.length} hasta`}
          sx={{ bgcolor: "#e8f5e9", color: "#2e7d32", fontWeight: 600 }}
        />
      </Box>

      {/* Arama */}
      <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2, p: 2, mb: 2 }}>
        <TextField
          size="small" fullWidth placeholder="Ad, e-posta veya telefon ile ara..."
          value={search} onChange={(e) => setSearch(e.target.value)}
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
      </Card>

      {/* Liste */}
      {filtered.length === 0 ? (
        <Box sx={{ py: 10, textAlign: "center" }}>
          <PeopleIcon sx={{ fontSize: 44, color: "#d0d7e3", mb: 1.5 }} />
          <Typography color="text.secondary">
            {loading ? "Yükleniyor..." : "Onaylı hasta bulunamadı."}
          </Typography>
        </Box>
      ) : (
        <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2, overflow: "hidden" }}>
          {/* Kolon başlıkları */}
          <Box sx={{
            px: 2.5, py: 1.5, bgcolor: "#f8faff",
            borderBottom: "1px solid #e8edf5",
            display: "grid", gridTemplateColumns: "2fr 2fr 1.4fr auto", gap: 1,
          }}>
            {["Ad Soyad", "E-posta", "Telefon", ""].map((h) => (
              <Typography key={h} variant="caption" fontWeight={700} color="#6b7a90"
                sx={{ textTransform: "uppercase", letterSpacing: 0.6 }}>
                {h}
              </Typography>
            ))}
          </Box>

          <Stack divider={<Divider sx={{ borderColor: "#f0f4fa" }} />}>
            {filtered.map((patient) => (
              <Box key={patient.id} sx={{
                px: 2.5, py: 1.75,
                display: "grid", gridTemplateColumns: "2fr 2fr 1.4fr auto", gap: 1,
                alignItems: "center",
                "&:hover": { bgcolor: "#fafbff" },
                transition: "background .15s",
              }}>
                {/* Ad Soyad */}
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Avatar
                    src={patient.photoUrl || ""}
                    sx={{ width: 36, height: 36, bgcolor: "#e8f5e9", color: "#2e7d32", fontSize: 13, fontWeight: 700 }}
                  >
                    {initials(patient.name)}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight={600} color="#1a2e4a" noWrap>
                      {patient.name || "—"}
                    </Typography>
                    <Chip label="Onaylı" size="small" sx={{
                      bgcolor: "#e8f5e9", color: "#2e7d32",
                      fontWeight: 600, fontSize: 10, height: 17,
                    }} />
                  </Box>
                </Stack>

                {/* E-posta */}
                <Typography variant="body2" color="text.secondary" noWrap>
                  {patient.email || "—"}
                </Typography>

                {/* Telefon */}
                <Typography variant="body2" color="text.secondary" noWrap>
                  {patient.phone || "—"}
                </Typography>

                {/* Aksiyonlar */}
                <Button size="small" variant="outlined"
                  onClick={() => openDetail(patient, 0)}
                  sx={{ fontSize: 12, borderColor: "#d0d7e3", color: "#4a5568", flexShrink: 0,
                    "&:hover": { borderColor: "#0a2d57", color: "#0a2d57", bgcolor: "#f0f6ff" } }}
                >
                  Detay
                </Button>
              </Box>
            ))}
          </Stack>
        </Card>
      )}

      {/* Detay Modal */}
      <Dialog
        open={!!selectedPatient} onClose={() => setSelectedPatient(null)}
        fullWidth maxWidth="md" scroll="paper"
        slotProps={{ paper: { sx: { borderRadius: 3, maxHeight: "85vh" } } }}
      >
        <DialogTitle sx={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderBottom: "1px solid #e8edf5", pb: 1.5, pt: 2,
        }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar
              src={selectedPatient?.photoUrl || ""}
              sx={{ width: 42, height: 42, bgcolor: "#e8f5e9", color: "#2e7d32", fontWeight: 700 }}
            >
              {initials(selectedPatient?.name)}
            </Avatar>
            <Box>
              <Typography fontWeight={700} color="#0a2d57" lineHeight={1.3}>
                {selectedPatient?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedPatient?.email}
              </Typography>
            </Box>
          </Stack>
          <IconButton size="small" onClick={() => setSelectedPatient(null)} sx={{ color: "#9aa5b4" }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

<Tabs value={detailTab} onChange={(_, v) => setDetailTab(v)}
  variant="scrollable" scrollButtons="auto"
  sx={{
    px: 3, borderBottom: "1px solid #e8edf5", bgcolor: "#fafbff",
    "& .MuiTab-root": { fontSize: 12, textTransform: "none", fontWeight: 600, minHeight: 44, minWidth: "auto", px: 1.5 },
    "& .Mui-selected": { color: "#0a2d57" },
    "& .MuiTabs-indicator": { bgcolor: "#0a2d57" },
  }}>
  <Tab icon={<PersonIcon fontSize="small" />} iconPosition="start" label="Bilgiler" />
  <Tab icon={<AssignmentIndIcon fontSize="small" />} iconPosition="start" label="İzinler" />
  <Tab icon={<ChatIcon fontSize="small" />} iconPosition="start" label="Mesajlar" />
  <Tab icon={<BiotechIcon fontSize="small" />} iconPosition="start" label="MR" />
  <Tab icon={<ScienceIcon fontSize="small" />} iconPosition="start" label="Tahlil" />
  <Tab icon={<RestaurantIcon fontSize="small" />} iconPosition="start" label="Öğün" />
  <Tab icon={<MonitorHeartIcon fontSize="small" />} iconPosition="start" label="Tansiyon" />
</Tabs>
        <DialogContent sx={{ p: 3 }}>
          {detailTab === 0 && selectedPatient && (
            <PatientCardModal patient={selectedPatient} />
          )}

          {detailTab === 1 && selectedPatient && (
            <Box>
              <Typography variant="subtitle2" color="#0a2d57" fontWeight={700} mb={0.5}>
                Asistana Erişim İzni
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2.5 }}>
                Seçilen asistana bu hasta için görüntüleme iznini verin veya kaldırın.
              </Typography>
              <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2, p: 2.5 }}>
                <TextField
                  select label="Asistan Seç" size="small" fullWidth
                  value={selectedAssistant ?? ""}
                  onChange={(e) => setSelectedAssistant(Number(e.target.value))}
                >
                  <MenuItem value="" disabled><em>Asistan seçiniz...</em></MenuItem>
                  {staff.map((s) => (
                    <MenuItem key={s.id} value={s.id}>{s.name} ({s.email})</MenuItem>
                  ))}
                </TextField>
                <Stack direction="row" spacing={1.5} mt={2}>
                  <Button variant="contained" disabled={!selectedAssistant}
                    onClick={() => { setSelectedPatientId(selectedPatient.id); handleGrantPermission(); }}
                    sx={{ bgcolor: "#0a2d57", "&:hover": { bgcolor: "#071d3c" }, borderRadius: 2 }}
                  >
                    İzin Ver
                  </Button>
                  <Button variant="outlined" color="error" disabled={!selectedAssistant}
                    onClick={() => { setSelectedPatientId(selectedPatient.id); handleRevokePermission(); }}
                    sx={{ borderRadius: 2 }}
                  >
                    İzni Kaldır
                  </Button>
                </Stack>
              </Card>
            </Box>
          )}

          {detailTab === 2 && selectedPatient && doctorId && typeof window !== "undefined" && (
            <ChatWindow
              room={`chat_${Math.min(doctorId, selectedPatient.id)}_${Math.max(doctorId, selectedPatient.id)}`}
              senderId={doctorId} receiverId={selectedPatient.id} role="doctor"
            />
          )}
          {/* MR Tab */}
{detailTab === 3 && selectedPatient && (
  tabLoading ? (
    <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
      <CircularProgress size={28} />
    </Box>
  ) : mrScans.length === 0 ? (
    <Box sx={{ py: 6, textAlign: "center" }}>
      <BiotechIcon sx={{ fontSize: 36, color: "#d0d7e3", mb: 1 }} />
      <Typography color="text.secondary">MR görüntüsü bulunamadı.</Typography>
    </Box>
  ) : (
    <Stack spacing={2}>
      {mrScans.map((scan: any) => {
        const suspicious = isSuspicious(scan);
        const isOpen = openAccordionId === scan.id;
        const confidencePct = scan.dice_confidence != null ? Math.round(scan.dice_confidence * 100) : null;

        return (
          <Box key={scan.id} sx={{
            border: "1px solid #e8edf5", borderRadius: 2, overflow: "hidden",
            borderLeft: `4px solid ${scan.lesion_detected ? "#c62828" : suspicious ? "#f9a825" : "#2e7d32"}`,
          }}>
            {/* Başlık */}
            <Box
              onClick={() => setOpenAccordionId(isOpen ? null : scan.id)}
              sx={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                px: 2, py: 1.5, bgcolor: "#f8faff", cursor: "pointer",
                "&:hover": { bgcolor: "#f0f6ff" },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <BiotechIcon sx={{ color: "#6a1b9a", fontSize: 18 }} />
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} color="#0a2d57" sx={{ lineHeight: 1.2 }}>
                    {scan.file_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(scan.upload_date).toLocaleString("tr-TR")}
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Chip
                  label={scan.status === "done" ? "Tamamlandı" : scan.status === "pending" ? "İşleniyor" : "Hata"}
                  size="small"
                  sx={{
                    bgcolor: scan.status === "done" ? "#e8f5e9" : scan.status === "pending" ? "#fff3e0" : "#ffebee",
                    color: scan.status === "done" ? "#2e7d32" : scan.status === "pending" ? "#e65100" : "#c62828",
                    fontWeight: 600, fontSize: 11,
                  }}
                />
                {scan.status === "done" && (
                  <Chip
                    label={scan.lesion_detected ? "⚠ Lezyon Var" : suspicious ? "⚡ Şüpheli" : "✓ Normal"}
                    size="small"
                    sx={{
                      bgcolor: scan.lesion_detected ? "#ffebee" : suspicious ? "#fff8e1" : "#e8f5e9",
                      color: scan.lesion_detected ? "#c62828" : suspicious ? "#f57f17" : "#2e7d32",
                      fontWeight: 600, fontSize: 11,
                    }}
                  />
                )}
                <IconButton size="small" onClick={(e) => {
                  e.stopPropagation();
                  setOpenAccordionId(scan.id);
                  setMrCommentId(mrCommentId === scan.id ? null : scan.id);
                  setMrCommentText(scan.doctor_comment || "");
                }} sx={{ color: "#9aa5b4" }}>
                  <EditIcon fontSize="small" />
                </IconButton>
                {isOpen ? <ExpandLessIcon sx={{ color: "#9aa5b4" }} /> : <ExpandMoreIcon sx={{ color: "#9aa5b4" }} />}
              </Stack>
            </Box>

            {/* Genişleme */}
            <Collapse in={isOpen}>
              <Box sx={{ p: 2 }}>
                {scan.status === "done" && (
                  <>
                    {/* Metrikler */}
                    <Stack direction="row" spacing={1.5} flexWrap="wrap" mb={2}>
                      <Box sx={{ p: 1.5, bgcolor: "#f8faff", border: "1px solid #e8edf5", borderRadius: 2, minWidth: 110 }}>
                        <Typography variant="caption" color="text.secondary">Lezyon</Typography>
                        <Typography variant="body2" fontWeight={700}
                          color={scan.lesion_detected ? "#c62828" : suspicious ? "#f57f17" : "#2e7d32"}>
                          {scan.lesion_detected ? "Tespit Edildi" : suspicious ? "Şüpheli" : "Yok"}
                        </Typography>
                      </Box>
                      {scan.lesion_volume != null && (
                        <Box sx={{ p: 1.5, bgcolor: "#f8faff", border: "1px solid #e8edf5", borderRadius: 2, minWidth: 110 }}>
                          <Typography variant="caption" color="text.secondary">Hacim</Typography>
                          <Typography variant="body2" fontWeight={700}>
                            {scan.lesion_volume.toLocaleString()} voksel
                          </Typography>
                        </Box>
                      )}
                      {confidencePct != null && (
                        <Box sx={{ p: 1.5, bgcolor: "#f8faff", border: "1px solid #e8edf5", borderRadius: 2, minWidth: 110 }}>
                          <Typography variant="caption" color="text.secondary">Model Güveni</Typography>
                          <Typography variant="body2" fontWeight={700}>%{confidencePct}</Typography>
                        </Box>
                      )}
                    </Stack>

                    {/* AI yorumu */}
                    {scan.ai_comment && (
                      <Box sx={{
                        mb: 2, p: 2, borderRadius: 2,
                        bgcolor: scan.lesion_detected ? "#ffebee" : suspicious ? "#fff8e1" : "#e3f2fd",
                        borderLeft: `3px solid ${scan.lesion_detected ? "#c62828" : suspicious ? "#f9a825" : "#1565c0"}`,
                      }}>
                        <Stack direction="row" alignItems="center" spacing={0.75} mb={0.5}>
                          <SmartToyIcon sx={{ fontSize: 15, color: scan.lesion_detected ? "#c62828" : suspicious ? "#f57f17" : "#1565c0" }} />
                          <Typography variant="caption" fontWeight={700}
                            color={scan.lesion_detected ? "#c62828" : suspicious ? "#f57f17" : "#1565c0"}>
                            AI Değerlendirmesi
                          </Typography>
                        </Stack>
                        <Typography variant="body2">{scan.ai_comment}</Typography>
                      </Box>
                    )}

                    {/* GradCAM */}
                    <GradCamViewer scanId={scan.id} hasGradcam={!!scan.gradcam_path} />

                    {/* Doktor yorum düzenleme */}
                    {mrCommentId === scan.id ? (
                      <Box sx={{ mt: 1.5, p: 2, bgcolor: "#f8faff", borderRadius: 2, border: "1px solid #e0e7ef" }}>
                        <Typography variant="subtitle2" fontWeight={700} color="#0a2d57" mb={1}>
                          Doktor Açıklaması
                        </Typography>
                        <TextField
                          multiline minRows={3} fullWidth size="small"
                          value={mrCommentText}
                          onChange={(e: any) => setMrCommentText(e.target.value)}
                          placeholder="Hasta için açıklama yazın..."
                        />
                        <Stack direction="row" justifyContent="flex-end" spacing={1} mt={1.5}>
                          <Button size="small" onClick={() => setMrCommentId(null)}
                            disabled={mrSaving} sx={{ color: "#6b7a90" }}>
                            Kapat
                          </Button>
                          <Button variant="contained" size="small"
                            startIcon={<SaveIcon fontSize="small" />}
                            onClick={() => handleSaveMrComment(scan.id)}
                            disabled={mrSaving}
                            sx={{ bgcolor: "#0a2d57", "&:hover": { bgcolor: "#071d3c" } }}>
                            {mrSaving ? "Kaydediliyor..." : "Kaydet"}
                          </Button>
                        </Stack>
                      </Box>
                    ) : scan.doctor_comment ? (
                      <Box sx={{ mt: 1.5, p: 2, bgcolor: "#f3e5f5", borderRadius: 2, borderLeft: "3px solid #6a1b9a" }}>
                        <Stack direction="row" alignItems="center" spacing={0.75} mb={0.5}>
                          <MedicalServicesIcon sx={{ fontSize: 15, color: "#6a1b9a" }} />
                          <Typography variant="caption" fontWeight={700} color="#6a1b9a">Doktor Yorumu</Typography>
                        </Stack>
                        <Typography variant="body2">{scan.doctor_comment}</Typography>
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: "block" }}>
                        Henüz doktor yorumu eklenmemiş.
                      </Typography>
                    )}

                    {/* İndir */}
                    <Box sx={{ mt: 1.5, display: "flex", justifyContent: "flex-end" }}>
                      <Button size="small" variant="outlined" startIcon={<DownloadIcon />}
                        onClick={() => window.open(`http://localhost:8000/api/mr_scans/${scan.id}/file`, "_blank")}
                        sx={{ borderColor: "#0a2d57", color: "#0a2d57", fontSize: 12,
                          "&:hover": { bgcolor: "#e3f0ff" } }}>
                        Dosyayı İndir
                      </Button>
                    </Box>
                  </>
                )}

                {scan.status === "pending" && (
                  <Box sx={{ py: 4, textAlign: "center" }}>
                    <CircularProgress size={28} sx={{ color: "#e65100", mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">Analiz devam ediyor...</Typography>
                  </Box>
                )}
              </Box>
            </Collapse>
          </Box>
        );
      })}
    </Stack>
  )
)}
        {/* Tahlil Tab */}
{detailTab === 4 && selectedPatient && (
  tabLoading ? (
    <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
      <CircularProgress size={28} />
    </Box>
  ) : (
    <ReportList
      reports={labReports}
      patientId={selectedPatient.id}
      refreshReports={() => {
        const token = localStorage.getItem("token") || "";
        axios.get(`http://localhost:8000/api/lab_reports/patient/${selectedPatient.id}`, {
          headers: { "token-header": `Bearer ${token}` }
        }).then(res => setLabReports(res.data)).catch(() => {});
      }}
      userRole="doctor"
    />
  )
)}

{/* Öğün Tab */}
{detailTab === 5 && selectedPatient && (
  tabLoading ? (
    <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
      <CircularProgress size={28} />
    </Box>
  ) : (
    <PatientMealsTable
      meals={meals}
      patientId={selectedPatient.id}
      refreshMeals={() => {
        const token = localStorage.getItem("token") || "";
        axios.get(`http://localhost:8000/api/meals/doctor/patients/${selectedPatient.id}/meals`, {
          headers: { "token-header": `Bearer ${token}` }
        }).then(res => setMeals(res.data)).catch(() => {});
      }}
      userRole="doctor"
    />
  )
)}

{/* Tansiyon Tab */}
{detailTab === 6 && selectedPatient && (
  tabLoading ? (
    <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
      <CircularProgress size={28} />
    </Box>
  ) : bpTrackings.length === 0 ? (
    <Box sx={{ py: 6, textAlign: "center" }}>
      <MonitorHeartIcon sx={{ fontSize: 36, color: "#d0d7e3", mb: 1 }} />
      <Typography color="text.secondary">Henüz tamamlanmış tansiyon takibi bulunmuyor.</Typography>
    </Box>
  ) : (
    <Stack spacing={2}>
      {bpTrackings.map((t: any) => (
        <Box key={t.id} sx={{ border: "1px solid #e8edf5", borderRadius: 2, overflow: "hidden" }}>
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
              <IconButton size="small" onClick={(e) => {
                e.stopPropagation();
                setOpenAccordionId(t.id);
                setOpenCommentId(openCommentId === t.id ? null : t.id);
                if (!commentTexts[t.id]) setCommentTexts((prev) => ({ ...prev, [t.id]: "" }));
              }} sx={{ color: "#9aa5b4" }}>
                <EditIcon fontSize="small" />
              </IconButton>
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
              {openCommentId === t.id && (
                <Box sx={{ mb: 2, p: 2, bgcolor: "#f8faff", borderRadius: 2, border: "1px solid #e0e7ef" }}>
                  <Typography variant="subtitle2" fontWeight={700} color="#0a2d57" mb={1}>
                    Doktor Açıklaması
                  </Typography>
                  <TextField
                    multiline minRows={3} fullWidth size="small"
                    value={commentTexts[t.id] || ""}
                    onChange={(e: any) => setCommentTexts((prev) => ({ ...prev, [t.id]: e.target.value }))}
                    placeholder="Hasta için açıklama yazın..."
                  />
                  <Stack direction="row" justifyContent="flex-end" spacing={1} mt={1.5}>
                    <Button size="small" onClick={() => setOpenCommentId(null)}
                      disabled={savingCommentId === t.id} sx={{ color: "#6b7a90" }}>
                      Kapat
                    </Button>
                    <Button variant="contained" size="small"
                      startIcon={<SaveIcon fontSize="small" />}
                      onClick={() => handleSaveBpComment(t.id)}
                      disabled={savingCommentId === t.id}
                      sx={{ bgcolor: "#0a2d57", "&:hover": { bgcolor: "#071d3c" } }}>
                      {savingCommentId === t.id ? "Kaydediliyor..." : "Kaydet"}
                    </Button>
                  </Stack>
                </Box>
              )}

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

              <Box sx={{ border: "1px solid #e8edf5", borderRadius: 2, overflow: "hidden" }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f8faff" }}>
                        <TableCell sx={{ fontWeight: 700, color: "#0a2d57" }}>Saat</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#0a2d57" }}>Sistolik</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#0a2d57" }}>Diyastolik</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#0a2d57" }}>Durum</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(t.measurements || [])
                        .filter((m: any) => m.systolic !== null && m.diastolic !== null)
                        .map((m: any) => {
                          const bpStatus = getBPStatus(m.systolic, m.diastolic);
                          return (
                            <TableRow key={m.id} sx={{ "&:hover": { bgcolor: "#f0f6ff" } }}>
                              <TableCell sx={{ fontWeight: 500 }}>{m.measurement_time}</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: bpStatus?.color || "#333" }}>{m.systolic}</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: bpStatus?.color || "#333" }}>{m.diastolic}</TableCell>
                              <TableCell>
                                {bpStatus && (
                                  <Chip label={bpStatus.label} size="small"
                                    sx={{ bgcolor: bpStatus.bgcolor, color: bpStatus.color, fontWeight: 600, fontSize: 11 }} />
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
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ApprovedPatients;
