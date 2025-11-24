"use client"; // Next.js 13+ için sayfanın tamamen client-side olmasını sağlar

import React, { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import UploadLabReport from "@/components/labs/UploadLabReport";
import ReportList from "@/components/labs/ReportList";
import HealthComment from "@/components/labs/HealthComment"; // <- EKLENDİ
import axios from "axios";
import { Box, Typography, CircularProgress } from "@mui/material";
import { LabReport } from "../../types/LabReport";

const TahlilPage: React.FC = () => {
  const [reports, setReports] = useState<LabReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [patientId, setPatientId] = useState<number | null>(null);

  // Kullanıcıyı localStorage'dan al
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setPatientId(user.id);
    }
  }, []);

  // Lab raporlarını API'den çek
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

  useEffect(() => {
    fetchReports();
  }, [patientId]);

  return (
    <Layout>
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h4">Tahlillerim</Typography>
      </Box>

      {/* PDF Yükleme */}
      {patientId && (
        <UploadLabReport patientId={patientId} onUploadSuccess={fetchReports} />
      )}

      {/* Tahlil Listesi */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        patientId && (
          <>
            <ReportList 
              reports={reports} 
              patientId={patientId} 
              refreshReports={fetchReports} 
            />

          </>
        )
      )}
    </Layout>
  );
};

export default TahlilPage;
