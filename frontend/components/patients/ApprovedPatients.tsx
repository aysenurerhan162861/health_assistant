"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Box, Card, Typography, Avatar, Button, Dialog, DialogTitle,
  DialogContent, MenuItem, TextField, Snackbar, Alert, Stack,
  Tabs, Tab, InputAdornment, Chip, Divider, IconButton,
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
          sx={{
            px: 3, borderBottom: "1px solid #e8edf5", bgcolor: "#fafbff",
            "& .MuiTab-root": { fontSize: 13, textTransform: "none", fontWeight: 600, minHeight: 44 },
            "& .Mui-selected": { color: "#0a2d57" },
            "& .MuiTabs-indicator": { bgcolor: "#0a2d57" },
          }}>
          <Tab icon={<PersonIcon fontSize="small" />} iconPosition="start" label="Kişisel Bilgiler" />
          <Tab icon={<AssignmentIndIcon fontSize="small" />} iconPosition="start" label="İzinler" />
          <Tab icon={<ChatIcon fontSize="small" />} iconPosition="start" label="Mesajlar" />
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
