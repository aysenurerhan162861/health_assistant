export interface StepRecord {
  id: number;
  user_id: number;
  date: string;
  steps: number;
  distance_km: number | null;
  calories_burned: number | null;
  source: string;
}

export interface StepRecordCreate {
  date: string;
  steps: number;
  distance_km?: number | null;
  calories_burned?: number | null;
  source?: string;
}