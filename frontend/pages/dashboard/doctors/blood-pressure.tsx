"use client";

import React, { useEffect, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import Layout from "../../../components/layout/Layout";
import BloodPressureModal from "../../../components/doctors/BloodPressureModal";
import { BloodPressureTracking } from "../../../types/BloodPressure";
import { User } from "../../../types/user";
import { getDoctorTrackings } from "../../../services/BloodPressureApi";
import BloodPressureTable from "../../../components/doctors/BloodPressureTable";

const DoctorBloodPressurePage: React.FC = () => {
  const [trackings, setTrackings] = useState<(BloodPressureTracking & { patient?: User })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTracking, setSelectedTracking] = useState<
    (BloodPressureTracking & { patient?: User }) | null
  >(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchTrackings();
  }, []);

  const fetchTrackings = async () => {
    try {
      setLoading(true);
      const data = await getDoctorTrackings();
      console.log("Trackings from backend:", data);
      setTrackings(data as (BloodPressureTracking & { patient?: User })[]);
    } catch (err) {
      console.error("Tansiyon takipleri alınamadı:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (tracking: BloodPressureTracking & { patient?: User }) => {
    setSelectedTracking(tracking);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedTracking(null);
  };

  if (loading) {
    return (
      <Layout>
        <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ p: 2, mt: 2 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          Tansiyon Takibi
        </Typography>
        <BloodPressureTable
          trackings={trackings}
          onViewDetail={handleViewDetail}
          userRole="doctor"
        />

        <BloodPressureModal
          open={modalOpen}
          onClose={handleModalClose}
          tracking={selectedTracking}
        />
      </Box>
    </Layout>
  );
};

export default DoctorBloodPressurePage;

