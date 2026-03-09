"use client";
import React, { useEffect, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import Layout from "../../../components/layout/Layout";
import DoctorMrTable from "../../../components/mr/DoctorMrTable";
import DoctorMrModal from "../../../components/mr/DoctorMrModal";
import { MrScan } from "../../../types/MrScan";
import axios from "axios";

const DoctorMrAnaliziPage: React.FC = () => {
  const [scans, setScans] = useState<MrScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchScans();
  }, []);

  const fetchScans = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await axios.get("http://localhost:8000/api/mr_scans/doctor/me", {
        headers: { "token-header": `Bearer ${token}` },
      });
      setScans(res.data);
    } catch (err) {
      console.error("MR scans fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (patientId: number, patientName: string) => {
    setSelectedPatientId(patientId);
    setSelectedPatientName(patientName);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedPatientId(null);
    setSelectedPatientName("");
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Layout>
      <Box sx={{ p: 2, mt: 2 }}>
        <DoctorMrTable scans={scans} onViewDetail={handleViewDetail} />
        <DoctorMrModal
          open={modalOpen}
          onClose={handleModalClose}
          patientId={selectedPatientId}
          patientName={selectedPatientName}
          onRefresh={fetchScans}
        />
      </Box>
    </Layout>
  );
};

export default DoctorMrAnaliziPage;