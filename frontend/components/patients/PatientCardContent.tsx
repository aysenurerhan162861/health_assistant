// frontend/components/patients/PatientCardModal.tsx
import React, { useEffect, useState } from "react";
import { Box, Avatar, Typography, CircularProgress } from "@mui/material";
import { User } from "../../types/User";
import { getPatient } from "../../services/PatientApi";

interface Props {
  patient: User | null;
  onClose?: () => void;
}

// Artık modal değil → Sadece içerik! 
export default function PatientCardContent({ patient }: Props) {
  const [patientData, setPatientData] = useState<User | null>(patient);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPatient = async () => {
      if (patient) {
        try {
          setLoading(true);
          const updatedPatient = await getPatient(patient.id);
          setPatientData(updatedPatient);
        } catch (err) {
          console.error("Hasta bilgisi alınamadı:", err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchPatient();
  }, [patient]);

  if (!patientData) return (
    <Typography color="error">Hasta bilgisi bulunamadı</Typography>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Avatar
            src={patientData.photoUrl ?? ""}
            sx={{ width: 80, height: 80 }}
          />
          <Typography>Email: {patientData.email || "-"}</Typography>
          <Typography>Yaş: {patientData.age || "-"}</Typography>
          <Typography>Cinsiyet: {patientData.gender || "-"}</Typography>
          <Typography>
            Kronik Hastalıklar: {patientData.chronic_diseases || "-"}
          </Typography>
        </>
      )}
    </Box>
  );
}
