"use client";

import React, { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import {
  Box, Typography, Button, Card, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Alert, Stack, Chip, InputAdornment, IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import ImageIcon from "@mui/icons-material/Image";
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { Meal } from "@/types/Meal";
import { getMyMeals, createMeal, analyzeMeal } from "@/services/MealApi";

type MealCfg = { label: string; bgcolor: string; color: string };
const MEAL_FALLBACK: MealCfg = { label: "Diğer", bgcolor: "#f3f4f6", color: "#555" };
const mealTypeConfig: Record<string, MealCfg> = {
  sabah: { label: "Sabah",     bgcolor: "#fff3e0", color: "#e65100" },
  ogle:  { label: "Öğle",     bgcolor: "#e8f5e9", color: "#2e7d32" },
  aksam: { label: "Akşam",    bgcolor: "#e3f2fd", color: "#1565c0" },
  ara:   { label: "Ara Öğün", bgcolor: "#fce4ec", color: "#c62828" },
  diger: MEAL_FALLBACK,
};
const getMealCfg = (type: string): MealCfg => mealTypeConfig[type] ?? MEAL_FALLBACK;

const OgunPage: React.FC = () => {
  const [meals, setMeals]           = useState<Meal[]>([]);
  const [loading, setLoading]       = useState(false);
  const [modalOpen, setModalOpen]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);
  const [viewingMeal, setViewingMeal] = useState<Meal | null>(null);
  const [search, setSearch]         = useState("");

  // Form
  const [mealType, setMealType]               = useState("sabah");
  const [textDescription, setTextDescription] = useState("");
  const [mealDatetime, setMealDatetime]       = useState<Date | null>(null);
  const [imageFile, setImageFile]             = useState<File | null>(null);

  const fetchMeals = async () => {
    setLoading(true);
    try {
      setMeals(await getMyMeals());
    } catch (err: any) {
      setError(err.message || "Öğünler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMeals(); }, []);

  const handleCloseModal = () => {
    setModalOpen(false);
    setMealType("sabah");
    setTextDescription("");
    setMealDatetime(null);
    setImageFile(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!textDescription?.trim() && !imageFile) {
      setError("Metin açıklama veya fotoğraf zorunludur.");
      return;
    }
    if (mealType === "diger" && !mealDatetime) {
      setError("Diğer seçeneğinde tarih ve saat zorunludur.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createMeal(mealType, textDescription || null, mealDatetime ? mealDatetime.toISOString() : null, imageFile);
      handleCloseModal();
      fetchMeals();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Öğün eklenemedi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnalyze = async (mealId: number) => {
    setAnalyzingId(mealId);
    setError(null);
    try {
      await analyzeMeal(mealId);
      await fetchMeals();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "AI analizi alınamadı");
      setTimeout(() => setError(null), 5000);
    } finally {
      setAnalyzingId(null);
    }
  };

  const filtered = meals.filter((m) =>
    !search ||
    getMealCfg(m.meal_type).label.toLowerCase().includes(search.toLowerCase()) ||
    m.text_description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <Box sx={{ maxWidth: 1100, mx: "auto" }}>
        {/* Başlık */}
        <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            <Typography variant="h5" fontWeight={700} color="#0a2d57">Öğün Analizim</Typography>
            <Typography variant="body2" color="text.secondary">
              Öğünlerinizi kaydedin ve yapay zeka analizi alın
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} alignItems="center">
            <Chip
              icon={<RestaurantMenuIcon fontSize="small" />}
              label={`${meals.length} kayıt`}
              sx={{ bgcolor: "#e8f5e9", color: "#2e7d32", fontWeight: 600 }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => { setModalOpen(true); setError(null); }}
              sx={{ bgcolor: "#0a2d57", "&:hover": { bgcolor: "#071d3c" }, borderRadius: 2 }}
            >
              Yeni Öğün Ekle
            </Button>
          </Stack>
        </Box>

        {error && !modalOpen && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Filtre */}
        <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2, p: 2, mb: 2 }}>
          <TextField
            size="small" fullWidth placeholder="Öğün tipi veya açıklama ile ara..."
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

        {/* Tablo */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}>
            <CircularProgress sx={{ color: "#1565c0" }} />
          </Box>
        ) : (
          <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2, overflow: "hidden" }}>
            {filtered.length === 0 ? (
              <Box sx={{ py: 8, textAlign: "center" }}>
                <RestaurantMenuIcon sx={{ fontSize: 40, color: "#d0d7e3", mb: 1 }} />
                <Typography color="text.secondary">Henüz öğün eklenmemiş.</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f8faff" }}>
                      <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5" }}>Tarih</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5" }}>Öğün</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5" }}>Kalori</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5" }}>AI Analizi</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5" }}>Doktor Notu</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5" }}>İşlemler</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.map((meal) => {
                      const cfg = getMealCfg(meal.meal_type);
                      return (
                        <TableRow key={meal.id} sx={{ "&:hover": { bgcolor: "#f0f6ff" } }}>
                          <TableCell sx={{ borderColor: "#f0f4fa", color: "#444", fontSize: 13 }}>
                            {new Date(meal.meal_datetime).toLocaleString("tr-TR", {
                              day: "2-digit", month: "2-digit", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </TableCell>
                          <TableCell sx={{ borderColor: "#f0f4fa" }}>
                            <Chip label={cfg.label} size="small"
                              sx={{ bgcolor: cfg.bgcolor, color: cfg.color, fontWeight: 600, fontSize: 11 }} />
                          </TableCell>
                          <TableCell sx={{ borderColor: "#f0f4fa" }}>
                            {meal.gemini_calorie != null ? (
                              <Chip label={`${meal.gemini_calorie} kcal`} size="small"
                                sx={{ bgcolor: "#e3f0ff", color: "#1565c0", fontWeight: 600, fontSize: 11 }} />
                            ) : <Typography variant="body2" color="text.disabled">—</Typography>}
                          </TableCell>
                          <TableCell sx={{ borderColor: "#f0f4fa", maxWidth: 240 }}>
                            {meal.gemini_comment ? (
                              <Typography variant="body2" color="text.secondary"
                                sx={{ overflow: "hidden", display: "-webkit-box",
                                  WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                                {meal.gemini_comment}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.disabled">—</Typography>
                            )}
                          </TableCell>
                          <TableCell sx={{ borderColor: "#f0f4fa", maxWidth: 180 }}>
                            {meal.doctor_comment ? (
                              <Typography variant="body2" color="text.secondary"
                                sx={{ overflow: "hidden", display: "-webkit-box",
                                  WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                                {meal.doctor_comment}
                              </Typography>
                            ) : <Typography variant="body2" color="text.disabled">—</Typography>}
                          </TableCell>
                          <TableCell sx={{ borderColor: "#f0f4fa" }}>
                            <Stack direction="row" spacing={1}>
                              <Button
                                variant="outlined" size="small"
                                onClick={() => setViewingMeal(meal)}
                                sx={{ borderColor: "#0a2d57", color: "#0a2d57", fontSize: 11,
                                  "&:hover": { bgcolor: "#e3f0ff" } }}
                              >
                                Göster
                              </Button>
                              <Button
                                variant="contained" size="small"
                                startIcon={<SmartToyIcon sx={{ fontSize: 13 }} />}
                                onClick={() => handleAnalyze(meal.id)}
                                disabled={!!meal.gemini_comment || analyzingId === meal.id}
                                sx={{ bgcolor: "#1565c0", "&:hover": { bgcolor: "#0d47a1" }, fontSize: 11,
                                  "&.Mui-disabled": { bgcolor: "#e8edf5", color: "#9aa5b4" } }}
                              >
                                {analyzingId === meal.id ? "Analiz..." : meal.gemini_comment ? "Mevcut" : "Analiz Al"}
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        )}
      </Box>

      {/* Yeni Öğün Modal */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center",
          borderBottom: "1px solid #e8edf5", fontWeight: 700, color: "#0a2d57" }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <RestaurantMenuIcon sx={{ color: "#2e7d32" }} />
            <span>Yeni Öğün Ekle</span>
          </Stack>
          <IconButton size="small" onClick={handleCloseModal} sx={{ color: "#9aa5b4" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2.5}>
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
            )}
            <TextField
              label="Öğün Tipi" select fullWidth value={mealType}
              onChange={(e) => setMealType(e.target.value)} required
            >
              <MenuItem value="sabah">Sabah</MenuItem>
              <MenuItem value="ogle">Öğle</MenuItem>
              <MenuItem value="aksam">Akşam</MenuItem>
              <MenuItem value="ara">Ara Öğün</MenuItem>
              <MenuItem value="diger">Diğer</MenuItem>
            </TextField>

            {mealType === "diger" && (
              <TextField
                label="Tarih ve Saat" type="datetime-local" fullWidth required
                value={mealDatetime
                  ? new Date(mealDatetime.getTime() - mealDatetime.getTimezoneOffset() * 60000)
                      .toISOString().slice(0, 16)
                  : ""}
                onChange={(e) => setMealDatetime(e.target.value ? new Date(e.target.value) : null)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}

            <TextField
              label="Metin Açıklama" multiline rows={4} fullWidth
              value={textDescription}
              onChange={(e) => setTextDescription(e.target.value)}
              placeholder="Öğün içeriğini yazın..."
            />

            <Box
              component="label"
              htmlFor="meal-image-upload"
              sx={{
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: 1, p: 2.5, border: "2px dashed #b0bec5", borderRadius: 2,
                cursor: "pointer", bgcolor: "#f8faff",
                "&:hover": { borderColor: "#2e7d32", bgcolor: "#e8f5e9" },
                transition: "all 0.2s",
              }}
            >
              <CloudUploadIcon sx={{ fontSize: 32, color: imageFile ? "#2e7d32" : "#9aa5b4" }} />
              <Typography variant="body2" color={imageFile ? "#2e7d32" : "text.secondary"}>
                {imageFile ? imageFile.name : "Fotoğraf yükle (opsiyonel)"}
              </Typography>
              <input
                id="meal-image-upload" type="file" accept="image/*" hidden
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleCloseModal} disabled={submitting} sx={{ color: "#6b7a90" }}>
            İptal
          </Button>
          <Button
            variant="contained" onClick={handleSubmit} disabled={submitting}
            sx={{ bgcolor: "#0a2d57", "&:hover": { bgcolor: "#071d3c" } }}
          >
            {submitting ? "Ekleniyor..." : "Ekle"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Öğün Detay Modal */}
      <Dialog open={!!viewingMeal} onClose={() => setViewingMeal(null)} maxWidth="md" fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center",
          borderBottom: "1px solid #e8edf5" }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <RestaurantMenuIcon sx={{ color: "#2e7d32" }} />
            <Box>
              <Typography fontWeight={700} color="#0a2d57">
                {viewingMeal && getMealCfg(viewingMeal.meal_type).label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {viewingMeal && new Date(viewingMeal.meal_datetime).toLocaleString("tr-TR", {
                  day: "2-digit", month: "long", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </Typography>
            </Box>
          </Stack>
          <IconButton size="small" onClick={() => setViewingMeal(null)} sx={{ color: "#9aa5b4" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {viewingMeal && (
            <Stack spacing={3}>
              {viewingMeal.image_path && (
                <Box>
                  <Stack direction="row" alignItems="center" spacing={0.5} mb={1}>
                    <ImageIcon sx={{ fontSize: 16, color: "#1565c0" }} />
                    <Typography variant="subtitle2" fontWeight={700} color="#0a2d57">Fotoğraf</Typography>
                  </Stack>
                  <Box
                    component="img"
                    src={`http://localhost:8000/${viewingMeal.image_path}`}
                    alt="Öğün fotoğrafı"
                    sx={{ maxWidth: "100%", maxHeight: 400, objectFit: "contain",
                      borderRadius: 2, border: "1px solid #e8edf5" }}
                    onError={(e: any) => { e.target.style.display = "none"; }}
                  />
                </Box>
              )}
              {viewingMeal.text_description && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} color="#0a2d57" mb={1}>
                    Metin Açıklama
                  </Typography>
                  <Box sx={{ p: 2, bgcolor: "#f8faff", borderRadius: 2, border: "1px solid #e8edf5" }}>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-line", lineHeight: 1.8 }}>
                      {viewingMeal.text_description}
                    </Typography>
                  </Box>
                </Box>
              )}
              {viewingMeal.gemini_comment && (
                <Box>
                  <Stack direction="row" alignItems="center" spacing={0.5} mb={1}>
                    <SmartToyIcon sx={{ fontSize: 16, color: "#1565c0" }} />
                    <Typography variant="subtitle2" fontWeight={700} color="#0a2d57">
                      Yapay Zeka Analizi
                    </Typography>
                  </Stack>
                  <Box sx={{ p: 2, bgcolor: "#e3f2fd", borderRadius: 2, border: "1px solid #bbdefb" }}>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-line", lineHeight: 1.8, color: "#0d47a1" }}>
                      {viewingMeal.gemini_comment}
                    </Typography>
                  </Box>
                </Box>
              )}
              {viewingMeal.doctor_comment && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} color="#0a2d57" mb={1}>
                    Doktor Notu
                  </Typography>
                  <Box sx={{ p: 2, bgcolor: "#f8faff", borderRadius: 2, border: "1px solid #e8edf5" }}>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-line", lineHeight: 1.8 }}>
                      {viewingMeal.doctor_comment}
                    </Typography>
                  </Box>
                </Box>
              )}
              {!viewingMeal.image_path && !viewingMeal.text_description && (
                <Typography color="text.secondary" align="center" py={4}>
                  Bu öğün için içerik bulunmuyor.
                </Typography>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setViewingMeal(null)} sx={{ color: "#6b7a90" }}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default OgunPage;
