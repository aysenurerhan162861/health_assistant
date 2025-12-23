"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Box,
  IconButton,
  Typography,
  Switch,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Meal } from "@/types/Meal";
import { User } from "@/types/user";
import PatientCardContent from "../patients/PatientCardContent";
import {
  getPatientMealsForDoctor,
  getMealNotificationSetting,
  updateMealNotificationSetting,
} from "@/services/MealApi";
import PatientMealsTable from "./PatientMealsTable";

interface MealCommentModalProps {
  open: boolean;
  onClose: () => void;
  meal: (Meal & { patient: User }) | null;
  onUpdate?: (updatedMeal: Meal) => void;
}

const MealCommentModal: React.FC<MealCommentModalProps> = ({
  open,
  onClose,
  meal,
  onUpdate,
}) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [patientMeals, setPatientMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);
  const [mealNotificationEnabled, setMealNotificationEnabled] = useState<boolean>(true);
  const [savingNotification, setSavingNotification] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!meal?.patient?.id) {
        setPatientMeals([]);
        return;
      }

      try {
        setLoading(true);
        // Öğünleri ve bildirim ayarını paralel çek
        const [meals, notificationSetting] = await Promise.all([
          getPatientMealsForDoctor(meal.patient.id),
          getMealNotificationSetting(meal.patient.id).catch(() => ({ meal_notification_enabled: true })),
        ]);
        setPatientMeals(meals);
        setMealNotificationEnabled(notificationSetting.meal_notification_enabled);
      } catch (err) {
        console.error("Veriler alınamadı:", err);
        setPatientMeals([]);
      } finally {
        setLoading(false);
      }
    };

    if (open && meal) {
      fetchData();
    }
  }, [meal, open]);

  if (!meal) return null;

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const handleRefreshMeals = async () => {
    if (!meal?.patient?.id) return;
    try {
      const meals = await getPatientMealsForDoctor(meal.patient.id);
      setPatientMeals(meals);
    } catch (err) {
      console.error("Öğünler yenilenemedi:", err);
    }
  };

  const handleNotificationToggle = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!meal?.patient?.id) return;
    
    const newValue = event.target.checked;
    setMealNotificationEnabled(newValue);
    setSavingNotification(true);

    try {
      await updateMealNotificationSetting(meal.patient.id, newValue);
    } catch (err) {
      console.error("Bildirim ayarı güncellenemedi:", err);
      // Hata durumunda eski değere geri dön
      setMealNotificationEnabled(!newValue);
      alert("Bildirim ayarı güncellenemedi!");
    } finally {
      setSavingNotification(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Detaylar
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "70vh",
          p: 0,
        }}
      >
        {/* Tabs */}
        <Box sx={{ px: 3 }}>
          <Tabs value={tabIndex} onChange={handleTabChange}>
            <Tab label="Kişisel Bilgiler" />
            <Tab label="Hastanın Öğünleri" />
          </Tabs>
        </Box>

        {/* İçerik */}
        <Box sx={{ flex: 1, overflowY: "auto", p: 3 }}>
          {/* TAB 0 - Kişisel Bilgiler */}
          {tabIndex === 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                  Hasta Adı Soyadı:
                </Typography>
                <Typography variant="body1">{meal.patient.name || "-"}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                  Yaş:
                </Typography>
                <Typography variant="body1">{meal.patient.age || "-"}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                  Cinsiyet:
                </Typography>
                <Typography variant="body1">{meal.patient.gender || "-"}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                  Notlar / Açıklamalar:
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
                  {meal.patient.note || "-"}
                </Typography>
              </Box>
              <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #e0e0e0" }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={mealNotificationEnabled}
                      onChange={handleNotificationToggle}
                      disabled={savingNotification}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                        Öğün Takibi Bildirimi
                      </Typography>
                      {savingNotification && <CircularProgress size={16} />}
                    </Box>
                  }
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, ml: 4 }}>
                  {mealNotificationEnabled
                    ? "Hasta yeni öğün eklediğinde size bildirim gönderilecek."
                    : "Hasta öğün eklese bile size bildirim gönderilmeyecek."}
                </Typography>
              </Box>
            </Box>
          )}

          {/* TAB 1 - Hastanın Öğünleri */}
          {tabIndex === 1 && (
            <Box>
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                  <Typography>Yükleniyor...</Typography>
                </Box>
              ) : meal.patient.id ? (
                <PatientMealsTable
                  meals={patientMeals}
                  patientId={meal.patient.id}
                  refreshMeals={handleRefreshMeals}
                />
              ) : (
                <Typography>Hasta bilgisi bulunamadı.</Typography>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default MealCommentModal;

