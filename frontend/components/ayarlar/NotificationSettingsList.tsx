"use client";

import React, { useEffect, useState } from "react";
import { NotificationSetting } from "@/types/Notification";
import NotificationSettingCard, { getEventConfig } from "./NotificationSettingCard";
import { getNotificationSettings, updateNotificationSetting } from "@/services/NotificationApi";
import {
  CircularProgress, Box, Card, TextField, MenuItem,
  InputAdornment, Stack, Typography, Chip, Button, Divider,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import NotificationsIcon from "@mui/icons-material/Notifications";
import NotificationsOffIcon from "@mui/icons-material/NotificationsOff";
import DoneAllIcon from "@mui/icons-material/DoneAll";

type RoleKey = "doctor" | "citizen" | "assistant";

const NotificationSettingsList: React.FC = () => {
  const [settings, setSettings]   = useState<NotificationSetting[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState<"all" | "active" | "passive">("all");
  const [userRole, setUserRole]   = useState<RoleKey>("citizen");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const role = JSON.parse(stored).role?.toLowerCase();
        if (role === "doctor" || role === "doktor") setUserRole("doctor");
        else if (role === "assistant" || role === "asistan") setUserRole("assistant");
        else setUserRole("citizen");
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    getNotificationSettings().then((data) => {
      setSettings(data);
      setLoading(false);
    });
  }, []);

  const handleChange = (event_name: string, field: "push" | "email", value: boolean) => {
    setSettings((prev) =>
      prev.map((s) =>
        s.event_name === event_name
          ? { ...s, [field === "push" ? "push_enabled" : "email_enabled"]: value }
          : s
      )
    );
    const current = settings.find((s) => s.event_name === event_name);
    updateNotificationSetting(
      event_name,
      field === "push"  ? value : (current?.push_enabled  ?? true),
      field === "email" ? value : (current?.email_enabled ?? true)
    );
  };

  const handleBulkToggle = (enabled: boolean) => {
    const updated = settings.map((s) => ({ ...s, push_enabled: enabled, email_enabled: enabled }));
    setSettings(updated);
    updated.forEach((s) => updateNotificationSetting(s.event_name, enabled, enabled));
  };

  const filtered = settings.filter((s) => {
    const label       = getEventConfig(s.event_name, userRole).label.toLowerCase();
    const matchSearch = label.includes(search.toLowerCase()) ||
                        s.event_name.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all"     ? true
      : filter === "active"  ? (s.push_enabled || s.email_enabled)
      : !(s.push_enabled || s.email_enabled);
    return matchSearch && matchFilter;
  });

  const activeCount  = settings.filter((s) => s.push_enabled || s.email_enabled).length;
  const passiveCount = settings.length - activeCount;

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress sx={{ color: "#0a2d57" }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Özet + toplu işlemler */}
      <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2, p: 2.5, mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between"
          alignItems={{ sm: "center" }} spacing={2}>
          <Stack direction="row" spacing={1.5} flexWrap="wrap" alignItems="center">
            <Chip
              icon={<NotificationsIcon fontSize="small" />}
              label={`${settings.length} bildirim türü`}
              sx={{ bgcolor: "#e8edf5", color: "#0a2d57", fontWeight: 600 }}
            />
            <Chip label={`${activeCount} aktif`} size="small"
              sx={{ bgcolor: "#e8f5e9", color: "#2e7d32", fontWeight: 600 }} />
            {passiveCount > 0 && (
              <Chip label={`${passiveCount} kapalı`} size="small"
                sx={{ bgcolor: "#f3f4f6", color: "#9aa5b4", fontWeight: 600 }} />
            )}
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" startIcon={<DoneAllIcon fontSize="small" />}
              onClick={() => handleBulkToggle(true)}
              sx={{ borderColor: "#0a2d57", color: "#0a2d57", fontSize: 12,
                "&:hover": { bgcolor: "#e3f0ff" } }}>
              Tümünü Aç
            </Button>
            <Button size="small" variant="outlined" startIcon={<NotificationsOffIcon fontSize="small" />}
              onClick={() => handleBulkToggle(false)}
              sx={{ borderColor: "#d0d7e3", color: "#6b7a90", fontSize: 12,
                "&:hover": { bgcolor: "#f3f4f6" } }}>
              Tümünü Kapat
            </Button>
          </Stack>
        </Stack>
      </Card>

      {/* Filtreler */}
      <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2, p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            size="small" fullWidth placeholder="Bildirim adıyla ara..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: "#9aa5b4" }} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            select size="small" value={filter}
            onChange={(e) => setFilter(e.target.value as "all" | "active" | "passive")}
            sx={{ minWidth: 170 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterListIcon fontSize="small" sx={{ color: "#9aa5b4" }} />
                  </InputAdornment>
                ),
              },
            }}
          >
            <MenuItem value="all">Tüm Bildirimler</MenuItem>
            <MenuItem value="active">Yalnızca Aktif</MenuItem>
            <MenuItem value="passive">Yalnızca Kapalı</MenuItem>
          </TextField>
        </Stack>
      </Card>

      {/* Liste */}
      {filtered.length === 0 ? (
        <Box sx={{ py: 8, textAlign: "center" }}>
          <NotificationsIcon sx={{ fontSize: 40, color: "#d0d7e3", mb: 1 }} />
          <Typography color="text.secondary">Eşleşen bildirim bulunamadı.</Typography>
        </Box>
      ) : (
        <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2, overflow: "hidden" }}>
          {/* Başlık satırı */}
          <Box sx={{
            px: 2.5, py: 1.5, bgcolor: "#f8faff",
            borderBottom: "1px solid #e8edf5",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <Typography variant="caption" fontWeight={700} color="#6b7a90"
              sx={{ textTransform: "uppercase", letterSpacing: 0.6 }}>
              Bildirim Türü
            </Typography>
            <Stack direction="row" spacing={4.5} sx={{ pr: 1 }}>
              <Typography variant="caption" fontWeight={700} color="#6b7a90"
                sx={{ textTransform: "uppercase", letterSpacing: 0.6, minWidth: 40, textAlign: "center" }}>
                Push
              </Typography>
              <Typography variant="caption" fontWeight={700} color="#6b7a90"
                sx={{ textTransform: "uppercase", letterSpacing: 0.6, minWidth: 56, textAlign: "center" }}>
                E-posta
              </Typography>
            </Stack>
          </Box>

          <Stack divider={<Divider sx={{ borderColor: "#f0f4fa" }} />}>
            {filtered.map((s) => (
              <NotificationSettingCard
                key={s.event_name}
                setting={s}
                role={userRole}
                onChange={(field, value) => handleChange(s.event_name, field, value)}
              />
            ))}
          </Stack>
        </Card>
      )}
    </Box>
  );
};

export default NotificationSettingsList;
