// frontend/components/patients/PatientCardContent.tsx
"use client";
import React, { useEffect, useState } from "react";
import {
  Box, Avatar, Typography, CircularProgress, Divider,
  Stack, Chip,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import CakeIcon from "@mui/icons-material/Cake";
import WcIcon from "@mui/icons-material/Wc";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { User } from "../../types/Staff";
import { getPatient } from "../../services/PatientApi";

type PatientInput = (Partial<User> & { id: number }) | null;

interface Props {
  patient: PatientInput;
  onClose?: () => void;
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string | number | null;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => {
  if (!value) return null;
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, py: 0.75 }}>
      <Box sx={{ color: "#1565c0", mt: 0.2, flexShrink: 0 }}>{icon}</Box>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.2 }}>
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={500} color="#1a2e4a">
          {value}
        </Typography>
      </Box>
    </Box>
  );
};

export default function PatientCardContent({ patient }: Props) {
  const [patientData, setPatientData] = useState<Partial<User> & { id?: number } | null>(patient);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!patient?.id) return;
    const fetchPatient = async () => {
      try {
        setLoading(true);
        const updated = await getPatient(patient.id!);
        setPatientData(updated as unknown as User);
      } catch {
        setPatientData(patient);
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [patient]);

  if (!patientData) return (
    <Typography color="text.secondary" textAlign="center" py={3}>
      Hasta bilgisi bulunamadı.
    </Typography>
  );

  if (loading) return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
      <CircularProgress size={32} sx={{ color: "#1565c0" }} />
    </Box>
  );

  const fullAddress = [patientData.neighborhood, patientData.district, patientData.city]
    .filter(Boolean).join(", ");

  return (
    <Box>
      {/* Profile header */}
      <Stack direction="row" spacing={2} alignItems="center" mb={3}>
        <Avatar
          src={patientData.photoUrl || ""}
          sx={{ width: 72, height: 72, border: "2px solid #1976d2", bgcolor: "#e3f0ff" }}
        >
          <PersonIcon sx={{ fontSize: 36, color: "#1565c0" }} />
        </Avatar>
        <Box>
          <Typography variant="h6" fontWeight={700} color="#0a2d57" lineHeight={1.2}>
            {patientData.name || "—"}
          </Typography>
          <Typography variant="body2" color="text.secondary">{patientData.email || "—"}</Typography>
          {patientData.role && (
            <Chip
              label={patientData.role}
              size="small"
              sx={{ mt: 0.5, bgcolor: "#e3f0ff", color: "#1565c0", fontWeight: 600, fontSize: 11 }}
            />
          )}
        </Box>
      </Stack>

      <Divider sx={{ mb: 2, borderColor: "#e8edf5" }} />

      {/* Kişisel bilgiler */}
      <Typography variant="subtitle2" fontWeight={700} color="#0a2d57" mb={1}>
        Kişisel Bilgiler
      </Typography>
      <Box sx={{ pl: 0.5 }}>
        <InfoRow icon={<EmailIcon fontSize="small" />}       label="E-posta"      value={patientData.email} />
        <InfoRow icon={<PhoneIcon fontSize="small" />}       label="Telefon"      value={patientData.phone} />
        <InfoRow icon={<CakeIcon fontSize="small" />}        label="Doğum Tarihi" value={patientData.birth_date} />
        <InfoRow icon={<WcIcon fontSize="small" />}          label="Cinsiyet"     value={patientData.gender} />
        <InfoRow icon={<LocationOnIcon fontSize="small" />}  label="Adres"        value={fullAddress || undefined} />
      </Box>

      <Divider sx={{ my: 2, borderColor: "#e8edf5" }} />

      {/* Sağlık bilgileri */}
      <Typography variant="subtitle2" fontWeight={700} color="#0a2d57" mb={1}>
        Sağlık Bilgileri
      </Typography>
      <Box sx={{ pl: 0.5 }}>
        <InfoRow icon={<BloodtypeIcon fontSize="small" />}     label="Kan Grubu"          value={patientData.blood_type} />
        <InfoRow icon={<MonitorHeartIcon fontSize="small" />}  label="Kronik Hastalıklar" value={patientData.chronic_diseases} />
        <InfoRow icon={<WarningAmberIcon fontSize="small" />}  label="Alerjiler"           value={patientData.allergies} />
        <InfoRow icon={<InfoOutlinedIcon fontSize="small" />}  label="Not"                 value={patientData.about} />
      </Box>
    </Box>
  );
}
