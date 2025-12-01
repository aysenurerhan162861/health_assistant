"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  Box,
  Button,
  TextField,
} from "@mui/material";
import { LabReport } from "@/types/LabReport";
import TestsTable from "../labs/TestsTable";
import PatientCardContent from "../patients/PatientCardContent"; // içerik bileşeni
import { updateLabReportComment } from "@/services/LabApi";

interface LabCommentModalProps {
  open: boolean;
  onClose: () => void;
  labReport: LabReport | null;
  onUpdate?: (updatedReport: LabReport) => void;
}

const LabCommentModal: React.FC<LabCommentModalProps> = ({
  open,
  onClose,
  labReport,
  onUpdate,
}) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [doctorComment, setDoctorComment] = useState<string>(
    labReport?.doctor_comment || ""
  );
  const [saving, setSaving] = useState(false);

  if (!labReport) return null;

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const handleSaveComment = async () => {
    try {
      setSaving(true);
      await updateLabReportComment(labReport.id, doctorComment);
      if (onUpdate) {
        onUpdate({ ...labReport, doctor_comment: doctorComment });
      }
    } catch (err) {
      console.error(err);
      alert("Doktor açıklaması kaydedilemedi!");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Detaylar - {labReport.file_name}</DialogTitle>
      <DialogContent>
        <Tabs value={tabIndex} onChange={handleTabChange}>
          <Tab label="Kişisel Bilgiler" />
          <Tab label="Tahliller" />
          <Tab label="Açıklamalar" />
        </Tabs>

        <Box sx={{ mt: 2 }}>
          {/* TAB 0 - Kişisel Bilgiler */}
          {tabIndex === 0 && <PatientCardContent patient={labReport.patient} />}

          {/* TAB 1 - Tahliller */}
          {tabIndex === 1 && (
            <TestsTable parsedData={labReport.parsed_data} />
          )}

          {/* TAB 2 - Doktor Açıklamaları */}
          {tabIndex === 2 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Doktor Açıklaması"
                multiline
                minRows={5}
                fullWidth
                value={doctorComment}
                onChange={(e) => setDoctorComment(e.target.value)}
              />

              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={handleSaveComment}
                  disabled={saving}
                >
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </Button>
                <Button variant="outlined" onClick={onClose}>
                  Kapat
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default LabCommentModal;
