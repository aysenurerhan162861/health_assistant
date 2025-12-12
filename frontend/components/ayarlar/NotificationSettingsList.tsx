"use client";

import React, { useEffect, useState } from "react";
import { NotificationSetting } from "@/types/Notification";
import NotificationSettingCard from "./NotificationSettingCard";
import { getNotificationSettings, updateNotificationSetting } from "@/services/NotificationApi";
import { CircularProgress, Typography, Box, Paper, TextField, MenuItem } from "@mui/material";

const NotificationSettingsList: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const primaryColor = "#0a2d57";

  useEffect(() => {
    getNotificationSettings().then((data) => {
      setSettings(data);
      setLoading(false);
    });
  }, []);

  const handleChange = (event_name: string, field: "push" | "email", value: boolean) => {
    setSettings((prev) =>
      prev.map((s) =>
        s.event_name === event_name ? { ...s, [field === "push" ? "push_enabled" : "email_enabled"]: value } : s
      )
    );

    updateNotificationSetting(
      event_name,
      field === "push" ? value : settings.find((s) => s.event_name === event_name)?.push_enabled ?? true,
      field === "email" ? value : settings.find((s) => s.event_name === event_name)?.email_enabled ?? true
    );
  };

  const filtered = [...settings]
    .filter((s) => s.event_name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) =>
      sortOrder === "asc"
        ? a.event_name.localeCompare(b.event_name)
        : b.event_name.localeCompare(a.event_name)
    );

  if (loading) return <CircularProgress />;

  return (
    <Box sx={{ p: 4, bgcolor: "#e6f0ff", minHeight: "90vh" }}>
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3 }}>
        {/* Üst Panel */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
            gap: 2,
          }}
        >
          <Typography
  variant="h6"
  sx={{ fontWeight: "bold", color: primaryColor, mt: 4 }} // mt: margin-top
>
  Bildirim Ayarları
</Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <TextField
              size="small"
              label="Ara"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <TextField
              size="small"
              label="Sırala"
              select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
            >
              <MenuItem value="asc">Yeniden Eskiye</MenuItem>
              <MenuItem value="desc">Eskiden Yeniye</MenuItem>
            </TextField>
          </Box>
        </Box>

        {/* List */}
        {filtered.map((s) => (
          <Box key={s.event_name} sx={{ mb: 2 }}>
            <NotificationSettingCard
              setting={s}
              onChange={(field, value) => handleChange(s.event_name, field, value)}
            />
          </Box>
        ))}
      </Paper>
    </Box>
  );
};

export default NotificationSettingsList;
