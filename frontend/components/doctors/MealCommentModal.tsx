"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, Tabs, Tab, Box,
  IconButton, Typography, Switch, FormControlLabel,
  CircularProgress, Avatar, Stack, Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { Meal } from "@/types/Meal";
import { User } from "@/types/user";
import {
  getPatientMealsForDoctor,
  getMealNotificationSetting,
  updateMealNotificationSetting,
} from "@/services/MealApi";
import PatientMealsTable from "./PatientMealsTable";
import PatientCardContent from "../patients/PatientCardContent";

interface MealCommentModalProps {
  open: boolean;
  onClose: () => void;
  meal: (Meal & { patient: User }) | null;
  onUpdate?: (updatedMeal: Meal) => void;
  userRole?: "doctor" | "assistant";
  allMeals?: (Meal & { patient: User })[];
}

const MealCommentModal: React.FC<MealCommentModalProps> = ({
  open, onClose, meal, userRole = "doctor", allMeals = [],
}) => {
  const [tabIndex, setTabIndex]                       = useState(0);
  const [patientMeals, setPatientMeals]               = useState<Meal[]>([]);
  const [loading, setLoading]                         = useState(false);
  const [notifEnabled, setNotifEnabled]               = useState(true);
  const [savingNotif, setSavingNotif]                 = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!meal?.patient?.id) return;
      try {
        setLoading(true);
        if (userRole === "assistant") {
          const filtered = allMeals.filter(
            (m: any) => m.patient_id === meal.patient.id || m.patient?.id === meal.patient.id
          );
          setPatientMeals(filtered.length > 0 ? filtered : [meal]);
          setNotifEnabled(false);
        } else {
          const [meals, notif] = await Promise.all([
            getPatientMealsForDoctor(meal.patient.id),
            getMealNotificationSetting(meal.patient.id).catch(() => ({ meal_notification_enabled: true })),
          ]);
          setPatientMeals(meals);
          setNotifEnabled(notif.meal_notification_enabled);
        }
      } catch (err) {
        console.error(err);
        setPatientMeals([]);
      } finally {
        setLoading(false);
      }
    };
    if (open && meal) fetchData();
  }, [meal, open, userRole]);

  if (!meal) return null;

  const handleRefresh = async () => {
    if (!meal?.patient?.id || userRole === "assistant") return;
    const meals = await getPatientMealsForDoctor(meal.patient.id).catch(() => []);
    setPatientMeals(meals);
  };

  const handleNotifToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!meal?.patient?.id) return;
    const val = e.target.checked;
    setNotifEnabled(val);
    setSavingNotif(true);
    try {
      await updateMealNotificationSetting(meal.patient.id, val);
    } catch {
      setNotifEnabled(!val);
      alert("Bildirim ayarı güncellenemedi!");
    } finally {
      setSavingNotif(false);
    }
  };

  const initials = meal.patient.name?.charAt(0).toUpperCase() || "?";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3, maxHeight: "88vh" } } }}>

      {/* Başlık */}
      <DialogTitle sx={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: "1px solid #e8edf5", pb: 1.5,
      }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ width: 36, height: 36, bgcolor: "#e8f5e9", color: "#2e7d32", fontWeight: 700 }}>
            {initials}
          </Avatar>
          <Box>
            <Typography fontWeight={700} color="#0a2d57" lineHeight={1.2}>
              {meal.patient.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">Öğün Detayı</Typography>
          </Box>
        </Stack>
        <IconButton size="small" onClick={onClose} sx={{ color: "#9aa5b4" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Sekmeler */}
      <Tabs
        value={tabIndex}
        onChange={(_, v) => setTabIndex(v)}
        sx={{ px: 3, borderBottom: "1px solid #e8edf5", bgcolor: "#fafbff" }}
      >
        <Tab icon={<PersonIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Kişisel Bilgiler" />
        <Tab icon={<RestaurantMenuIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Öğünleri" />
      </Tabs>

      {/* İçerik */}
      <DialogContent sx={{ p: 3, overflowY: "auto" }}>
        {tabIndex === 0 && (
          <Box>
            <PatientCardContent patient={{ id: meal.patient.id ?? 0, ...meal.patient } as any} />

            {userRole !== "assistant" && (
              <Box sx={{ mt: 3, pt: 2.5, borderTop: "1px solid #e8edf5" }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                  <NotificationsIcon sx={{ fontSize: 18, color: "#1565c0" }} />
                  <Typography variant="subtitle2" fontWeight={700} color="#0a2d57">
                    Öğün Takibi Bildirimi
                  </Typography>
                  {savingNotif && <CircularProgress size={14} />}
                </Stack>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notifEnabled}
                      onChange={handleNotifToggle}
                      disabled={savingNotif}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2" color="text.secondary">
                      {notifEnabled ? "Bildirimler açık" : "Bildirimler kapalı"}
                    </Typography>
                  }
                />
              </Box>
            )}
          </Box>
        )}

        {tabIndex === 1 && (
          loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
              <CircularProgress sx={{ color: "#1565c0" }} />
            </Box>
          ) : (
            <PatientMealsTable
              meals={patientMeals}
              patientId={meal.patient.id}
              refreshMeals={handleRefresh}
              userRole={userRole}
            />
          )
        )}
      </DialogContent>

      <Box sx={{ display: "flex", justifyContent: "flex-end", px: 3, pb: 2, borderTop: "1px solid #e8edf5" }}>
        <Button variant="outlined" onClick={onClose} sx={{ color: "#6b7a90", borderColor: "#d0d7e3" }}>
          Kapat
        </Button>
      </Box>
    </Dialog>
  );
};

export default MealCommentModal;
