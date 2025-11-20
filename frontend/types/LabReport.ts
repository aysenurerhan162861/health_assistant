export interface TestData {
  name: string;
  value: number;
  normal_range?: string;
  unit?: string;
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
}
