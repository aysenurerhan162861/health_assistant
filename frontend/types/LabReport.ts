export interface TestData {
  name: string;
  value: number;
  normal_range?: string;
  unit?: string;
  viewedByDoctor?: boolean;
}

export interface LabTest {
  id: number;
  name: string;
  value: number | string;
  normal_range?: string;
  unit?: string;
  viewed_by_doctor: boolean;
}

export interface LabReport {
  id: number;
  file_name: string;
  file_path: string;
  created_at: string;
  parsed_data: {
    tests: TestData[];
  };
  upload_date: string;
  doctor_comment?: string;
  patient: { id: number; name: string }; // Doktor tablosu için gerekli
  patient_note: string;
  tests: LabTest[]; // Artık parsed_data yerine gerçek testler burada
  viewed_by_doctor?: boolean;
}
