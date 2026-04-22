"use client";

import React, { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import {
  Box, Typography, Button, Card, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  Alert, Stack, Chip, Grid, CardContent, IconButton, Collapse,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import SendIcon from "@mui/icons-material/Send";
import EditIcon from "@mui/icons-material/Edit";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import {
  BloodPressureTrackingListItem,
  BloodPressureTracking,
  BloodPressureTrackingCreate,
} from "@/types/BloodPressure";
import { getMyTrackings, getTracking, createTracking, updateTracking, sendToDoctor } from "@/services/BloodPressureApi";

const getBPStatus = (systolic: number | null, diastolic: number | null) => {
  if (systolic === null || diastolic === null) return null;
  if (systolic >= 140 || diastolic >= 90) return { label: "Yüksek", bgcolor: "#ffebee", color: "#c62828" };
  if (systolic >= 120 || diastolic >= 80) return { label: "Sınırda", bgcolor: "#fff3e0", color: "#e65100" };
  return { label: "Normal", bgcolor: "#e8f5e9", color: "#2e7d32" };
};

const generateMeasurementTimes = (start: string, end: string, period: number): string[] => {
  const times: string[] = [];
  const [sh = "0", sm = "0"] = start.split(":");
  const [eh = "0", em = "0"] = end.split(":");
  const startMin = parseInt(sh) * 60 + parseInt(sm);
  const endMin = parseInt(eh) * 60 + parseInt(em);
  const periodMin = period * 60;
  if (startMin >= endMin || periodMin <= 0) return times;
  let cur = startMin;
  while (cur <= endMin) {
    times.push(`${Math.floor(cur / 60).toString().padStart(2, "0")}:${(cur % 60).toString().padStart(2, "0")}`);
    cur += periodMin;
  }
  return times;
};

const TansiyonPage: React.FC = () => {
  const [trackings, setTrackings]           = useState<BloodPressureTrackingListItem[]>([]);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [success, setSuccess]               = useState<string | null>(null);

  // Yeni takip dialog
  const [dialogOpen, setDialogOpen]         = useState(false);
  const [submitting, setSubmitting]         = useState(false);
  const [date, setDate]                     = useState("");
  const [startTime, setStartTime]           = useState("08:00");
  const [endTime, setEndTime]               = useState("20:00");
  const [periodHours, setPeriodHours]       = useState(2);

  // Satır ölçüm accordion
  const [openRowId, setOpenRowId]           = useState<number | null>(null);
  const [trackingDetails, setTrackingDetails] = useState<BloodPressureTracking | null>(null);
  const [rowMeasurements, setRowMeasurements] = useState<
    { measurement_time: string; systolic: number | null; diastolic: number | null }[]
  >([]);
  const [savingRowId, setSavingRowId]       = useState<number | null>(null);

  const fetchTrackings = async () => {
    setLoading(true);
    try { setTrackings(await getMyTrackings()); }
    catch (err: any) { setError(err.response?.data?.detail || "Tansiyon kayıtları yüklenemedi"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTrackings(); }, []);

  const handleCreate = async () => {
    if (!date) { setError("Lütfen tarih seçin."); return; }
    if (!startTime || !endTime) { setError("Başlangıç ve bitiş saatlerini seçin."); return; }
    if (periodHours <= 0) { setError("Periyot 0'dan büyük olmalıdır."); return; }
    setSubmitting(true); setError(null);
    try {
      const times = generateMeasurementTimes(startTime, endTime, periodHours);
      const data: BloodPressureTrackingCreate = {
        date, start_time: startTime, end_time: endTime, period_hours: periodHours,
        measurements: times.map((t) => ({ measurement_time: t, systolic: null, diastolic: null })),
      };
      await createTracking(data);
      setSuccess("Tansiyon takibi oluşturuldu. Ölçümleri tablodan girebilirsiniz.");
      setDialogOpen(false);
      setDate(""); setStartTime("08:00"); setEndTime("20:00"); setPeriodHours(2);
      fetchTrackings();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Tansiyon takibi oluşturulamadı");
    } finally { setSubmitting(false); }
  };

  const toggleRowAccordion = async (trackingId: number) => {
    if (openRowId === trackingId) {
      setOpenRowId(null); setTrackingDetails(null); setRowMeasurements([]); return;
    }
    try {
      setOpenRowId(trackingId);
      const details = await getTracking(trackingId);
      setTrackingDetails(details);
      setRowMeasurements(details.measurements.map((m) => ({
        measurement_time: m.measurement_time, systolic: m.systolic, diastolic: m.diastolic,
      })));
    } catch (err: any) {
      setError(err.response?.data?.detail || "Takip detayları yüklenemedi");
    }
  };

  const handleMeasurementChange = (index: number, field: "systolic" | "diastolic", value: string) => {
    setRowMeasurements((prev) => prev.map((m, i) =>
      i === index ? { ...m, [field]: value === "" ? null : parseInt(value, 10) } : m
    ));
  };

  const handleSave = async (trackingId: number, sendToDoctorAfter = false) => {
    if (!trackingDetails) return;
    setSavingRowId(trackingId); setError(null); setSuccess(null);
    try {
      const data: BloodPressureTrackingCreate = {
        date: trackingDetails.date, start_time: trackingDetails.start_time,
        end_time: trackingDetails.end_time, period_hours: trackingDetails.period_hours,
        measurements: rowMeasurements,
      };
      await updateTracking(trackingId, data);
      if (sendToDoctorAfter) await sendToDoctor(trackingId);
      setSuccess(sendToDoctorAfter ? "Ölçümler kaydedildi ve doktora gönderildi." : "Ölçümler kaydedildi.");
      await fetchTrackings();
      setOpenRowId(null); setTrackingDetails(null); setRowMeasurements([]);
    } catch (err: any) {
      setError(err.response?.data?.detail || "İşlem başarısız");
    } finally { setSavingRowId(null); }
  };

  return (
    <Layout>
      <Box sx={{ maxWidth: 1100, mx: "auto" }}>
        {/* Başlık */}
        <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            <Typography variant="h5" fontWeight={700} color="#0a2d57">Tansiyon Takibim</Typography>
            <Typography variant="body2" color="text.secondary">
              Tansiyon ölçümlerinizi kaydedin ve doktorunuza gönderin
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} alignItems="center">
            <Chip
              icon={<MonitorHeartIcon fontSize="small" />}
              label={`${trackings.length} kayıt`}
              sx={{ bgcolor: "#fce4ec", color: "#c62828", fontWeight: 600 }}
            />
            <Button
              variant="contained" startIcon={<AddIcon />}
              onClick={() => { setDialogOpen(true); setError(null); }}
              sx={{ bgcolor: "#0a2d57", "&:hover": { bgcolor: "#071d3c" }, borderRadius: 2 }}
            >
              Yeni Takip Oluştur
            </Button>
          </Stack>
        </Box>

        {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}

        {/* Tablo */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}>
            <CircularProgress sx={{ color: "#c62828" }} />
          </Box>
        ) : (
          <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2, overflow: "hidden" }}>
            {trackings.length === 0 ? (
              <Box sx={{ py: 8, textAlign: "center" }}>
                <MonitorHeartIcon sx={{ fontSize: 40, color: "#d0d7e3", mb: 1 }} />
                <Typography color="text.secondary">Henüz tansiyon takibi oluşturulmamış.</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f8faff" }}>
                      <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5" }}>Tarih</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5" }}>Başlangıç</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5" }}>Bitiş</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5" }}>Periyot</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5" }}>Tamamlanan</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5" }}>Durum</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5" }}>İşlem</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {trackings.map((t) => (
                      <React.Fragment key={t.id}>
                        <TableRow sx={{ "&:hover": { bgcolor: "#f0f6ff" } }}>
                          <TableCell sx={{ borderColor: "#f0f4fa", fontWeight: 500, color: "#1a2e4a" }}>
                            {new Date(t.date).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                          </TableCell>
                          <TableCell sx={{ borderColor: "#f0f4fa", color: "#444" }}>{t.start_time}</TableCell>
                          <TableCell sx={{ borderColor: "#f0f4fa", color: "#444" }}>{t.end_time}</TableCell>
                          <TableCell sx={{ borderColor: "#f0f4fa" }}>
                            <Chip label={`${t.period_hours}s`} size="small"
                              sx={{ bgcolor: "#f3f4f6", color: "#555", fontWeight: 500, fontSize: 11 }} />
                          </TableCell>
                          <TableCell sx={{ borderColor: "#f0f4fa", color: "#6b7a90" }}>
                            {t.completed_count} / {t.measurement_count}
                          </TableCell>
                          <TableCell sx={{ borderColor: "#f0f4fa" }}>
                            <Chip
                              label={t.is_completed === "tamamlandı" ? "Tamamlandı" : "Eksik"} size="small"
                              sx={{
                                bgcolor: t.is_completed === "tamamlandı" ? "#e8f5e9" : "#fff3e0",
                                color: t.is_completed === "tamamlandı" ? "#2e7d32" : "#e65100",
                                fontWeight: 600, fontSize: 11,
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ borderColor: "#f0f4fa" }}>
                            <Button
                              variant="outlined" size="small"
                              startIcon={openRowId === t.id ? <ExpandLessIcon fontSize="small" /> : <EditIcon fontSize="small" />}
                              onClick={() => toggleRowAccordion(t.id)}
                              sx={{ borderColor: "#0a2d57", color: "#0a2d57", fontSize: 11,
                                "&:hover": { bgcolor: "#e3f0ff" } }}
                            >
                              {openRowId === t.id ? "Kapat" : "Ölçümler"}
                            </Button>
                          </TableCell>
                        </TableRow>

                        {/* Ölçüm giriş alanı */}
                        <TableRow>
                          <TableCell colSpan={7} sx={{ p: 0, border: 0 }}>
                            <Collapse in={openRowId === t.id && !!trackingDetails}>
                              <Box sx={{ m: 2, p: 2.5, bgcolor: "#f8faff", borderRadius: 2, border: "1px solid #e0e7ef" }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                  <Typography variant="subtitle2" fontWeight={700} color="#0a2d57">
                                    Tansiyon Ölçümleri
                                  </Typography>
                                  <IconButton size="small" onClick={() => { setOpenRowId(null); setTrackingDetails(null); setRowMeasurements([]); }}>
                                    <CloseIcon fontSize="small" />
                                  </IconButton>
                                </Stack>

                                <Box sx={{ maxHeight: 420, overflowY: "auto", mb: 2 }}>
                                  <Grid container spacing={1.5}>
                                    {rowMeasurements.map((m, idx) => {
                                      const bpStatus = getBPStatus(m.systolic, m.diastolic);
                                      return (
                                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
                                          <Card variant="outlined" sx={{
                                            borderColor: bpStatus ? bpStatus.bgcolor : "#e8edf5",
                                            bgcolor: bpStatus ? bpStatus.bgcolor + "55" : "white",
                                          }}>
                                            <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                                              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                                <Typography variant="subtitle2" fontWeight={700} color="#0a2d57">
                                                  {m.measurement_time}
                                                </Typography>
                                                {bpStatus && (
                                                  <Chip label={bpStatus.label} size="small"
                                                    sx={{ bgcolor: bpStatus.bgcolor, color: bpStatus.color,
                                                      fontWeight: 600, fontSize: 10, height: 18 }} />
                                                )}
                                              </Stack>
                                              <Stack spacing={1}>
                                                <TextField
                                                  label="Sistolik" type="number" fullWidth size="small"
                                                  value={m.systolic ?? ""}
                                                  onChange={(e) => handleMeasurementChange(idx, "systolic", e.target.value)}
                                                  slotProps={{ htmlInput: { min: 0, max: 300 } }}
                                                />
                                                <TextField
                                                  label="Diyastolik" type="number" fullWidth size="small"
                                                  value={m.diastolic ?? ""}
                                                  onChange={(e) => handleMeasurementChange(idx, "diastolic", e.target.value)}
                                                  slotProps={{ htmlInput: { min: 0, max: 200 } }}
                                                />
                                              </Stack>
                                            </CardContent>
                                          </Card>
                                        </Grid>
                                      );
                                    })}
                                  </Grid>
                                </Box>

                                <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                                  <Button
                                    variant="outlined" size="small"
                                    onClick={() => { setOpenRowId(null); setTrackingDetails(null); setRowMeasurements([]); }}
                                    disabled={savingRowId === t.id}
                                    sx={{ color: "#6b7a90", borderColor: "#d0d7e3" }}
                                  >
                                    İptal
                                  </Button>
                                  <Button
                                    variant="contained" size="small"
                                    startIcon={<SaveIcon fontSize="small" />}
                                    onClick={() => handleSave(t.id)}
                                    disabled={savingRowId === t.id}
                                    sx={{ bgcolor: "#0a2d57", "&:hover": { bgcolor: "#071d3c" } }}
                                  >
                                    {savingRowId === t.id ? "Kaydediliyor..." : "Kaydet"}
                                  </Button>
                                  <Button
                                    variant="contained" size="small"
                                    startIcon={<SendIcon fontSize="small" />}
                                    onClick={() => handleSave(t.id, true)}
                                    disabled={savingRowId === t.id}
                                    sx={{ bgcolor: "#1565c0", "&:hover": { bgcolor: "#0d47a1" } }}
                                  >
                                    {savingRowId === t.id ? "Gönderiliyor..." : "Doktora Gönder"}
                                  </Button>
                                </Stack>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        )}
      </Box>

      {/* Yeni Takip Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center",
          borderBottom: "1px solid #e8edf5", fontWeight: 700, color: "#0a2d57" }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <MonitorHeartIcon sx={{ color: "#c62828" }} />
            <span>Yeni Tansiyon Takibi</span>
          </Stack>
          <IconButton size="small" onClick={() => setDialogOpen(false)} sx={{ color: "#9aa5b4" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Tarih" type="date" fullWidth required
                value={date} onChange={(e) => setDate(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Başlangıç Saati" type="time" fullWidth required
                value={startTime} onChange={(e) => setStartTime(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Bitiş Saati" type="time" fullWidth required
                value={endTime} onChange={(e) => setEndTime(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Periyot (Saat)" type="number" fullWidth required
                value={periodHours}
                onChange={(e) => setPeriodHours(parseInt(e.target.value, 10) || 1)}
                slotProps={{ htmlInput: { min: 1, max: 24 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ p: 1.5, bgcolor: "#f8faff", borderRadius: 2, border: "1px solid #e8edf5" }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Ölçüm sayısı
                </Typography>
                <Typography variant="h6" fontWeight={700} color="#0a2d57">
                  {generateMeasurementTimes(startTime, endTime, periodHours).length} ölçüm
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={submitting} sx={{ color: "#6b7a90" }}>
            İptal
          </Button>
          <Button
            variant="contained" onClick={handleCreate} disabled={submitting}
            sx={{ bgcolor: "#0a2d57", "&:hover": { bgcolor: "#071d3c" } }}
          >
            {submitting ? "Oluşturuluyor..." : "Oluştur"}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default TansiyonPage;
