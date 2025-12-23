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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
} from "@mui/material";
import { Meal } from "@/types/Meal";
import { getMyMeals, createMeal, analyzeMeal } from "@/services/MealApi";

const OgunPage: React.FC = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);
  const [viewingMeal, setViewingMeal] = useState<Meal | null>(null);

  // Form state
  const [mealType, setMealType] = useState<string>("sabah");
  const [textDescription, setTextDescription] = useState<string>("");
  const [mealDatetime, setMealDatetime] = useState<Date | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Öğünleri yükle
  const fetchMeals = async () => {
    setLoading(true);
    try {
      const data = await getMyMeals();
      setMeals(data);
    } catch (err: any) {
      console.error("Öğünler yüklenemedi:", err);
      setError(err.message || "Öğünler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeals();
  }, []);

  // Modal aç/kapat
  const handleOpenModal = () => {
    setModalOpen(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setMealType("sabah");
    setTextDescription("");
    setMealDatetime(null);
    setImageFile(null);
    setError(null);
  };

  // Form gönderimi
  const handleSubmit = async () => {
    // Validasyon: Metin veya fotoğraf zorunlu
    if (!textDescription?.trim() && !imageFile) {
      setError("Metin açıklama veya fotoğraf zorunludur.");
      return;
    }

    // "Diğer" seçeneğinde tarih-saat zorunlu
    if (mealType === "diger" && !mealDatetime) {
      setError("Diğer seçeneğinde tarih ve saat zorunludur.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const datetimeStr = mealDatetime ? mealDatetime.toISOString() : null;
      await createMeal(mealType, textDescription || null, datetimeStr, imageFile);
      handleCloseModal();
      fetchMeals(); // Listeyi yenile
    } catch (err: any) {
      console.error("Öğün eklenemedi:", err);
      setError(err.response?.data?.detail || err.message || "Öğün eklenemedi");
    } finally {
      setSubmitting(false);
    }
  };

  // Öğün tipi Türkçe isimleri
  const getMealTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      sabah: "Sabah",
      ogle: "Öğle",
      aksam: "Akşam",
      ara: "Ara Öğün",
      diger: "Diğer",
    };
    return labels[type] || type;
  };

  const handleAnalyze = async (mealId: number) => {
    setAnalyzingId(mealId);
    setError(null);
    try {
      await analyzeMeal(mealId);
      await fetchMeals(); // Tabloyu yenile
    } catch (err: any) {
      console.error("AI analizi alınamadı:", err);
      const errorMsg = err.response?.data?.detail || err.message || "AI analizi alınamadı";
      setError(errorMsg);
      // Hata mesajını 5 saniye sonra otomatik kapat
      setTimeout(() => setError(null), 5000);
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleShowMeal = (meal: Meal) => {
    setViewingMeal(meal);
  };

  const handleCloseViewModal = () => {
    setViewingMeal(null);
  };

  return (
    <Layout>
      <Box sx={{ mt: 6, mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h5">Öğün Analizi</Typography>
          <Button variant="contained" onClick={handleOpenModal} sx={{ bgcolor: "#0a2d57", "&:hover": { bgcolor: "#082147" } }}>
            Yeni Öğün Ekle
          </Button>
        </Box>

        {error && !modalOpen && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

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
                  <TableCell sx={{ fontWeight: "bold" }}>Öğün Tipi</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>AI Kalori</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>AI Yorumu</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Doktor Yorumu</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>AI Analizi</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Göster</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {meals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">Henüz öğün eklenmemiş.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  meals.map((meal) => (
                    <TableRow key={meal.id} hover>
                      <TableCell>
                        {new Date(meal.meal_datetime).toLocaleString("tr-TR", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>{getMealTypeLabel(meal.meal_type)}</TableCell>
                      <TableCell>
                        {meal.gemini_calorie != null ? `${meal.gemini_calorie} kcal` : "-"}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ whiteSpace: "pre-line", maxWidth: 400 }}>
                          {meal.gemini_comment || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {meal.doctor_comment || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleAnalyze(meal.id)}
                          disabled={!!meal.gemini_comment || analyzingId === meal.id}
                        >
                          {meal.gemini_comment
                            ? "AI Analizi Mevcut"
                            : analyzingId === meal.id
                            ? "Analiz ediliyor..."
                            : "AI Analizi Al"}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleShowMeal(meal)}
                          sx={{ bgcolor: "#0a2d57", "&:hover": { bgcolor: "#082147" } }}
                        >
                          Göster
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Yeni Öğün Modal */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>Yeni Öğün Ekle</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <TextField
            label="Öğün Tipi"
            select
            fullWidth
            value={mealType}
            onChange={(e) => setMealType(e.target.value)}
            required
          >
            <MenuItem value="sabah">Sabah</MenuItem>
            <MenuItem value="ogle">Öğle</MenuItem>
            <MenuItem value="aksam">Akşam</MenuItem>
            <MenuItem value="ara">Ara Öğün</MenuItem>
            <MenuItem value="diger">Diğer</MenuItem>
          </TextField>

          {mealType === "diger" && (
            <TextField
              label="Tarih ve Saat"
              type="datetime-local"
              fullWidth
              required
              value={mealDatetime ? new Date(mealDatetime.getTime() - mealDatetime.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
              onChange={(e) => setMealDatetime(e.target.value ? new Date(e.target.value) : null)}
              InputLabelProps={{
                shrink: true,
              }}
            />
          )}

          <TextField
            label="Metin Açıklama"
            multiline
            rows={4}
            fullWidth
            value={textDescription}
            onChange={(e) => setTextDescription(e.target.value)}
            placeholder="Öğün içeriğini yazın..."
          />

          <Box>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              style={{ display: "none" }}
              id="meal-image-upload"
            />
            <label htmlFor="meal-image-upload">
              <Button variant="outlined" component="span" fullWidth>
                {imageFile ? imageFile.name : "Fotoğraf Yükle (Opsiyonel)"}
              </Button>
            </label>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} disabled={submitting}>
            İptal
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
            sx={{ bgcolor: "#0a2d57", "&:hover": { bgcolor: "#082147" } }}
          >
            {submitting ? "Ekleniyor..." : "Ekle"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Öğün İçeriği Görüntüleme Modal */}
      <Dialog open={!!viewingMeal} onClose={handleCloseViewModal} maxWidth="md" fullWidth>
        <DialogTitle>
          Öğün İçeriği
          <Typography variant="caption" sx={{ ml: 2, color: "text.secondary" }}>
            {viewingMeal && getMealTypeLabel(viewingMeal.meal_type)} -{" "}
            {viewingMeal &&
              new Date(viewingMeal.meal_datetime).toLocaleString("tr-TR", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {viewingMeal && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 2 }}>
              {/* Fotoğraf */}
              {viewingMeal.image_path && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
                    Fotoğraf:
                  </Typography>
                  <Box
                    component="img"
                    src={`http://localhost:8000/${viewingMeal.image_path}`}
                    alt="Öğün fotoğrafı"
                    sx={{
                      maxWidth: "100%",
                      maxHeight: "500px",
                      objectFit: "contain",
                      borderRadius: 2,
                      border: "1px solid #e0e0e0",
                    }}
                    onError={(e: any) => {
                      e.target.style.display = "none";
                      e.target.nextSibling?.removeAttribute("style");
                    }}
                  />
                  <Typography variant="body2" color="error" sx={{ display: "none" }}>
                    Fotoğraf yüklenemedi.
                  </Typography>
                </Box>
              )}

              {/* Metin Açıklama */}
              {viewingMeal.text_description && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
                    Metin Açıklama:
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      whiteSpace: "pre-line",
                      p: 2,
                      bgcolor: "#f5f5f5",
                      borderRadius: 1,
                      border: "1px solid #e0e0e0",
                    }}
                  >
                    {viewingMeal.text_description}
                  </Typography>
                </Box>
              )}

              {/* İkisi de yoksa */}
              {!viewingMeal.image_path && !viewingMeal.text_description && (
                <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                  Bu öğün için içerik bulunmuyor.
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewModal}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default OgunPage;

