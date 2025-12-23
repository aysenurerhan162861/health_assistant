"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  Box,
  Button,
  TextField,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { LabReport } from "@/types/LabReport";
import PatientCardContent from "../patients/PatientCardContent";
import { updateLabReportComment, getPatientLabReports } from "@/services/LabApi";
import ReportList from "../labs/ReportList";

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
  const [doctorComment, setDoctorComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [patientReports, setPatientReports] = useState<LabReport[]>([]);

  useEffect(() => {
    setDoctorComment(labReport?.doctor_comment || "");
  }, [labReport]);

  useEffect(() => {
    const fetchReports = async () => {
      if (!labReport?.patient?.id) {
        setPatientReports([]);
        return;
      }

      try {
        const reports = await getPatientLabReports(labReport.patient.id);
        setPatientReports(reports);
      } catch (err) {
        console.error("Raporlar alınamadı:", err);
        setPatientReports([]);
      }
    };

    fetchReports();
  }, [labReport]);

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
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Detaylar
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "70vh",
          p: 0,
        }}
      >
        {/* Tabs */}
        <Box sx={{ px: 3 }}>
          <Tabs value={tabIndex} onChange={handleTabChange}>
            <Tab label="Kişisel Bilgiler" />
            <Tab label="Tahliller" />
            <Tab label="Açıklamalar" />
          </Tabs>
        </Box>

        {/* İçerik */}
        <Box sx={{ flex: 1, overflowY: "auto", p: 3 }}>
          {/* TAB 0 */}
          {tabIndex === 0 && (
            <PatientCardContent patient={labReport.patient} />
          )}

          {/* TAB 1 */}
          {tabIndex === 1 && (
            <ReportList
              reports={patientReports}
              patientId={labReport.patient.id}
              refreshReports={() => {}}
              userRole="doctor"
            />
          )}

          {/* TAB 2 (AYNEN KALDI) */}
          {tabIndex === 2 && (
            <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="Doktor Açıklaması"
                  multiline
                  minRows={5}
                  fullWidth
                  value={doctorComment}
                  onChange={(e) => setDoctorComment(e.target.value)}
                />
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 1,
                  mt: 2,
                }}
              >
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

        {/* 🔹 TAB 0 ve TAB 1 için sağ alt Kapat butonu */}
        {(tabIndex === 0 || tabIndex === 1) && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              p: 2,
              borderTop: "1px solid #eee",
            }}
          >
            <Button variant="outlined" onClick={onClose}>
              Kapat
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LabCommentModal;
