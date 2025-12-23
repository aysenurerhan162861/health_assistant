export interface BloodPressureMeasurement {
  id: number;
  tracking_id: number;
  measurement_time: string; // "HH:MM" formatında
  systolic: number | null;
  diastolic: number | null;
  created_at: string;
  updated_at: string;
}

export interface PatientInfo {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  age?: number;
  gender?: string;
  note?: string;
  blood_type?: string;
  chronic_diseases?: string;
  allergies?: string;
}

export interface BloodPressureTracking {
  id: number;
  patient_id: number;
  date: string; // ISO date string
  start_time: string; // "HH:MM" formatında
  end_time: string; // "HH:MM" formatında
  period_hours: number;
  is_completed: "tamamlandı" | "eksik";
  doctor_comment?: string | null;
  created_at: string;
  updated_at: string;
  measurements: BloodPressureMeasurement[];
  patient?: PatientInfo;
}

export interface BloodPressureTrackingListItem {
  id: number;
  date: string; // ISO date string
  start_time: string; // "HH:MM" formatında
  end_time: string; // "HH:MM" formatında
  period_hours: number;
  measurement_count: number;
  completed_count: number;
  is_completed: "tamamlandı" | "eksik";
  created_at: string;
}

export interface BloodPressureTrackingCreate {
  date: string; // ISO date string (YYYY-MM-DD)
  start_time: string; // "HH:MM" formatında
  end_time: string; // "HH:MM" formatında
  period_hours: number;
  measurements: {
    measurement_time: string; // "HH:MM" formatında
    systolic: number | null;
    diastolic: number | null;
  }[];
}

