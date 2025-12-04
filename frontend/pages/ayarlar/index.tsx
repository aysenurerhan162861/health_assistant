import React from "react";
import NotificationSettingsList from "@/components/ayarlar/NotificationSettingsList";
import Layout from "@/components/layout/Layout";
import { Box, Typography } from "@mui/material";

const NotificationsPage: React.FC = () => {
  return (
    <Layout> 
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" sx={{ mb: 4 }}>
          Bildirim Ayarları
        </Typography>
        <NotificationSettingsList />
      </Box>
    </Layout>
  );
};

export default NotificationsPage;
