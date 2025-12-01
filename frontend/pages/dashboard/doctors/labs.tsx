"use client";

import React, { useEffect, useState } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import Layout from "../../../components/layout/Layout";
import LabCommentModal from "../../../components/doctors/LabCommentModal";
import { LabReport } from "../../../types/LabReport";
import { getDoctorLabReports } from "../../../services/LabApi";
import LabsTable from "../../../components/doctors/LabsTable";

const DoctorLabsPage: React.FC = () => {
  const [labReports, setLabReports] = useState<LabReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<LabReport | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchLabReports();
  }, []);

  const fetchLabReports = async () => {
    try {
      const data = await getDoctorLabReports();
      console.log("Lab reports from backend:", data);
      setLabReports(data);
    } catch (err) {
      console.error("Lab raporları alınamadı:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditComment = (report: LabReport) => {
    setSelectedReport(report);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedReport(null);
  };

  const handleUpdateReport = (updatedReport: LabReport) => {
    setLabReports((prev) =>
      prev.map((r) => (r.id === updatedReport.id ? updatedReport : r))
    );
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

        {/* LabsTable artık klasik Table tabanlı */}
        <LabsTable
          labReports={labReports}
          onEditComment={handleEditComment}
          userRole="doctor" // veya "patient", rolü prop ile geçiyoruz
        />

        <LabCommentModal
          open={modalOpen}
          onClose={handleModalClose}
          labReport={selectedReport}
        />
      </Box>
    </Layout>
  );
};

export default DoctorLabsPage;
