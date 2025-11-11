import axios from "axios";

const BASE_URL = "http://localhost:8000/api/assistants";

/**
 * Doktorun asistana hasta izni vermesi
 */
export const grantPatientPermission = async (
  doctorId: number,
  assistantId: number,
  patientId: number
) => {
  const response = await axios.post(`${BASE_URL}/${doctorId}/grant_permission`, {
    assistant_id: assistantId,
    patient_id: patientId, // burada frontend'den gelen patient.id backend users.id ile eşleşmeli
  });

  return response.data;
};

/**
 * Asistanın kendi hastalarını listelemesi
 */
export const getAssistantPatients = async (assistantId: number) => {
  const response = await axios.get(`${BASE_URL}/${assistantId}/patients`);
  return response.data;
};

/**
 * Doktorun asistandan izin kaldırması
 */
export const revokePatientPermission = async (
  doctorId: number,
  assistantId: number,
  patientId: number
) => {
  const response = await axios.delete(`${BASE_URL}/${doctorId}/revoke_permission`, {
    data: {
      assistant_id: assistantId,
      patient_id: patientId, // yine backend users.id ile eşleşmeli
    },
  });

  return response.data;
};
