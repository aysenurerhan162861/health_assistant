"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, Tabs, Tab,
  Box, Button, IconButton, Avatar, Typography, Stack,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PersonIcon from "@mui/icons-material/Person";
import { LabReport } from "@/types/LabReport";
import PatientCardContent from "../patients/PatientCardContent";
import { getPatientLabReports } from "@/services/LabApi";
import ReportList from "../labs/ReportList";

interface LabCommentModalProps {
  open: boolean;
  onClose: () => void;
  labReport: LabReport | null;
  onUpdate?: (updatedReport: LabReport) => void;
}

const LabCommentModal: React.FC<LabCommentModalProps> = ({ open, onClose, labReport }) => {
  const [tabIndex, setTabIndex]           = useState(0);
  const [patientReports, setPatientReports] = useState<LabReport[]>([]);

  useEffect(() => {
    if (!labReport?.patient?.id) { setPatientReports([]); return; }
    getPatientLabReports(labReport.patient.id)
      .then(setPatientReports)
      .catch(() => setPatientReports([]));
  }, [labReport?.id]);

  if (!labReport) return null;

  const initials = labReport.patient.name?.charAt(0).toUpperCase() || "?";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3, maxHeight: "88vh" } } }}>

      {/* Başlık */}
      <DialogTitle sx={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: "1px solid #e8edf5", pb: 1.5,
      }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ width: 36, height: 36, bgcolor: "#e3f0ff", color: "#1565c0", fontWeight: 700 }}>
            {initials}
          </Avatar>
          <Box>
            <Typography fontWeight={700} color="#0a2d57" lineHeight={1.2}>
              {labReport.patient.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">Hasta Detayı</Typography>
          </Box>
        </Stack>
        <IconButton size="small" onClick={onClose} sx={{ color: "#9aa5b4" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Sekmeler */}
      <Tabs
        value={tabIndex}
        onChange={(_, v) => setTabIndex(v)}
        sx={{ px: 3, borderBottom: "1px solid #e8edf5", bgcolor: "#fafbff" }}
      >
        <Tab icon={<PersonIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Kişisel Bilgiler" />
        <Tab icon={<AssignmentIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Tahliller" />
      </Tabs>

      {/* İçerik */}
      <DialogContent sx={{ p: 3, overflowY: "auto" }}>
        {tabIndex === 0 && (
          <PatientCardContent patient={labReport.patient} />
        )}
        {tabIndex === 1 && (
          <ReportList
            reports={patientReports}
            patientId={labReport.patient.id}
            refreshReports={() => {}}
            userRole="doctor"
          />
        )}
      </DialogContent>

      <Box sx={{ display: "flex", justifyContent: "flex-end", px: 3, pb: 2, borderTop: "1px solid #e8edf5" }}>
        <Button variant="outlined" onClick={onClose} sx={{ color: "#6b7a90", borderColor: "#d0d7e3" }}>
          Kapat
        </Button>
      </Box>
    </Dialog>
  );
};

export default LabCommentModal;
