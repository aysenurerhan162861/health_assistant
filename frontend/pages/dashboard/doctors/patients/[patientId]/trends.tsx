"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import Layout from "@/components/layout/Layout";
import NutritionTrendsView from "@/components/trends/NutritionTrendsView";
import { Box, Typography, Button, Paper } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const DoctorPatientTrendsPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const patientId = params?.patientId ? parseInt(params.patientId as string, 10) : null;

  if (!patientId) {
    return (
      <Layout>
        <Box sx={{ p: 3 }}>
          <Typography>Hasta ID bulunamadı.</Typography>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 2, mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.back()}
            variant="outlined"
          >
            Geri Dön
          </Button>
          <Typography variant="h6">
            Hasta Beslenme Trend Analizi
          </Typography>
        </Paper>
        <NutritionTrendsView patientId={patientId} compact={false} />
      </Box>
    </Layout>
  );
};

export default DoctorPatientTrendsPage;

