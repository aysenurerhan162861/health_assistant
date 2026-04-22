"use client";
import React, { useEffect, useState } from "react";
import {
  Box, Typography, Card, Stack, Chip, Switch, Divider,
  CircularProgress, Avatar,
} from "@mui/material";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import ScienceIcon       from "@mui/icons-material/Science";
import BiotechIcon       from "@mui/icons-material/Biotech";
import CheckCircleIcon   from "@mui/icons-material/CheckCircle";
import axios from "axios";

interface Permission {
  id: number;
  assistant_id: number;
  assistant_name: string;
  patient_id: number;
  patient_name: string;
  status: string;
  can_view_labs: boolean;
  can_view_mr: boolean;
}

const initials = (name?: string) =>
  (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

const AssistantPermissionManager: React.FC = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading]         = useState(false);

  const doctorId =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")?.id
      : null;

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

  useEffect(() => {
    if (!doctorId) return;
    fetchPermissions();
  }, [doctorId]);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:8000/api/assistants/${doctorId}/permissions`
      );
      setPermissions(res.data);
    } catch (err) {
      console.error("İzinler alınamadı:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (
    perm: Permission,
    field: "can_view_labs" | "can_view_mr",
    value: boolean
  ) => {
    try {
      await axios.patch(
        `http://localhost:8000/api/assistants/${doctorId}/update_permission`,
        { assistant_id: perm.assistant_id, patient_id: perm.patient_id, [field]: value },
        { headers: { "token-header": `Bearer ${token}` } }
      );
      setPermissions((prev) =>
        prev.map((p) => p.id === perm.id ? { ...p, [field]: value } : p)
      );
    } catch (err) {
      console.error("İzin güncellenemedi:", err);
    }
  };

  return (
    <Box>
      {/* Başlık */}
      <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
        <AssignmentIndIcon sx={{ color: "#0a2d57", fontSize: 22 }} />
        <Box>
          <Typography variant="subtitle1" fontWeight={700} color="#0a2d57">
            Asistan Erişim Yönetimi
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Asistanlarınızın hangi hastalara ait tahlil ve MR verilerini görebileceğini yönetin.
            Öğün ve tansiyon verileri varsayılan olarak görünürdür.
          </Typography>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress sx={{ color: "#0a2d57" }} />
        </Box>
      ) : permissions.length === 0 ? (
        <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2, py: 6, textAlign: "center" }}>
          <AssignmentIndIcon sx={{ fontSize: 40, color: "#d0d7e3", mb: 1 }} />
          <Typography color="text.secondary">
            Henüz asistanınıza hasta atanmamış.
          </Typography>
        </Card>
      ) : (
        <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2, overflow: "hidden" }}>
          {/* Tablo başlığı */}
          <Box sx={{
            px: 2.5, py: 1.5, bgcolor: "#f8faff",
            borderBottom: "1px solid #e8edf5",
            display: "grid",
            gridTemplateColumns: "1.5fr 1.5fr 1fr 1fr 1fr",
            gap: 1, alignItems: "center",
          }}>
            {[
              "Asistan",
              "Hasta",
              "Öğün & Tansiyon",
              <Stack key="labs" direction="row" alignItems="center" spacing={0.5}>
                <ScienceIcon sx={{ fontSize: 14, color: "#6b7a90" }} />
                <span>Tahliller</span>
              </Stack>,
              <Stack key="mr" direction="row" alignItems="center" spacing={0.5}>
                <BiotechIcon sx={{ fontSize: 14, color: "#6b7a90" }} />
                <span>MR Analizleri</span>
              </Stack>,
            ].map((h, i) => (
              <Typography key={i} variant="caption" fontWeight={700} color="#6b7a90"
                sx={{ textTransform: "uppercase", letterSpacing: 0.6, display: "flex", alignItems: "center" }}
                component="div">
                {h}
              </Typography>
            ))}
          </Box>

          <Stack divider={<Divider sx={{ borderColor: "#f0f4fa" }} />}>
            {permissions.map((perm) => (
              <Box key={perm.id} sx={{
                px: 2.5, py: 1.75,
                display: "grid",
                gridTemplateColumns: "1.5fr 1.5fr 1fr 1fr 1fr",
                gap: 1, alignItems: "center",
                "&:hover": { bgcolor: "#fafbff" },
                transition: "background .15s",
              }}>
                {/* Asistan */}
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: "#e3f0ff", color: "#1565c0", fontSize: 12, fontWeight: 700 }}>
                    {initials(perm.assistant_name)}
                  </Avatar>
                  <Typography variant="body2" fontWeight={600} color="#1a2e4a" noWrap>
                    {perm.assistant_name}
                  </Typography>
                </Stack>

                {/* Hasta */}
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: "#e8f5e9", color: "#2e7d32", fontSize: 12, fontWeight: 700 }}>
                    {initials(perm.patient_name)}
                  </Avatar>
                  <Typography variant="body2" color="#1a2e4a" noWrap>
                    {perm.patient_name}
                  </Typography>
                </Stack>

                {/* Öğün & Tansiyon — varsayılan */}
                <Chip
                  icon={<CheckCircleIcon sx={{ fontSize: "14px !important" }} />}
                  label="Varsayılan"
                  size="small"
                  sx={{ bgcolor: "#e8f5e9", color: "#2e7d32", fontWeight: 600, fontSize: 11 }}
                />

                {/* Tahliller */}
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Switch
                    size="small"
                    checked={perm.can_view_labs}
                    onChange={(e) => handleToggle(perm, "can_view_labs", e.target.checked)}
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked":                    { color: "#0a2d57" },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#0a2d57" },
                    }}
                  />
                  <Typography variant="caption" color={perm.can_view_labs ? "#0a2d57" : "#9aa5b4"} fontWeight={600}>
                    {perm.can_view_labs ? "İzinli" : "Kapalı"}
                  </Typography>
                </Stack>

                {/* MR */}
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Switch
                    size="small"
                    checked={perm.can_view_mr}
                    onChange={(e) => handleToggle(perm, "can_view_mr", e.target.checked)}
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked":                    { color: "#0a2d57" },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#0a2d57" },
                    }}
                  />
                  <Typography variant="caption" color={perm.can_view_mr ? "#0a2d57" : "#9aa5b4"} fontWeight={600}>
                    {perm.can_view_mr ? "İzinli" : "Kapalı"}
                  </Typography>
                </Stack>
              </Box>
            ))}
          </Stack>
        </Card>
      )}
    </Box>
  );
};

export default AssistantPermissionManager;
