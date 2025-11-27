import axios from "axios";
import { LabReport } from "../types/LabReport";

const BASE_URL = "http://localhost:8000/api/lab_reports";

export const uploadLabReport = async (patientId: number, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("patient_id", patientId.toString());

  const res = await axios.post(`${BASE_URL}/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
};

export const getLabReports = async (patientId: number) => {
  const res = await axios.get(`${BASE_URL}/patient/${patientId}`);
  return res.data;
};

export const getPatientLabReports = async (patientId: number): Promise<LabReport[]> => {
  const token = localStorage.getItem("token") || "";
  const res = await fetch(`http://localhost:8000/api/lab_reports/patient/${patientId}`, {
    headers: { 
      "Content-Type": "application/json",
      "token-header": `Bearer ${token}` 
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail?.[0]?.msg || "Lab raporları alınamadı");
  }

  return res.json();
};

export const updateLabReportComment = async (reportId: number, comment: string) => {
  const token = localStorage.getItem("token") || "";
  const res = await fetch(`http://localhost:8000/api/lab_reports/update_comment/${reportId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "token-header": `Bearer ${token}`,
    },
    body: JSON.stringify({ doctor_comment: comment }), // ← burası parametreyi kullanmalı
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Açıklama kaydedilemedi");
  }
  return res.json();
};