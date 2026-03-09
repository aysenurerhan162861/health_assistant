"use client";
import React, { useEffect, useState } from "react";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Switch, FormControlLabel, Chip,
} from "@mui/material";
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

const primaryColor = "#0a2d57";

const AssistantPermissionManager: React.FC = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);

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
        {
          assistant_id: perm.assistant_id,
          patient_id:   perm.patient_id,
          [field]:      value,
        },
        { headers: { "token-header": `Bearer ${token}` } }
      );
      setPermissions((prev) =>
        prev.map((p) =>
          p.id === perm.id ? { ...p, [field]: value } : p
        )
      );
    } catch (err) {
      console.error("İzin güncellenemedi:", err);
    }
  };

  if (permissions.length === 0 && !loading) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 1, color: primaryColor }}>
          Asistan İzin Yönetimi
        </Typography>
        <Typography color="text.secondary">
          Henüz asistanınıza hasta atanmamış.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: primaryColor }}>
        Asistan İzin Yönetimi
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Asistanlarınızın hangi hastalara ait tahlil ve MR görüntülerini görebileceğini buradan yönetebilirsiniz.
        Öğün ve tansiyon verileri varsayılan olarak görünürdür.
      </Typography>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "#f0f4ff" }}>
              <TableCell><strong>Asistan</strong></TableCell>
              <TableCell><strong>Hasta</strong></TableCell>
              <TableCell><strong>Öğün & Tansiyon</strong></TableCell>
              <TableCell><strong>Tahliller</strong></TableCell>
              <TableCell><strong>MR Analizleri</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {permissions.map((perm) => (
              <TableRow key={perm.id} hover>
                <TableCell>{perm.assistant_name}</TableCell>
                <TableCell>{perm.patient_name}</TableCell>
                <TableCell>
                  <Chip label="Varsayılan İzinli" size="small" color="success" />
                </TableCell>
                <TableCell>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={perm.can_view_labs}
                        onChange={(e) => handleToggle(perm, "can_view_labs", e.target.checked)}
                        size="small"
                        color="primary"
                      />
                    }
                    label={perm.can_view_labs ? "İzinli" : "İzinsiz"}
                  />
                </TableCell>
                <TableCell>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={perm.can_view_mr}
                        onChange={(e) => handleToggle(perm, "can_view_mr", e.target.checked)}
                        size="small"
                        color="primary"
                      />
                    }
                    label={perm.can_view_mr ? "İzinli" : "İzinsiz"}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AssistantPermissionManager;