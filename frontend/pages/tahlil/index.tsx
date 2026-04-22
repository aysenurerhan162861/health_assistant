"use client";

import React, { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import UploadLabReport from "@/components/labs/UploadLabReport";
import ReportList from "@/components/labs/ReportList";
import axios from "axios";
import {
  Box, Typography, CircularProgress, Chip,
} from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { LabReport } from "../../types/LabReport";

const TahlilPage: React.FC = () => {
  const [reports, setReports]               = useState<LabReport[]>([]);
  const [loading, setLoading]               = useState(false);
  const [patientId, setPatientId]           = useState<number | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<"doctor" | "citizen">("citizen");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const user = JSON.parse(stored);
      setPatientId(user.id);
      setCurrentUserRole(user.role);
    }
  }, []);

  const fetchReports = async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:8000/api/lab_reports/patient/${patientId}`);
      setReports(res.data);
    } catch (err) {
      console.error("Lab reports fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, [patientId]);

  return (
    <Layout>
      <Box sx={{ maxWidth: 1100, mx: "auto" }}>
        {/* Başlık */}
        <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            <Typography variant="h5" fontWeight={700} color="#0a2d57">Tahlillerim</Typography>
            <Typography variant="body2" color="text.secondary">
              Yüklediğiniz tahlil raporları ve sonuçları
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Chip
              icon={<AssignmentIcon fontSize="small" />}
              label={`${reports.length} rapor`}
              sx={{ bgcolor: "#e3f0ff", color: "#1565c0", fontWeight: 600 }}
            />
            {patientId && (
              <UploadLabReport patientId={patientId} onUploadSuccess={fetchReports} />
            )}
          </Box>
        </Box>

        {/* İçerik */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}>
            <CircularProgress sx={{ color: "#1565c0" }} />
          </Box>
        ) : patientId ? (
          <ReportList
            reports={reports}
            patientId={patientId}
            refreshReports={fetchReports}
            userRole={currentUserRole}
          />
        ) : null}
      </Box>
    </Layout>
  );
};

export default TahlilPage;
