"use client";

import React, { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Grid,
  Card,
  CardContent,
  Alert,
  Chip,
  IconButton,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import {
  BloodPressureTrackingListItem,
  BloodPressureTracking,
  BloodPressureTrackingCreate,
} from "@/types/BloodPressure";
import {
  getMyTrackings,
  getTracking,
  createTracking,
  updateTracking,
  sendToDoctor,
} from "@/services/BloodPressureApi";

const TansiyonPage: React.FC = () => {
  const [trackings, setTrackings] = useState<BloodPressureTrackingListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Ana accordion form state (sadece takip oluşturma için)
  const [date, setDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("08:00");
  const [endTime, setEndTime] = useState<string>("20:00");
  const [periodHours, setPeriodHours] = useState<number>(2);

  // Tablodaki accordion state (ölçüm girişi için)
  const [openRowId, setOpenRowId] = useState<number | null>(null);
  const [trackingDetails, setTrackingDetails] = useState<BloodPressureTracking | null>(null);
  const [rowMeasurements, setRowMeasurements] = useState<
    Array<{ measurement_time: string; systolic: number | null; diastolic: number | null }>
  >([]);
  const [savingRowId, setSavingRowId] = useState<number | null>(null);

  // Tansiyon kayıtlarını yükle
  const fetchTrackings = async () => {
    setLoading(true);
    try {
      const data = await getMyTrackings();
      setTrackings(data);
    } catch (err: any) {
      console.error("Tansiyon kayıtları yüklenemedi:", err);
      setError(err.response?.data?.detail || err.message || "Tansiyon kayıtları yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackings();
  }, []);

  // Periyoda göre ölçüm saatlerini oluştur
  const generateMeasurementTimes = (
    start: string,
    end: string,
    period: number
  ): string[] => {
    const times: string[] = [];
    const startParts = start.split(":");
    const endParts = end.split(":");
    
    if (startParts.length !== 2 || endParts.length !== 2) {
      return times;
    }
    
    const startHourStr = startParts[0];
    const startMinStr = startParts[1];
    const endHourStr = endParts[0];
    const endMinStr = endParts[1];
    
    if (!startHourStr || !startMinStr || !endHourStr || !endMinStr) {
      return times;
    }
    
    const startHour = parseInt(startHourStr, 10);
    const startMin = parseInt(startMinStr, 10);
    const endHour = parseInt(endHourStr, 10);
    const endMin = parseInt(endMinStr, 10);

    if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
      return times;
    }

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const periodMinutes = period * 60;

    if (startMinutes >= endMinutes || periodMinutes <= 0) {
      return times;
    }

    let currentMinutes = startMinutes;
    while (currentMinutes <= endMinutes) {
      const hours = Math.floor(currentMinutes / 60);
      const minutes = currentMinutes % 60;
      times.push(`${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`);
      currentMinutes += periodMinutes;
    }

    return times;
  };

  // Ana accordion aç/kapat
  const handleAccordionChange = (event: React.SyntheticEvent, isExpanded: boolean) => {
    setAccordionOpen(isExpanded);
    if (!isExpanded) {
      // Accordion kapandığında formu sıfırla
      setDate("");
      setStartTime("08:00");
      setEndTime("20:00");
      setPeriodHours(2);
      setError(null);
      setSuccess(null);
    }
  };

  // Ana accordion: Yeni takip oluştur (ölçümler olmadan)
  const handleCreateTracking = async () => {
    if (!date) {
      setError("Lütfen tarih seçin.");
      return;
    }

    if (!startTime || !endTime) {
      setError("Lütfen başlangıç ve bitiş saatlerini seçin.");
      return;
    }

    if (periodHours <= 0) {
      setError("Periyot 0'dan büyük olmalıdır.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Boş ölçümlerle takip oluştur
      const times = generateMeasurementTimes(startTime, endTime, periodHours);
      const emptyMeasurements = times.map((time) => ({
        measurement_time: time,
        systolic: null,
        diastolic: null,
      }));

      const trackingData: BloodPressureTrackingCreate = {
        date,
        start_time: startTime,
        end_time: endTime,
        period_hours: periodHours,
        measurements: emptyMeasurements,
      };

      await createTracking(trackingData);
      setSuccess("Tansiyon takibi başarıyla oluşturuldu. Ölçümleri tablodan girebilirsiniz.");
      setAccordionOpen(false);
      fetchTrackings();
      
      // Formu sıfırla
      setDate("");
      setStartTime("08:00");
      setEndTime("20:00");
      setPeriodHours(2);
    } catch (err: any) {
      console.error("Tansiyon takibi oluşturulamadı:", err);
      setError(err.response?.data?.detail || err.message || "Tansiyon takibi oluşturulamadı");
    } finally {
      setSubmitting(false);
    }
  };

  // Tablodaki accordion aç/kapat
  const toggleRowAccordion = async (trackingId: number) => {
    if (openRowId === trackingId) {
      setOpenRowId(null);
      setTrackingDetails(null);
      setRowMeasurements([]);
      return;
    }

    try {
      setOpenRowId(trackingId);
      const details = await getTracking(trackingId);
      setTrackingDetails(details);
      
      // Ölçümleri formatla
      const formattedMeasurements = details.measurements.map((m) => ({
        measurement_time: m.measurement_time,
        systolic: m.systolic,
        diastolic: m.diastolic,
      }));
      setRowMeasurements(formattedMeasurements);
    } catch (err: any) {
      console.error("Takip detayları yüklenemedi:", err);
      setError(err.response?.data?.detail || err.message || "Takip detayları yüklenemedi");
    }
  };

  // Tablodaki ölçüm değerlerini güncelle
  const handleRowMeasurementChange = (
    index: number,
    field: "systolic" | "diastolic",
    value: string
  ) => {
    const newMeasurements = [...rowMeasurements];
    if (newMeasurements[index]) {
      newMeasurements[index] = {
        ...newMeasurements[index],
        [field]: value === "" ? null : parseInt(value, 10),
      };
      setRowMeasurements(newMeasurements);
    }
  };

  // Tablodaki ölçümleri kaydet
  const handleSaveRowMeasurements = async (trackingId: number) => {
    if (!trackingDetails) return;

    setSavingRowId(trackingId);
    setError(null);
    setSuccess(null);

    try {
      const trackingData: BloodPressureTrackingCreate = {
        date: trackingDetails.date,
        start_time: trackingDetails.start_time,
        end_time: trackingDetails.end_time,
        period_hours: trackingDetails.period_hours,
        measurements: rowMeasurements,
      };

      await updateTracking(trackingId, trackingData);
      setSuccess("Ölçümler başarıyla kaydedildi.");
      
      // Verileri yeniden yükle
      await fetchTrackings();
      
      // Accordion'u kapat
      setOpenRowId(null);
      setTrackingDetails(null);
      setRowMeasurements([]);
    } catch (err: any) {
      console.error("Ölçümler kaydedilemedi:", err);
      setError(err.response?.data?.detail || err.message || "Ölçümler kaydedilemedi");
    } finally {
      setSavingRowId(null);
    }
  };

  // Tablodaki ölçümleri doktora gönder
  const handleSendRowToDoctor = async (trackingId: number) => {
    if (!trackingDetails) return;

    setSavingRowId(trackingId);
    setError(null);
    setSuccess(null);

    try {
      // Önce ölçümleri kaydet
      const trackingData: BloodPressureTrackingCreate = {
        date: trackingDetails.date,
        start_time: trackingDetails.start_time,
        end_time: trackingDetails.end_time,
        period_hours: trackingDetails.period_hours,
        measurements: rowMeasurements,
      };

      await updateTracking(trackingId, trackingData);
      
      // Sonra doktora gönder
      await sendToDoctor(trackingId);
      
      setSuccess("Ölçümler kaydedildi ve doktora gönderildi.");
      
      // Verileri yeniden yükle
      await fetchTrackings();
      
      // Accordion'u kapat
      setOpenRowId(null);
      setTrackingDetails(null);
      setRowMeasurements([]);
    } catch (err: any) {
      console.error("Doktora gönderilemedi:", err);
      setError(err.response?.data?.detail || err.message || "Doktora gönderilemedi");
    } finally {
      setSavingRowId(null);
    }
  };

  return (
    <Layout>
      <Box sx={{ mt: 6, mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h5">Tansiyon Takibi</Typography>
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* Ana Accordion: Yeni Takip Oluşturma */}
        <Box sx={{ mb: 3 }}>
          <Accordion expanded={accordionOpen} onChange={handleAccordionChange}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                bgcolor: accordionOpen ? "#0a2d57" : "#f5f5f5",
                color: accordionOpen ? "white" : "inherit",
                "&:hover": {
                  bgcolor: accordionOpen ? "#082147" : "#e0e0e0",
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AddIcon />
                <Typography variant="h6">Yeni Tansiyon Takibi Oluştur</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Tarih"
                      type="date"
                      fullWidth
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      label="Başlangıç Saati"
                      type="time"
                      fullWidth
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      label="Bitiş Saati"
                      type="time"
                      fullWidth
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Periyot (Saat)"
                      type="number"
                      fullWidth
                      required
                      value={periodHours}
                      onChange={(e) => setPeriodHours(parseInt(e.target.value, 10) || 1)}
                      inputProps={{ min: 1, max: 24 }}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ display: "flex", gap: 2, mt: 2, justifyContent: "flex-end" }}>
                  <Button
                    variant="outlined"
                    onClick={() => setAccordionOpen(false)}
                    disabled={submitting}
                  >
                    İptal
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleCreateTracking}
                    disabled={submitting}
                    sx={{ bgcolor: "#0a2d57", "&:hover": { bgcolor: "#082147" } }}
                  >
                    {submitting ? "Oluşturuluyor..." : "Oluştur"}
                  </Button>
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>

        {/* Tablo */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f0f0f0" }}>
                  <TableCell sx={{ fontWeight: "bold" }}>Tarih</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Başlangıç Saati</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Bitiş Saati</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Periyot</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Ölçüm Sayısı</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Durum</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {trackings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        Henüz tansiyon takibi eklenmemiş.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  trackings.map((tracking) => (
                    <React.Fragment key={tracking.id}>
                      <TableRow hover>
                        <TableCell>
                          {new Date(tracking.date).toLocaleDateString("tr-TR", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          })}
                        </TableCell>
                        <TableCell>{tracking.start_time}</TableCell>
                        <TableCell>{tracking.end_time}</TableCell>
                        <TableCell>{tracking.period_hours} saat</TableCell>
                        <TableCell>
                          {tracking.completed_count} / {tracking.measurement_count}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={tracking.is_completed === "tamamlandı" ? "Tamamlandı" : "Eksik"}
                            color={tracking.is_completed === "tamamlandı" ? "success" : "warning"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => toggleRowAccordion(tracking.id)}
                            sx={{ minWidth: 100 }}
                          >
                            {openRowId === tracking.id ? "Kapat" : "Ölçümler"}
                          </Button>
                        </TableCell>
                      </TableRow>

                      {/* Accordion satırı - Ölçüm girişi */}
                      {openRowId === tracking.id && trackingDetails && (
                        <TableRow>
                          <TableCell colSpan={7} sx={{ py: 3, backgroundColor: "#f7f9fc" }}>
                            <Box
                              sx={{
                                p: 2,
                                borderRadius: 2,
                                boxShadow: 1,
                                border: "1px solid #e0e7ef",
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  mb: 2,
                                }}
                              >
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                  Tansiyon Ölçümleri
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setOpenRowId(null);
                                    setTrackingDetails(null);
                                    setRowMeasurements([]);
                                  }}
                                >
                                  <CloseIcon />
                                </IconButton>
                              </Box>

                              <Box
                                sx={{
                                  maxHeight: "500px",
                                  overflowY: "auto",
                                  mb: 2,
                                }}
                              >
                                <Grid container spacing={2}>
                                  {rowMeasurements.map((measurement, index) => (
                                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                                      <Card variant="outlined" sx={{ height: "100%" }}>
                                        <CardContent>
                                          <Typography
                                            variant="subtitle2"
                                            sx={{
                                              mb: 1.5,
                                              fontWeight: "bold",
                                              color: "#0a2d57",
                                              textAlign: "center",
                                            }}
                                          >
                                            {measurement.measurement_time}
                                          </Typography>
                                          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                                            <TextField
                                              label="Sistolik"
                                              type="number"
                                              fullWidth
                                              size="small"
                                              value={measurement.systolic || ""}
                                              onChange={(e) =>
                                                handleRowMeasurementChange(
                                                  index,
                                                  "systolic",
                                                  e.target.value
                                                )
                                              }
                                              inputProps={{ min: 0, max: 300 }}
                                            />
                                            <TextField
                                              label="Diyastolik"
                                              type="number"
                                              fullWidth
                                              size="small"
                                              value={measurement.diastolic || ""}
                                              onChange={(e) =>
                                                handleRowMeasurementChange(
                                                  index,
                                                  "diastolic",
                                                  e.target.value
                                                )
                                              }
                                              inputProps={{ min: 0, max: 200 }}
                                            />
                                          </Box>
                                        </CardContent>
                                      </Card>
                                    </Grid>
                                  ))}
                                </Grid>
                              </Box>

                              <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                                <Button
                                  variant="outlined"
                                  onClick={() => {
                                    setOpenRowId(null);
                                    setTrackingDetails(null);
                                    setRowMeasurements([]);
                                  }}
                                  disabled={savingRowId === tracking.id}
                                >
                                  İptal
                                </Button>
                                <Button
                                  variant="contained"
                                  onClick={() => handleSaveRowMeasurements(tracking.id)}
                                  disabled={savingRowId === tracking.id}
                                  sx={{ bgcolor: "#0a2d57", "&:hover": { bgcolor: "#082147" } }}
                                >
                                  {savingRowId === tracking.id ? "Kaydediliyor..." : "Kaydet"}
                                </Button>
                                <Button
                                  variant="contained"
                                  onClick={() => handleSendRowToDoctor(tracking.id)}
                                  disabled={savingRowId === tracking.id}
                                  sx={{ bgcolor: "#0a2d57", "&:hover": { bgcolor: "#082147" } }}
                                >
                                  {savingRowId === tracking.id
                                    ? "Gönderiliyor..."
                                    : "Doktora Gönder"}
                                </Button>
                              </Box>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Layout>
  );
};

export default TansiyonPage;
