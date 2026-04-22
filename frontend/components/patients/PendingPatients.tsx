"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Box, Card, Typography, Avatar, Stack, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, CircularProgress,
  Button, TextField, InputAdornment, Chip, Divider, IconButton,
} from "@mui/material";
import SearchIcon        from "@mui/icons-material/Search";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CheckCircleIcon   from "@mui/icons-material/CheckCircle";
import CancelIcon        from "@mui/icons-material/Cancel";
import PersonIcon        from "@mui/icons-material/Person";
import CloseIcon         from "@mui/icons-material/Close";
import InfoOutlinedIcon  from "@mui/icons-material/InfoOutlined";

import { getPendingPatients, approvePatient, rejectPatient, getPatientById } from "../../services/PatientApi";
import { User } from "../../types/Staff";

const initials = (name?: string) =>
  (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

const PendingPatients: React.FC = () => {
  const [patients, setPatients]               = useState<User[]>([]);
  const [loading, setLoading]                 = useState(false);
  const [snackbar, setSnackbar]               = useState<{ open: boolean; message: string; severity: "success" | "error" | "info" }>({ open: false, message: "", severity: "info" });
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);
  const [dialogLoading, setDialogLoading]     = useState(false);
  const [search, setSearch]                   = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchPendingPatients = async () => {
    try {
      setLoading(true);
      setPatients(await getPendingPatients());
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || "Veriler alınamadı", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPendingPatients(); }, []);

  const handleOpenDetail = async (patientId: number) => {
    try {
      setDialogLoading(true);
      setSelectedPatient(await getPatientById(patientId));
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || "Hasta bilgisi alınamadı", severity: "error" });
    } finally {
      setDialogLoading(false);
    }
  };

  const handleAction = async (id: number, action: "approve" | "reject") => {
    try {
      setActionLoadingId(id);
      if (action === "approve") await approvePatient(id);
      else await rejectPatient(id);
      setSnackbar({
        open: true,
        message: action === "approve" ? "Hasta başarıyla onaylandı" : "Hasta reddedildi",
        severity: action === "approve" ? "success" : "info",
      });
      fetchPendingPatients();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || "İşlem başarısız", severity: "error" });
    } finally {
      setActionLoadingId(null);
    }
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
          <Typography variant="h5" fontWeight={700} color="#0a2d57">Onay Bekleyen Hastalar</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Kayıt talebi göndermiş ve onayınızı bekleyen hastalar
          </Typography>
        </Box>
        <Chip
          icon={<HourglassEmptyIcon fontSize="small" />}
          label={`${filtered.length} bekliyor`}
          sx={{ bgcolor: "#fff3e0", color: "#e65100", fontWeight: 600 }}
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
      {loading && filtered.length === 0 ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: "#0a2d57" }} />
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ py: 10, textAlign: "center" }}>
          <HourglassEmptyIcon sx={{ fontSize: 44, color: "#d0d7e3", mb: 1.5 }} />
          <Typography color="text.secondary">Onay bekleyen hasta bulunmuyor.</Typography>
        </Box>
      ) : (
        <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2, overflow: "hidden" }}>
          {/* Kolon başlıkları */}
          <Box sx={{
            px: 2.5, py: 1.5, bgcolor: "#f8faff",
            borderBottom: "1px solid #e8edf5",
            display: "grid", gridTemplateColumns: "2fr 2fr 1.4fr 1.6fr auto", gap: 1,
          }}>
            {["Ad Soyad", "E-posta", "Telefon", "Hasta Notu", ""].map((h) => (
              <Typography key={h} variant="caption" fontWeight={700} color="#6b7a90"
                sx={{ textTransform: "uppercase", letterSpacing: 0.6 }}>
                {h}
              </Typography>
            ))}
          </Box>

          <Stack divider={<Divider sx={{ borderColor: "#f0f4fa" }} />}>
            {filtered.map((patient) => {
              const isActing = actionLoadingId === patient.id;
              return (
                <Box key={patient.id} sx={{
                  px: 2.5, py: 1.75,
                  display: "grid", gridTemplateColumns: "2fr 2fr 1.4fr 1.6fr auto", gap: 1,
                  alignItems: "center",
                  "&:hover": { bgcolor: "#fafbff" },
                  transition: "background .15s",
                }}>
                  {/* Ad Soyad */}
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Avatar
                      src={patient.photoUrl || ""}
                      sx={{ width: 36, height: 36, bgcolor: "#fff3e0", color: "#e65100", fontSize: 13, fontWeight: 700 }}
                    >
                      {initials(patient.name)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600} color="#1a2e4a" noWrap>
                        {patient.name || "—"}
                      </Typography>
                      <Chip label="Bekliyor" size="small" sx={{
                        bgcolor: "#fff3e0", color: "#e65100",
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

                  {/* Not */}
                  <Typography variant="body2" color="text.secondary" noWrap
                    sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                    {patient.about || "—"}
                  </Typography>

                  {/* Aksiyonlar */}
                  <Stack direction="row" spacing={0.75} flexShrink={0}>
                    <IconButton size="small" title="Hasta Bilgileri"
                      onClick={() => handleOpenDetail(patient.id)}
                      sx={{ color: "#6b7a90", "&:hover": { color: "#0a2d57", bgcolor: "#f0f6ff" } }}
                    >
                      <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                    <Button size="small" variant="contained"
                      startIcon={isActing ? undefined : <CheckCircleIcon fontSize="small" />}
                      disabled={isActing}
                      onClick={() => handleAction(patient.id, "approve")}
                      sx={{ bgcolor: "#2e7d32", "&:hover": { bgcolor: "#1b5e20" }, fontSize: 12, px: 1.5, borderRadius: 1.5 }}
                    >
                      {isActing ? "..." : "Onayla"}
                    </Button>
                    <Button size="small" variant="outlined" color="error"
                      startIcon={isActing ? undefined : <CancelIcon fontSize="small" />}
                      disabled={isActing}
                      onClick={() => handleAction(patient.id, "reject")}
                      sx={{ fontSize: 12, px: 1.5, borderRadius: 1.5 }}
                    >
                      {isActing ? "..." : "Reddet"}
                    </Button>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        </Card>
      )}

      {/* Hasta Detay Dialog */}
      <Dialog
        open={!!selectedPatient} onClose={() => setSelectedPatient(null)}
        fullWidth maxWidth="sm"
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderBottom: "1px solid #e8edf5", pb: 1.5, pt: 2,
        }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <PersonIcon sx={{ color: "#0a2d57" }} />
            <Typography fontWeight={700} color="#0a2d57">Hasta Bilgileri</Typography>
          </Stack>
          <IconButton size="small" onClick={() => setSelectedPatient(null)} sx={{ color: "#9aa5b4" }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          {dialogLoading ? (
            <Stack alignItems="center" py={5}>
              <CircularProgress sx={{ color: "#0a2d57" }} />
            </Stack>
          ) : selectedPatient ? (
            <Box>
              <Stack direction="row" spacing={2} alignItems="center" mb={3}>
                <Avatar
                  src={selectedPatient.photoUrl || ""}
                  sx={{ width: 72, height: 72, bgcolor: "#e3f0ff", color: "#1565c0", fontSize: 24, fontWeight: 700 }}
                >
                  {initials(selectedPatient.name)}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700} color="#0a2d57">
                    {selectedPatient.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">{selectedPatient.email}</Typography>
                  <Typography variant="body2" color="text.secondary">{selectedPatient.phone}</Typography>
                </Box>
              </Stack>

              <Divider sx={{ mb: 2, borderColor: "#e8edf5" }} />

              {[
                { label: "Cinsiyet",           value: selectedPatient.gender },
                { label: "Doğum Tarihi",       value: selectedPatient.birth_date },
                { label: "Kan Grubu",          value: selectedPatient.blood_type },
                { label: "Kronik Hastalıklar", value: selectedPatient.chronic_diseases },
                { label: "Alerjiler",          value: selectedPatient.allergies },
                { label: "Not",                value: selectedPatient.about },
              ].filter(({ value }) => Boolean(value)).map(({ label, value }) => (
                <Box key={label} sx={{ display: "flex", gap: 1, mb: 1.25 }}>
                  <Typography variant="body2" fontWeight={600} color="#0a2d57" sx={{ minWidth: 150 }}>
                    {label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">{value}</Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography color="text.secondary" textAlign="center" py={3}>
              Hasta bilgisi bulunamadı.
            </Typography>
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

export default PendingPatients;
