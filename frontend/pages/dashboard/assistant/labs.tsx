"use client";
import React, { useEffect, useState } from "react";
import { Box, CircularProgress, Typography, Alert } from "@mui/material";
import Layout from "../../../components/layout/Layout";
import axios from "axios";
import LabsTable from "../../../components/doctors/LabsTable";
import LabCommentModal from "../../../components/doctors/LabCommentModal";
import { LabReport } from "../../../types/LabReport";

const AssistantLabsPage: React.FC = () => {
  const [labReports, setLabReports] = useState<LabReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<LabReport | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => { fetchLabs(); }, []);

  const fetchLabs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token") || "";
      const res = await axios.get("http://localhost:8000/api/assistants/me/labs", {
        headers: { "token-header": `Bearer ${token}` },
      });
      setLabReports(res.data);
    } catch (err) {
      console.error("Tahliller alınamadı:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Layout><Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}><CircularProgress /></Box></Layout>;

  return (
    <Layout>
      <Box sx={{ p: 2, mt: 2 }}>
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}></Typography>
        {labReports.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            Tahlil görüntüleme izniniz bulunmuyor veya henüz tahlil yok.
          </Alert>
        ) : (
          <>
            <LabsTable
              labReports={labReports}
              onEditComment={(report) => { setSelectedReport(report); setModalOpen(true); }}
              userRole="assistant"
            />
            <LabCommentModal
              open={modalOpen}
              onClose={() => { setModalOpen(false); setSelectedReport(null); }}
              labReport={selectedReport}
              onUpdate={(updated) => setLabReports(prev => prev.map(r => r.id === updated.id ? updated : r))}
            />
          </>
        )}
      </Box>
    </Layout>
  );
};

export default AssistantLabsPage;