import axios from "axios";

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
