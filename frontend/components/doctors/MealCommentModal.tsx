"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, Tabs, Tab, Box,
  IconButton, Typography, Switch, FormControlLabel, CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Meal } from "@/types/Meal";
import { User } from "@/types/user";
import { getPatientMealsForDoctor, getMealNotificationSetting, updateMealNotificationSetting } from "@/services/MealApi";
import PatientMealsTable from "./PatientMealsTable";

interface MealCommentModalProps {
  open: boolean;
  onClose: () => void;
  meal: (Meal & { patient: User }) | null;
  onUpdate?: (updatedMeal: Meal) => void;
  userRole?: "doctor" | "assistant";
  allMeals?: (Meal & { patient: User })[];
}

const MealCommentModal: React.FC<MealCommentModalProps> = ({
  open, onClose, meal, onUpdate, userRole = "doctor", allMeals = [],
}) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [patientMeals, setPatientMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);
  const [mealNotificationEnabled, setMealNotificationEnabled] = useState<boolean>(true);
  const [savingNotification, setSavingNotification] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!meal?.patient?.id) return;
      try {
        setLoading(true);
        if (userRole === "assistant") {
          const filtered = allMeals.filter((m: any) =>
            m.patient_id === meal.patient.id || m.patient?.id === meal.patient.id
          );
          setPatientMeals(filtered.length > 0 ? filtered : [meal]);
          setMealNotificationEnabled(false);
        } else {
          const [meals, notificationSetting] = await Promise.all([
            getPatientMealsForDoctor(meal.patient.id),
            getMealNotificationSetting(meal.patient.id).catch(() => ({ meal_notification_enabled: true })),
          ]);
          setPatientMeals(meals);
          setMealNotificationEnabled(notificationSetting.meal_notification_enabled);
        }
      } catch (err) {
        console.error("Veriler alinamadi:", err);
        setPatientMeals([]);
      } finally {
        setLoading(false);
      }
    };
    if (open && meal) fetchData();
  }, [meal, open, userRole]);

  if (!meal) return null;

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => setTabIndex(newValue);

  const handleRefreshMeals = async () => {
    if (!meal?.patient?.id || userRole === "assistant") return;
    try {
      const meals = await getPatientMealsForDoctor(meal.patient.id);
      setPatientMeals(meals);
    } catch (err) { console.error(err); }
  };

  const handleNotificationToggle = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!meal?.patient?.id) return;
    const newValue = event.target.checked;
    setMealNotificationEnabled(newValue);
    setSavingNotification(true);
    try {
      await updateMealNotificationSetting(meal.patient.id, newValue);
    } catch (err) {
      setMealNotificationEnabled(!newValue);
      alert("Bildirim ayari guncellenemedi!");
    } finally { setSavingNotification(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        Detaylar
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", height: "70vh", p: 0 }}>
        <Box sx={{ px: 3 }}>
          <Tabs value={tabIndex} onChange={handleTabChange}>
            <Tab label="Kisisel Bilgiler" />
            <Tab label="Hastanin Ogunleri" />
          </Tabs>
        </Box>
        <Box sx={{ flex: 1, overflowY: "auto", p: 3 }}>
          {tabIndex === 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box><Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>Hasta Adi Soyadi:</Typography><Typography variant="body1">{meal.patient.name || "-"}</Typography></Box>
              <Box><Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>Yas:</Typography><Typography variant="body1">{meal.patient.age || "-"}</Typography></Box>
              <Box><Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>Cinsiyet:</Typography><Typography variant="body1">{meal.patient.gender || "-"}</Typography></Box>
              <Box><Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>Notlar:</Typography><Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>{meal.patient.note || "-"}</Typography></Box>
              {userRole !== "assistant" && (
                <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #e0e0e0" }}>
                  <FormControlLabel
                    control={<Switch checked={mealNotificationEnabled} onChange={handleNotificationToggle} disabled={savingNotification} color="primary" />}
                    label={<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><Typography variant="body1" sx={{ fontWeight: "bold" }}>Ogun Takibi Bildirimi</Typography>{savingNotification && <CircularProgress size={16} />}</Box>}
                  />
                </Box>
              )}
            </Box>
          )}
          {tabIndex === 1 && (
            <Box>
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}><CircularProgress /></Box>
              ) : meal.patient.id ? (
                <PatientMealsTable meals={patientMeals} patientId={meal.patient.id} refreshMeals={handleRefreshMeals} userRole={userRole} />
              ) : (
                <Typography>Hasta bilgisi bulunamadi.</Typography>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default MealCommentModal;
