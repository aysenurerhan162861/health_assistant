export interface Meal {
  id: number;
  patient_id: number;
  meal_datetime: string;
  meal_type: "sabah" | "ogle" | "aksam" | "ara" | "diger";
  text_description?: string;
  image_path?: string;
  gemini_calorie?: number;
  gemini_comment?: string;
  doctor_comment?: string;
  created_at: string;
  updated_at: string;
}

export type MealType = "sabah" | "ogle" | "aksam" | "ara" | "diger";

