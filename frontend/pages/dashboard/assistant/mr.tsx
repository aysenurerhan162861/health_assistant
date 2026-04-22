"use client";
import React, { useEffect, useState } from "react";
import { Box, CircularProgress, Alert } from "@mui/material";
import Layout from "../../../components/layout/Layout";
import axios from "axios";
import DoctorMrTable from "../../../components/mr/DoctorMrTable";
import DoctorMrModal from "../../../components/mr/DoctorMrModal";

const AssistantMrPage: React.FC = () => {
  const [scans, setScans]                         = useState<any[]>([]);
  const [loading, setLoading]                     = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState("");
  const [modalOpen, setModalOpen]                 = useState(false);

  useEffect(() => { fetchScans(); }, []);

  const fetchScans = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token") || "";
      const res   = await axios.get("http://localhost:8000/api/assistants/me/mr-scans", {
        headers: { "token-header": `Bearer ${token}` },
      });
      setScans(res.data);
    } catch (err) {
      console.error("MR taramaları alınamadı:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
          <CircularProgress sx={{ color: "#6a1b9a" }} />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ p: 2, mt: 2 }}>
        {scans.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            MR görüntüleme izniniz bulunmuyor veya henüz MR yok. Doktorunuzdan izin talep edin.
          </Alert>
        ) : (
          <>
            <DoctorMrTable
              scans={scans}
              onViewDetail={(patientId, patientName) => {
                setSelectedPatientId(patientId);
                setSelectedPatientName(patientName);
                setModalOpen(true);
              }}
            />
            <DoctorMrModal
              open={modalOpen}
              onClose={() => { setModalOpen(false); setSelectedPatientId(null); }}
              patientId={selectedPatientId}
              patientName={selectedPatientName}
              onRefresh={fetchScans}
              userRole="assistant"
              allScans={scans}
            />
          </>
        )}
      </Box>
    </Layout>
  );
};

export default AssistantMrPage;
