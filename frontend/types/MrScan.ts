export interface MrScan {
  id: number;
  patient_id: number;
  file_name: string;
  file_path: string;
  upload_date: string;
  lesion_detected: boolean | null;
  lesion_volume: number | null;
  dice_confidence: number | null;
  mask_path: string | null;
  gradcam_path: string | null;
  ai_comment: string | null;
  doctor_comment: string | null;
  status: "pending" | "done" | "error";
  result_data: Record<string, unknown> | null;
  viewed_by_doctor: boolean;
  patient?: { id: number; name: string } | null;
}