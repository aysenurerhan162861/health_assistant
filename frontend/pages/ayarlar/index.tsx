"use client";

import React from "react";
import NotificationSettingsList from "@/components/ayarlar/NotificationSettingsList";
import Layout from "@/components/layout/Layout";
import { Box, Typography, Chip } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";

const NotificationsPage: React.FC = () => {
  return (
    <Layout>
      <Box>
        {/* Başlık */}
        <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            <Typography variant="h5" fontWeight={700} color="#0a2d57">
              Bildirim Ayarları
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Hangi olaylar için push veya e-posta bildirimi alacağınızı belirleyin
            </Typography>
          </Box>
          <Chip
            icon={<NotificationsIcon fontSize="small" />}
            label="Ayarlar"
            sx={{ bgcolor: "#e8edf5", color: "#0a2d57", fontWeight: 600 }}
          />
        </Box>

        <NotificationSettingsList />
      </Box>
    </Layout>
  );
};

export default NotificationsPage;
