"use client";

import React, { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import {
  Box, Typography, Button, Card, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  Alert, Stack, Chip, Grid, CardContent, IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import CloseIcon from "@mui/icons-material/Close";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import StraightenIcon from "@mui/icons-material/Straighten";
import TodayIcon from "@mui/icons-material/Today";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import EditIcon from "@mui/icons-material/Edit";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { StepRecord, StepRecordCreate } from "@/types/StepRecord";
import { getStepHistory, addManualStep } from "@/services/StepApi";

const AdimTakibiPage: React.FC = () => {
  const [records, setRecords] = useState<StepRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Manuel giriş dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [steps, setSteps] = useState<number | "">("");
  const [distance, setDistance] = useState<number | "">("");
  const [calories, setCalories] = useState<number | "">("");

  // Gün seçimi
  const [days, setDays] = useState(30);

  const userId = typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("user") || "{}")?.id || 1
    : 1;

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await getStepHistory(userId, days);
      setRecords(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Adım kayıtları yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, [days]);

  const handleCreate = async () => {
    if (!date || steps === "" || steps <= 0) {
      setError("Tarih ve adım sayısı zorunludur.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const data: StepRecordCreate = {
        date,
        steps: Number(steps),
        distance_km: distance === "" ? null : Number(distance),
        calories_burned: calories === "" ? null : Number(calories),
        source: "manual",
      };
      await addManualStep(userId, data);
      setSuccess("Adım kaydı eklendi.");
      setDialogOpen(false);
      setSteps("");
      setDistance("");
      setCalories("");
      setDate(new Date().toISOString().split("T")[0]);
      fetchRecords();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Kayıt eklenemedi");
    } finally {
      setSubmitting(false);
    }
  };

  // İstatistikler
  const todayRecord = records.find(
    (r) => r.date === new Date().toISOString().split("T")[0]
  );
  const avgSteps = records.length > 0
    ? Math.round(records.reduce((sum, r) => sum + r.steps, 0) / records.length)
    : 0;
  const maxSteps = records.length > 0
    ? Math.max(...records.map((r) => r.steps))
    : 0;
  const totalDistance = records.reduce((sum, r) => sum + (r.distance_km || 0), 0);

  // Grafik verisi (tarihe göre sırala, eskiden yeniye)
  const chartData = [...records]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((r) => ({
      date: new Date(r.date).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" }),
      steps: r.steps,
    }));

  return (
    <Layout>
      <Box sx={{ maxWidth: 1100, mx: "auto" }}>
        {/* Başlık */}
        <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            <Typography variant="h5" fontWeight={700} color="#0a2d57">
              Adım Takibim
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Günlük adım sayınızı takip edin ve trendlerinizi görün
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} alignItems="center">
            <Chip
              icon={<DirectionsWalkIcon fontSize="small" />}
              label={`${records.length} kayıt`}
              sx={{ bgcolor: "#e3f2fd", color: "#1565c0", fontWeight: 600 }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => { setDialogOpen(true); setError(null); }}
              sx={{ bgcolor: "#0a2d57", "&:hover": { bgcolor: "#071d3c" }, borderRadius: 2 }}
            >
              Manuel Giriş
            </Button>
          </Stack>
        </Box>

        {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}

        {/* Özet Kartları */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2 }}>
              <CardContent sx={{ textAlign: "center", py: 2 }}>
                <DirectionsWalkIcon sx={{ fontSize: 32, color: "#1565c0", mb: 0.5 }} />
                <Typography variant="caption" color="text.secondary" display="block">
                  Bugün
                </Typography>
                <Typography variant="h5" fontWeight={700} color="#0a2d57">
                  {todayRecord ? todayRecord.steps.toLocaleString("tr-TR") : "—"}
                </Typography>
                <Typography variant="caption" color="text.secondary">adım</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2 }}>
              <CardContent sx={{ textAlign: "center", py: 2 }}>
                <TodayIcon sx={{ fontSize: 32, color: "#2e7d32", mb: 0.5 }} />
                <Typography variant="caption" color="text.secondary" display="block">
                  Günlük Ortalama
                </Typography>
                <Typography variant="h5" fontWeight={700} color="#0a2d57">
                  {avgSteps.toLocaleString("tr-TR")}
                </Typography>
                <Typography variant="caption" color="text.secondary">adım</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2 }}>
              <CardContent sx={{ textAlign: "center", py: 2 }}>
                <LocalFireDepartmentIcon sx={{ fontSize: 32, color: "#e65100", mb: 0.5 }} />
                <Typography variant="caption" color="text.secondary" display="block">
                  En Yüksek
                </Typography>
                <Typography variant="h5" fontWeight={700} color="#0a2d57">
                  {maxSteps.toLocaleString("tr-TR")}
                </Typography>
                <Typography variant="caption" color="text.secondary">adım</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2 }}>
              <CardContent sx={{ textAlign: "center", py: 2 }}>
                <StraightenIcon sx={{ fontSize: 32, color: "#7b1fa2", mb: 0.5 }} />
                <Typography variant="caption" color="text.secondary" display="block">
                  Toplam Mesafe
                </Typography>
                <Typography variant="h5" fontWeight={700} color="#0a2d57">
                  {totalDistance.toFixed(1)}
                </Typography>
                <Typography variant="caption" color="text.secondary">km</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Grafik */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}>
            <CircularProgress sx={{ color: "#1565c0" }} />
          </Box>
        ) : records.length === 0 ? (
          <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2 }}>
            <Box sx={{ py: 8, textAlign: "center" }}>
              <DirectionsWalkIcon sx={{ fontSize: 40, color: "#d0d7e3", mb: 1 }} />
              <Typography color="text.secondary">Henüz adım kaydı bulunmuyor.</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Manuel giriş yapabilir veya HealthKit ile senkronize edebilirsiniz.
              </Typography>
            </Box>
          </Card>
        ) : (
          <>
            {/* Süre filtresi */}
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              {[7, 14, 30, 90].map((d) => (
                <Chip
                  key={d}
                  label={`${d} gün`}
                  onClick={() => setDays(d)}
                  sx={{
                    bgcolor: days === d ? "#0a2d57" : "#f3f4f6",
                    color: days === d ? "white" : "#555",
                    fontWeight: 600,
                    cursor: "pointer",
                    "&:hover": { bgcolor: days === d ? "#071d3c" : "#e8edf5" },
                  }}
                />
              ))}
            </Stack>

            <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2, p: 2, mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={700} color="#0a2d57" sx={{ mb: 2 }}>
                Adım Grafiği
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8edf5" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6b7a90" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#6b7a90" }} />
                  <Tooltip
                    formatter={(value: number | undefined) => [(value ?? 0).toLocaleString("tr-TR") + " adım", "Adım"]}
                    contentStyle={{ borderRadius: 8, border: "1px solid #e8edf5" }}
                  />
                  <ReferenceLine y={10000} stroke="#2e7d32" strokeDasharray="5 5" label="Hedef" />
                  <Bar dataKey="steps" fill="#1565c0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Tablo */}
            <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2, overflow: "hidden" }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f8faff" }}>
                      <TableCell sx={{ fontWeight: 700, color: "#0a2d57" }}>Tarih</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#0a2d57" }}>Adım</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#0a2d57" }}>Mesafe</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#0a2d57" }}>Kalori</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#0a2d57" }}>Kaynak</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {records.map((r) => (
                      <TableRow key={r.id} sx={{ "&:hover": { bgcolor: "#f0f6ff" } }}>
                        <TableCell sx={{ fontWeight: 500, color: "#1a2e4a" }}>
                          {new Date(r.date).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight={600} color="#1565c0">
                            {r.steps.toLocaleString("tr-TR")}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ color: "#444" }}>
                          {r.distance_km ? `${r.distance_km.toFixed(1)} km` : "—"}
                        </TableCell>
                        <TableCell sx={{ color: "#444" }}>
                          {r.calories_burned ? `${r.calories_burned.toFixed(0)} kcal` : "—"}
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={r.source === "healthkit" ? <PhoneIphoneIcon sx={{ fontSize: 14 }} /> : <EditIcon sx={{ fontSize: 14 }} />}
                            label={r.source === "healthkit" ? "HealthKit" : "Manuel"}
                            size="small"
                            sx={{
                              bgcolor: r.source === "healthkit" ? "#e3f2fd" : "#f3f4f6",
                              color: r.source === "healthkit" ? "#1565c0" : "#555",
                              fontWeight: 500,
                              fontSize: 11,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </>
        )}
      </Box>

      {/* Manuel Giriş Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
        <DialogTitle sx={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderBottom: "1px solid #e8edf5", fontWeight: 700, color: "#0a2d57"
        }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <DirectionsWalkIcon sx={{ color: "#1565c0" }} />
            <span>Manuel Adım Girişi</span>
          </Stack>
          <IconButton size="small" onClick={() => setDialogOpen(false)} sx={{ color: "#9aa5b4" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Tarih" type="date" fullWidth required
                value={date} onChange={(e) => setDate(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Adım Sayısı" type="number" fullWidth required
                value={steps} onChange={(e) => setSteps(e.target.value === "" ? "" : parseInt(e.target.value))}
                inputProps={{ min: 0 }}
                placeholder="Örn: 8500"
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                label="Mesafe (km)" type="number" fullWidth
                value={distance} onChange={(e) => setDistance(e.target.value === "" ? "" : parseFloat(e.target.value))}
                inputProps={{ min: 0, step: 0.1 }}
                placeholder="Opsiyonel"
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                label="Kalori (kcal)" type="number" fullWidth
                value={calories} onChange={(e) => setCalories(e.target.value === "" ? "" : parseFloat(e.target.value))}
                inputProps={{ min: 0 }}
                placeholder="Opsiyonel"
              />
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
            {submitting ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default AdimTakibiPage;