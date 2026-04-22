"use client";

import React, { useState } from "react";
import {
  Box, Button, Card, Typography, TextField, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Stack, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import ImageIcon from "@mui/icons-material/Image";
import { Meal } from "@/types/Meal";
import { updateMealDoctorComment } from "@/services/MealApi";

interface PatientMealsTableProps {
  meals: Meal[];
  patientId?: number;
  refreshMeals: () => void;
  userRole?: "doctor" | "assistant";
}

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
const getMealLabel = (type: string) => getMealCfg(type).label;

const PatientMealsTable: React.FC<PatientMealsTableProps> = ({
  meals, patientId, refreshMeals, userRole = "doctor",
}) => {
  const [openRowId, setOpenRowId]             = useState<number | null>(null);
  const [accordionComment, setAccordionComment] = useState("");
  const [savingAccordionId, setSavingAccordionId] = useState<number | null>(null);
  const [viewingMeal, setViewingMeal]         = useState<Meal | null>(null);

  const toggleAccordion = (meal: Meal | null) => {
    if (!meal || openRowId === meal.id) {
      setOpenRowId(null);
      setAccordionComment("");
      return;
    }
    setOpenRowId(meal.id ?? null);
    setAccordionComment(meal.doctor_comment || "");
  };

  const handleSave = async (mealId: number) => {
    try {
      setSavingAccordionId(mealId);
      await updateMealDoctorComment(mealId, accordionComment);
      setOpenRowId(null);
      setAccordionComment("");
      refreshMeals();
    } catch {
      alert("Kaydederken hata oluştu!");
    } finally {
      setSavingAccordionId(null);
    }
  };

  if (meals.length === 0) {
    return (
      <Box sx={{ py: 6, textAlign: "center" }}>
        <RestaurantIcon sx={{ fontSize: 36, color: "#d0d7e3", mb: 1 }} />
        <Typography color="text.secondary">Henüz öğün kaydı bulunmuyor.</Typography>
      </Box>
    );
  }

  return (
    <>
      <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2, overflow: "hidden" }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#f8faff" }}>
                {userRole !== "assistant" && <TableCell sx={{ width: 44, borderColor: "#e8edf5" }} />}
                <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5" }}>Tarih</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5" }}>Öğün</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5" }}>Kalori</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5" }}>AI Analizi</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5" }}>Detay</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {meals.map((meal) => {
                const cfg = getMealCfg(meal.meal_type);
                return (
                  <React.Fragment key={meal.id}>
                    <TableRow sx={{ "&:hover": { bgcolor: "#f0f6ff" } }}>
                      {userRole !== "assistant" && (
                        <TableCell sx={{ borderColor: "#f0f4fa", py: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() => toggleAccordion(meal)}
                            sx={{ color: openRowId === meal.id ? "#0a2d57" : "#9aa5b4" }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      )}
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
                      <TableCell sx={{ borderColor: "#f0f4fa", maxWidth: 200 }}>
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
                      <TableCell sx={{ borderColor: "#f0f4fa" }}>
                        <Button
                          variant="outlined" size="small"
                          onClick={() => setViewingMeal(meal)}
                          sx={{ borderColor: "#0a2d57", color: "#0a2d57", fontSize: 12,
                            "&:hover": { bgcolor: "#e3f0ff" } }}
                        >
                          Göster
                        </Button>
                      </TableCell>
                    </TableRow>

                    {/* Doktor yorum accordion */}
                    {userRole !== "assistant" && openRowId === meal.id && (
                      <TableRow>
                        <TableCell colSpan={6} sx={{ p: 0, borderColor: "#e8edf5" }}>
                          <Box sx={{ m: 1.5, p: 2, bgcolor: "#f8faff", borderRadius: 2,
                            border: "1px solid #e0e7ef" }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                              <Typography variant="subtitle2" fontWeight={700} color="#0a2d57">
                                Doktor Yorumu
                              </Typography>
                              <IconButton size="small" onClick={() => toggleAccordion(null)}>
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                            <TextField
                              multiline minRows={3} fullWidth size="small"
                              value={accordionComment}
                              onChange={(e) => setAccordionComment(e.target.value)}
                              placeholder="Hasta için yorum yazın..."
                            />
                            <Stack direction="row" justifyContent="flex-end" mt={1.5}>
                              <Button
                                variant="contained" size="small"
                                startIcon={<SaveIcon fontSize="small" />}
                                onClick={() => handleSave(meal.id!)}
                                disabled={savingAccordionId === meal.id}
                                sx={{ bgcolor: "#0a2d57", "&:hover": { bgcolor: "#071d3c" } }}
                              >
                                {savingAccordionId === meal.id ? "Kaydediliyor..." : "Kaydet"}
                              </Button>
                            </Stack>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Öğün Detay Modal */}
      <Dialog open={!!viewingMeal} onClose={() => setViewingMeal(null)} maxWidth="md" fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center",
          borderBottom: "1px solid #e8edf5" }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <RestaurantIcon sx={{ color: "#2e7d32" }} />
            <Box>
              <Typography fontWeight={700} color="#0a2d57">
                {viewingMeal && getMealLabel(viewingMeal.meal_type)}
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
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
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
                  <Typography variant="subtitle2" fontWeight={700} color="#0a2d57" mb={1}>
                    Yapay Zeka Analizi
                  </Typography>
                  <Box sx={{ p: 2, bgcolor: "#e3f2fd", borderRadius: 2, border: "1px solid #bbdefb" }}>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-line", lineHeight: 1.8, color: "#0d47a1" }}>
                      {viewingMeal.gemini_comment}
                    </Typography>
                  </Box>
                </Box>
              )}
              {!viewingMeal.image_path && !viewingMeal.text_description && (
                <Typography color="text.secondary" align="center" py={4}>
                  Bu öğün için içerik bulunmuyor.
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setViewingMeal(null)} sx={{ color: "#6b7a90" }}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PatientMealsTable;
