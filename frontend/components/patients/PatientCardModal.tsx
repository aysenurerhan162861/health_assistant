// frontend/components/modals/PatientCardModal.tsx
import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, Box, Avatar, Typography, CircularProgress } from "@mui/material";
import { User } from "../../types/User";
import { getPatient } from "../../services/PatientApi"; // API servisini oluşturacağız

interface Props {
  patient: User | null;
  onClose: () => void;
}

export default function PatientCardModal({ patient, onClose }: Props) {
  const [patientData, setPatientData] = useState<User | null>(patient);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPatient = async () => {
      if (patient) {
        try {
          setLoading(true);
          const updatedPatient = await getPatient(patient.id); // API'den güncel veri
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

  if (!patientData) return null;

  return (
    <Dialog open={!!patient} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{patientData.name} - Bilgiler</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Avatar src={patientData.photoUrl ?? ""} sx={{ width: 80, height: 80 }} />
            <Typography>Email: {patientData.email || "-"}</Typography>
            <Typography>Yaş: {patientData.age || "-"}</Typography>
            <Typography>Cinsiyet: {patientData.gender || "-"}</Typography>
            <Typography>Kronik Hastalıklar: {patientData.chronic_diseases || "-"}</Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
