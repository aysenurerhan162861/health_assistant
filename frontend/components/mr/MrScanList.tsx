"use client";
import React, { useState } from "react";
import {
  Box, Card, CardContent, Typography, Chip, Collapse,
  IconButton, Divider, Tooltip, CircularProgress,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import BiotechIcon from "@mui/icons-material/Biotech";
import { MrScan } from "../../types/MrScan";

const primaryColor = "#0a2d57";

const StatusChip: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { label: string; color: "success" | "warning" | "error" | "default"; icon: React.ReactElement }> = {
    done:    { label: "Tamamlandı",  color: "success", icon: <CheckCircleIcon fontSize="small" /> },
    pending: { label: "İşleniyor",   color: "warning", icon: <HourglassEmptyIcon fontSize="small" /> },
    error:   { label: "Hata",        color: "error",   icon: <ErrorOutlineIcon fontSize="small" /> },
  };
  const cfg = map[status] ?? { label: "İşleniyor", color: "warning" as const, icon: <HourglassEmptyIcon fontSize="small" /> };
  return <Chip icon={cfg.icon} label={cfg.label} color={cfg.color} size="small" />;
};

const MrScanCard: React.FC<{ scan: MrScan }> = ({ scan }) => {
  const [expanded, setExpanded] = useState(false);
  const confidencePct = scan.dice_confidence != null ? Math.round(scan.dice_confidence * 100) : null;

  return (
    <Card sx={{
      mb: 2,
      border: scan.lesion_detected ? "1px solid #ff9800" : "1px solid #e0e0e0",
      boxShadow: scan.lesion_detected ? "0 2px 8px rgba(255,152,0,0.15)" : 1,
    }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <BiotechIcon sx={{ color: primaryColor }} />
            <Typography fontWeight={600}>{scan.file_name}</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <StatusChip status={scan.status} />
            {scan.status === "done" && (
              <Tooltip title={scan.lesion_detected ? "Lezyon Tespit Edildi" : "Lezyon Yok"}>
                {scan.lesion_detected
                  ? <WarningAmberIcon sx={{ color: "#ff9800" }} />
                  : <CheckCircleIcon sx={{ color: "#4caf50" }} />}
              </Tooltip>
            )}
            <IconButton size="small" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
          {new Date(scan.upload_date).toLocaleString("tr-TR")}
          {scan.status === "pending" && (
            <Box component="span" sx={{ ml: 1 }}>
              <CircularProgress size={10} sx={{ mr: 0.5 }} />
              Analiz devam ediyor...
            </Box>
          )}
        </Typography>

        <Collapse in={expanded}>
          <Divider sx={{ my: 2 }} />

          {scan.status === "done" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <Box sx={{ flex: 1, minWidth: 120, p: 1.5, bgcolor: "#f5f5f5", borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">Lezyon Durumu</Typography>
                  <Typography fontWeight={600} color={scan.lesion_detected ? "#f57c00" : "#388e3c"}>
                    {scan.lesion_detected ? "⚠️ Tespit Edildi" : "✅ Tespit Edilmedi"}
                  </Typography>
                </Box>
                {scan.lesion_volume != null && (
                  <Box sx={{ flex: 1, minWidth: 120, p: 1.5, bgcolor: "#f5f5f5", borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">Lezyon Hacmi</Typography>
                    <Typography fontWeight={600}>{scan.lesion_volume.toLocaleString()} voksel</Typography>
                  </Box>
                )}
                {confidencePct != null && (
                  <Box sx={{ flex: 1, minWidth: 120, p: 1.5, bgcolor: "#f5f5f5", borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">Güven Skoru</Typography>
                    <Typography fontWeight={600}>%{confidencePct}</Typography>
                  </Box>
                )}
              </Box>

              {scan.ai_comment && (
                <Box sx={{ p: 2, bgcolor: "#e3f2fd", borderRadius: 1, borderLeft: `4px solid ${primaryColor}` }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>🤖 AI Değerlendirmesi</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>{scan.ai_comment}</Typography>
                </Box>
              )}

              {scan.doctor_comment && (
                <Box sx={{ p: 2, bgcolor: "#f3e5f5", borderRadius: 1, borderLeft: "4px solid #9c27b0" }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>👨‍⚕️ Doktor Yorumu</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>{scan.doctor_comment}</Typography>
                </Box>
              )}
            </Box>
          )}

          {scan.status === "pending" && (
            <Box sx={{ textAlign: "center", py: 2 }}>
              <CircularProgress size={32} sx={{ mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Yapay zeka modeliniz görüntüyü analiz ediyor, lütfen bekleyin...
              </Typography>
            </Box>
          )}

          {scan.status === "error" && (
            <Box sx={{ p: 2, bgcolor: "#ffebee", borderRadius: 1 }}>
              <Typography variant="body2" color="error">
                {scan.ai_comment || "Analiz sırasında bir hata oluştu."}
              </Typography>
            </Box>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );
};

const MrScanList: React.FC<{ scans: MrScan[] }> = ({ scans }) => {
  if (scans.length === 0) {
    return (
      <Box sx={{ textAlign: "center", mt: 6, color: "text.secondary" }}>
        <BiotechIcon sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
        <Typography>Henüz MR görüntüsü yüklenmemiş.</Typography>
        <Typography variant="caption">Yukarıdaki butonu kullanarak ilk MR'ınızı yükleyin.</Typography>
      </Box>
    );
  }
  return <Box>{scans.map((scan) => <MrScanCard key={scan.id} scan={scan} />)}</Box>;
};

export default MrScanList;