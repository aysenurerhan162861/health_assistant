import axios from "axios";
import { Meal } from "../types/Meal";

const BASE_URL = "http://localhost:8000/api/meals";

const getAuthHeader = () => {
  const token = localStorage.getItem("token") || "";
  return {
    "token-header": `Bearer ${token}`,
  };
};

export const getMyMeals = async (): Promise<Meal[]> => {
  const res = await axios.get(`${BASE_URL}/my`, {
    headers: getAuthHeader(),
  });
  return res.data;
};

export const createMeal = async (
  mealType: string,
  textDescription: string | null,
  mealDatetime: string | null,
  imageFile: File | null
): Promise<Meal> => {
  const formData = new FormData();

  formData.append("meal_type", mealType);
  if (textDescription) formData.append("text_description", textDescription);
  if (mealDatetime) formData.append("meal_datetime", mealDatetime);
  if (imageFile) formData.append("image", imageFile);

  const res = await axios.post(`${BASE_URL}/create`, formData, {
    headers: getAuthHeader(),
  });

  return res.data;
};

export const analyzeMeal = async (mealId: number): Promise<Meal> => {
  const res = await axios.post(`${BASE_URL}/${mealId}/analyze`, null, {
    headers: getAuthHeader(),
  });
  return res.data;
};

// Doktor için API fonksiyonları
export const getDoctorMeals = async (): Promise<Meal[]> => {
  const res = await axios.get(`${BASE_URL}/doctor/all`, {
    headers: getAuthHeader(),
  });
  return res.data;
};

export const getPatientMealsForDoctor = async (patientId: number): Promise<Meal[]> => {
  const res = await axios.get(`${BASE_URL}/doctor/patients/${patientId}/meals`, {
    headers: getAuthHeader(),
  });
  return res.data;
};

export const updateMealDoctorComment = async (mealId: number, comment: string): Promise<Meal> => {
  const res = await axios.patch(
    `${BASE_URL}/${mealId}/doctor-comment`,
    { doctor_comment: comment },
    {
      headers: getAuthHeader(),
    }
  );
  return res.data;
};

// Doktor bildirim ayarı
export interface MealNotificationSetting {
  meal_notification_enabled: boolean;
}

export const getMealNotificationSetting = async (patientId: number): Promise<MealNotificationSetting> => {
  const res = await axios.get(`${BASE_URL}/doctor/patients/${patientId}/meal-notification`, {
    headers: getAuthHeader(),
  });
  return res.data;
};

export const updateMealNotificationSetting = async (
  patientId: number,
  enabled: boolean
): Promise<MealNotificationSetting> => {
  const res = await axios.patch(
    `${BASE_URL}/doctor/patients/${patientId}/meal-notification`,
    { meal_notification_enabled: enabled },
    {
      headers: getAuthHeader(),
    }
  );
  return res.data;
};

// Trend analizi
export interface DailyCaloriesTrend {
  date: string;
  calories: number;
}

export interface MealCounts {
  sabah: number;
  ogle: number;
  aksam: number;
  ara: number;
  diger: number;
}

export interface NutritionStatistics {
  avg_daily_calories: number;
  total_meals: number;
  unique_days: number;
  breakfast_skipped: number;
  protein_ratio: number;
  carb_ratio: number;
  fat_ratio: number;
  daily_calories_trend: DailyCaloriesTrend[];
  meal_counts: MealCounts;
}

export interface NutritionTrendsAnalysis {
  summary: string;
  positives: string[];
  warnings: string[];
  recommendations: string[];
  statistics?: NutritionStatistics;
}

export const getNutritionTrendsAnalysis = async (): Promise<NutritionTrendsAnalysis> => {
  const res = await axios.get(`${BASE_URL}/trends/analysis`, {
    headers: getAuthHeader(),
  });
  return res.data;
};

// Doktor için hasta trend analizi
export const getPatientNutritionTrendsAnalysis = async (patientId: number): Promise<NutritionTrendsAnalysis> => {
  const res = await axios.get(`${BASE_URL}/trends/analysis/${patientId}`, {
    headers: getAuthHeader(),
  });
  return res.data;
};