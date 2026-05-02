import axios from "axios";
import { StepRecord, StepRecordCreate } from "../types/StepRecord";

const BASE_URL = "http://localhost:8000/api/step_records/api/steps";

const getAuthHeader = () => {
  const token = localStorage.getItem("token") || "";
  return {
    "token-header": `Bearer ${token}`,
  };
};

export const getStepHistory = async (userId: number, days: number = 30): Promise<StepRecord[]> => {
  const res = await axios.get(`${BASE_URL}/history`, {
    headers: getAuthHeader(),
    params: { user_id: userId, days },
  });
  return res.data;
};

export const getTodaySteps = async (userId: number): Promise<StepRecord> => {
  const res = await axios.get(`${BASE_URL}/today`, {
    headers: getAuthHeader(),
    params: { user_id: userId },
  });
  return res.data;
};

export const addManualStep = async (userId: number, data: StepRecordCreate): Promise<StepRecord> => {
  const res = await axios.post(`${BASE_URL}/manual`, data, {
    headers: getAuthHeader(),
    params: { user_id: userId },
  });
  return res.data;
};

export const syncSteps = async (userId: number, data: StepRecordCreate, apiKey: string): Promise<StepRecord> => {
  const res = await axios.post(`${BASE_URL}/sync`, data, {
    headers: {
      ...getAuthHeader(),
      "x-api-key": apiKey,
    },
    params: { user_id: userId },
  });
  return res.data;
};