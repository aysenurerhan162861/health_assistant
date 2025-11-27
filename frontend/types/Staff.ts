import { LabReport } from "./LabReport";
export interface User {
  id: number;
  name?: string;
  email: string;
  role?: string;
  phone?: string;
  birth_date?: string;
  gender?: string;
  city?: string;
  district?: string;
  neighborhood?: string;
  blood_type?: string;
  photoUrl?: string;

  // Hasta özel alanları
  chronic_diseases?: string; 
  age?: number;
  allergies?: string;
  about?: string;

  hasPermission?: boolean;

  lab_reports?: LabReport[];
}
