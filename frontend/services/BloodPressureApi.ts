import axios from "axios";
import {
  BloodPressureTracking,
  BloodPressureTrackingListItem,
  BloodPressureTrackingCreate,
} from "../types/BloodPressure";

const BASE_URL = "http://localhost:8000/api/blood_pressure";

const getAuthHeader = () => {
  const token = localStorage.getItem("token") || "";
  return {
    "token-header": `Bearer ${token}`,
  };
};

export const getMyTrackings = async (): Promise<BloodPressureTrackingListItem[]> => {
  const res = await axios.get(`${BASE_URL}/my`, {
    headers: getAuthHeader(),
  });
  return res.data;
};

export const getTracking = async (trackingId: number): Promise<BloodPressureTracking> => {
  const res = await axios.get(`${BASE_URL}/${trackingId}`, {
    headers: getAuthHeader(),
  });
  return res.data;
};

export const createTracking = async (
  trackingData: BloodPressureTrackingCreate
): Promise<BloodPressureTracking> => {
  const res = await axios.post(`${BASE_URL}/create`, trackingData, {
    headers: getAuthHeader(),
  });
  return res.data;
};

export const updateTracking = async (
  trackingId: number,
  trackingData: BloodPressureTrackingCreate
): Promise<BloodPressureTracking> => {
  const res = await axios.put(`${BASE_URL}/${trackingId}`, trackingData, {
    headers: getAuthHeader(),
  });
  return res.data;
};

export const sendToDoctor = async (trackingId: number): Promise<BloodPressureTracking> => {
  const res = await axios.post(`${BASE_URL}/${trackingId}/send-to-doctor`, null, {
    headers: getAuthHeader(),
  });
  return res.data;
};

// Doktor için API fonksiyonları
export const getDoctorTrackings = async (): Promise<BloodPressureTracking[]> => {
  const res = await axios.get(`${BASE_URL}/doctor/all`, {
    headers: getAuthHeader(),
  });
  return res.data;
};

export const getPatientTrackingsForDoctor = async (
  patientId: number
): Promise<BloodPressureTracking[]> => {
  const res = await axios.get(`${BASE_URL}/doctor/patients/${patientId}/trackings`, {
    headers: getAuthHeader(),
  });
  return res.data;
};

export const updateTrackingDoctorComment = async (
  trackingId: number,
  comment: string
): Promise<BloodPressureTracking> => {
  const res = await axios.patch(
    `${BASE_URL}/${trackingId}/doctor-comment`,
    { doctor_comment: comment },
    {
      headers: getAuthHeader(),
    }
  );
  return res.data;
};

