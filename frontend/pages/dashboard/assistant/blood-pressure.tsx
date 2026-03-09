"use client";
import React, { useEffect, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import Layout from "../../../components/layout/Layout";
import BloodPressureTable from "../../../components/doctors/BloodPressureTable";
import BloodPressureModal from "../../../components/doctors/BloodPressureModal";
import { BloodPressureTracking } from "../../../types/BloodPressure";
import { User } from "../../../types/user";
import axios from "axios";

const AssistantBloodPressurePage: React.FC = () => {
  const [trackings, setTrackings] = useState<(BloodPressureTracking & { patient?: User })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTracking, setSelectedTracking] = useState<(BloodPressureTracking & { patient?: User }) | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => { fetchTrackings(); }, []);

  const fetchTrackings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token") || "";
      const res = await axios.get("http://localhost:8000/api/assistants/me/blood-pressure", {
        headers: { "token-header": `Bearer ${token}` },
      });
      setTrackings(res.data);
    } catch (err) {
      console.error("Tansiyon verileri alinamadi:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Layout><Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}><CircularProgress /></Box></Layout>;

  return (
    <Layout>
      <Box sx={{ p: 2, mt: 2 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>Tansiyon Takibi</Typography>
        <BloodPressureTable
          trackings={trackings}
          onViewDetail={(t) => { setSelectedTracking(t); setModalOpen(true); }}
          userRole="assistant"
        />
        <BloodPressureModal
          open={modalOpen}
          onClose={() => { setModalOpen(false); setSelectedTracking(null); }}
          tracking={selectedTracking}
          userRole="assistant"
          allTrackings={trackings}
        />
      </Box>
    </Layout>
  );
};

export default AssistantBloodPressurePage;
