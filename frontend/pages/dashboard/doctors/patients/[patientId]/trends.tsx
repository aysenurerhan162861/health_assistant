"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import Layout from "@/components/layout/Layout";
import NutritionTrendsView from "@/components/trends/NutritionTrendsView";
import { Box, Typography, Button, Chip, Stack } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

const DoctorPatientTrendsPage: React.FC = () => {
  const router    = useRouter();
  const params    = useParams();
  const patientId = params?.patientId ? parseInt(params.patientId as string, 10) : null;

  if (!patientId) {
    return (
      <Layout>
        <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
          <Typography color="error">Hasta ID bulunamadı.</Typography>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ maxWidth: 1200, mx: "auto", p: 2 }}>
        {/* Başlık */}
        <Box sx={{ mb: 3, mt: 2, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => router.back()}
              variant="outlined" size="small"
              sx={{ borderColor: "#d0d7e3", color: "#6b7a90", "&:hover": { bgcolor: "#f0f6ff" } }}
            >
              Geri Dön
            </Button>
            <Box>
              <Typography variant="h5" fontWeight={700} color="#0a2d57">
                Hasta Trend Analizi
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Son 30 günlük beslenme verilerine göre hazırlanmış analiz
              </Typography>
            </Box>
          </Stack>
          <Chip
            icon={<TrendingUpIcon fontSize="small" />}
            label="Beslenme Trendleri"
            sx={{ bgcolor: "#e3f2fd", color: "#1565c0", fontWeight: 600 }}
          />
        </Box>

        <NutritionTrendsView patientId={patientId} compact={false} />
      </Box>
    </Layout>
  );
};

export default DoctorPatientTrendsPage;
