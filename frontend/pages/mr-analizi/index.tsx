"use client";
import React, { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import UploadMrScan from "@/components/mr/UploadMrScan";
import MrScanList from "@/components/mr/MrScanList";
import axios from "axios";
import { Box, Typography, CircularProgress } from "@mui/material";
import { MrScan } from "../../types/MrScan";

const MrAnaliziPage: React.FC = () => {
  const [scans, setScans] = useState<MrScan[]>([]);
  const [loading, setLoading] = useState(false);
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
      const res = await axios.get(
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

  useEffect(() => {
    fetchScans();
  }, [patientId]);

  // Pending varsa 5 saniyede bir otomatik yenile
  useEffect(() => {
    const hasPending = scans.some((s) => s.status === "pending");
    if (!hasPending) return;
    const interval = setInterval(fetchScans, 5000);
    return () => clearInterval(interval);
  }, [scans, patientId]);

  return (
    <Layout>
      <Box sx={{ mt: 6, mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h5">MR Görüntülerim</Typography>
      </Box>

      {patientId && (
        <UploadMrScan patientId={patientId} onUploadSuccess={fetchScans} />
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        patientId && <MrScanList scans={scans} />
      )}
    </Layout>
  );
};

export default MrAnaliziPage;