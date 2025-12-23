"use client";

import React, { useState } from "react";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import { Meal } from "@/types/Meal";
import { updateMealDoctorComment } from "@/services/MealApi";

interface PatientMealsTableProps {
  meals: Meal[];
  patientId: number;
  refreshMeals: () => void;
}

const PatientMealsTable: React.FC<PatientMealsTableProps> = ({
  meals,
  patientId,
  refreshMeals,
}) => {
  const [openRowId, setOpenRowId] = useState<number | null>(null);
  const [accordionComment, setAccordionComment] = useState<string>("");
  const [savingAccordionId, setSavingAccordionId] = useState<number | null>(null);
  const [viewingMeal, setViewingMeal] = useState<Meal | null>(null);

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

  const toggleAccordionForMeal = (meal: Meal | null) => {
    if (!meal) {
      setOpenRowId(null);
      setAccordionComment("");
      return;
    }

    if (openRowId === meal.id) {
      setOpenRowId(null);
      setAccordionComment("");
      return;
    }

    setOpenRowId(meal.id ?? null);
    setAccordionComment(meal.doctor_comment || "");
  };

  const handleSaveAccordion = async (mealId: number) => {
    try {
      setSavingAccordionId(mealId);
      await updateMealDoctorComment(mealId, accordionComment);
      setSavingAccordionId(null);
      setOpenRowId(null);
      setAccordionComment("");
      refreshMeals();
    } catch (err) {
      console.error(err);
      setSavingAccordionId(null);
      alert("Kaydederken hata oluştu!");
    }
  };

  const handleShowMeal = (meal: Meal) => {
    setViewingMeal(meal);
  };

  const handleCloseViewModal = () => {
    setViewingMeal(null);
  };

  return (
    <>
      <TableContainer component={Paper}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f0f0f0" }}>
              <th style={{ padding: "8px" }}></th>
              <th style={{ padding: "8px" }}>Tarih</th>
              <th style={{ padding: "8px" }}>Öğün Tipi</th>
              <th style={{ padding: "8px" }}>AI Kalori</th>
              <th style={{ padding: "8px" }}>AI Yorumu</th>
              <th style={{ padding: "8px" }}>AI Analizi</th>
              <th style={{ padding: "8px" }}>Göster</th>
            </tr>
          </thead>

          <tbody>
            {meals.map((meal) => (
              <React.Fragment key={meal.id}>
                <tr style={{ backgroundColor: "white" }}>
                  <td style={{ padding: "8px", verticalAlign: "top", width: 48 }}>
                    <IconButton size="small" onClick={() => toggleAccordionForMeal(meal)}>
                      <EditIcon />
                    </IconButton>
                  </td>

                  <td style={{ padding: "8px" }}>
                    {new Date(meal.meal_datetime).toLocaleString("tr-TR", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>

                  <td style={{ padding: "8px" }}>{getMealTypeLabel(meal.meal_type)}</td>

                  <td style={{ padding: "8px" }}>
                    {meal.gemini_calorie != null ? `${meal.gemini_calorie} kcal` : "-"}
                  </td>

                  <td style={{ padding: "8px" }}>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-line", maxWidth: 400 }}>
                      {meal.gemini_comment || "-"}
                    </Typography>
                  </td>

                  <td style={{ padding: "8px" }}>
                    <Typography variant="body2" color="text.secondary">
                      {meal.gemini_comment ? "Mevcut" : "-"}
                    </Typography>
                  </td>

                  <td style={{ padding: "8px" }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleShowMeal(meal)}
                      sx={{ bgcolor: "#0a2d57", "&:hover": { bgcolor: "#082147" } }}
                    >
                      Göster
                    </Button>
                  </td>
                </tr>

                {/* Accordion satırı */}
                {openRowId === meal.id && (
                  <tr>
                    <td colSpan={7}>
                      <Box
                        sx={{
                          mt: 1,
                          p: 2,
                          borderRadius: 2,
                          boxShadow: 1,
                          backgroundColor: "#f7f9fc",
                          border: "1px solid #e0e7ef",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 1,
                          }}
                        >
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            Doktor Yorumu Düzenle
                          </Typography>

                          <IconButton size="small" onClick={() => toggleAccordionForMeal(null)}>
                            <CloseIcon />
                          </IconButton>
                        </Box>

                        <TextField
                          label="Doktor Yorumu"
                          multiline
                          minRows={4}
                          fullWidth
                          value={accordionComment}
                          onChange={(e) => setAccordionComment(e.target.value)}
                          variant="outlined"
                        />

                        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                          <Button
                            variant="contained"
                            onClick={() => handleSaveAccordion(meal.id!)}
                            disabled={savingAccordionId === meal.id}
                            sx={{ bgcolor: "#0a2d57", "&:hover": { bgcolor: "#082147" } }}
                          >
                            {savingAccordionId === meal.id ? "Kaydediliyor..." : "Kaydet"}
                          </Button>
                        </Box>
                      </Box>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </TableContainer>

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
                  />
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
    </>
  );
};

export default PatientMealsTable;

