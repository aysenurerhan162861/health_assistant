"use client";
import React, { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import UploadMrScan from "@/components/mr/UploadMrScan";
import MrScanList from "@/components/mr/MrScanList";
import axios from "axios";
import { Box, Typography, CircularProgress, Chip, Stack } from "@mui/material";
import BiotechIcon from "@mui/icons-material/Biotech";
import { MrScan } from "../../types/MrScan";

const MrAnaliziPage: React.FC = () => {
  const [scans, setScans]         = useState<MrScan[]>([]);
  const [loading, setLoading]     = useState(false);
  const [patientId, setPatientId] = useState<number | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setPatientId(user.id);
    }
  }, []);

  const fetchScans = async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res   = await axios.get(
        `http://localhost:8000/api/mr_scans/patient/${patientId}`,
        { headers: { "token-header": `Bearer ${token}` } }
      );
      setScans(res.data);
    } catch (err) {
      console.error("MR scans fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchScans(); }, [patientId]);

  // Pending varsa 5 saniyede bir otomatik yenile
  useEffect(() => {
    const hasPending = scans.some((s) => s.status === "pending");
    if (!hasPending) return;
    const interval = setInterval(fetchScans, 5000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scans, patientId]);

  return (
    <Layout>
      <Box sx={{ maxWidth: 1100, mx: "auto", p: 2 }}>
        {/* Başlık */}
        <Box sx={{ mb: 3, mt: 2, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            <Typography variant="h5" fontWeight={700} color="#0a2d57">MR Görüntülerim</Typography>
            <Typography variant="body2" color="text.secondary">
              Yüklediğiniz MR görüntüleri ve AI analiz sonuçları
            </Typography>
          </Box>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Chip
              icon={<BiotechIcon fontSize="small" />}
              label={`${scans.length} görüntü`}
              sx={{ bgcolor: "#ede7f6", color: "#6a1b9a", fontWeight: 600 }}
            />
            {patientId && (
              <UploadMrScan patientId={patientId} onUploadSuccess={fetchScans} />
            )}
          </Stack>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: "#6a1b9a" }} />
          </Box>
        ) : (
          patientId && <MrScanList scans={scans} />
        )}
      </Box>
    </Layout>
  );
};

export default MrAnaliziPage;
