"use client";
import React, { useState } from "react";
import {
  Box, Typography, Chip, Stack, Button, Collapse, Card,
  TextField, MenuItem, InputAdornment, CircularProgress,
} from "@mui/material";
import BiotechIcon from "@mui/icons-material/Biotech";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import DownloadIcon from "@mui/icons-material/Download";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import { MrScan } from "@/types/MrScan";
import GradCamViewer from "./GradCamViewer";

type StatusCfg = { label: string; bgcolor: string; color: string };

const STATUS_MAP: Record<string, StatusCfg> = {
  done:    { label: "Tamamlandı", bgcolor: "#e8f5e9", color: "#2e7d32" },
  pending: { label: "İşleniyor",  bgcolor: "#fff3e0", color: "#e65100" },
  error:   { label: "Hata",       bgcolor: "#ffebee", color: "#c62828" },
};
const STATUS_FALLBACK: StatusCfg = { label: "Bilinmiyor", bgcolor: "#f3f4f6", color: "#555" };
const getStatusCfg = (s: string): StatusCfg => STATUS_MAP[s] ?? STATUS_FALLBACK;

const getBorderColor = (scan: MrScan): string => {
  if (scan.status === "pending") return "#e65100";
  if (scan.status === "error")   return "#c62828";
  return scan.lesion_detected    ? "#f57c00" : "#2e7d32";
};

interface Props {
  scans: MrScan[];
}

const MrScanList: React.FC<Props> = ({ scans }) => {
  const [openId, setOpenId]             = useState<number | null>(null);
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = scans
    .filter((s) => {
      const matchSearch = s.file_name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime());

  const handleDownload = (scan: MrScan) => {
    window.open(`http://localhost:8000/api/mr_scans/${scan.id}/file`, "_blank");
  };

  if (scans.length === 0) {
    return (
      <Box sx={{ py: 8, textAlign: "center" }}>
        <BiotechIcon sx={{ fontSize: 48, color: "#d0d7e3", mb: 1.5 }} />
        <Typography color="text.secondary" fontWeight={500}>
          Henüz MR görüntüsü yüklenmedi.
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Yeni MR Yükle butonunu kullanarak analiz başlatabilirsiniz.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Filtre */}
      <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2, p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            size="small" fullWidth placeholder="Dosya adıyla ara..."
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
            select size="small" value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 180 }}
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
            <MenuItem value="all">Tüm Durumlar</MenuItem>
            <MenuItem value="done">Tamamlandı</MenuItem>
            <MenuItem value="pending">İşleniyor</MenuItem>
            <MenuItem value="error">Hata</MenuItem>
          </TextField>
        </Stack>
      </Card>

      {/* Tarama kartları */}
      <Stack spacing={2}>
        {filtered.map((scan) => {
          const statusCfg     = getStatusCfg(scan.status);
          const confidencePct = scan.dice_confidence != null
            ? Math.round(scan.dice_confidence * 100)
            : null;
          const isOpen = openId === scan.id;

          return (
            <Box key={scan.id} sx={{
              border: "1px solid #e8edf5", borderRadius: 2, overflow: "hidden",
              borderLeft: `4px solid ${getBorderColor(scan)}`,
            }}>
              {/* Başlık satırı */}
              <Box
                onClick={() => setOpenId(isOpen ? null : scan.id)}
                sx={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  px: 2, py: 1.5, bgcolor: "#f8faff", cursor: "pointer",
                  "&:hover": { bgcolor: "#f0f6ff" },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <BiotechIcon sx={{ color: "#6a1b9a", fontSize: 20 }} />
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700} color="#0a2d57" sx={{ lineHeight: 1.2 }}>
                      {scan.file_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(scan.upload_date).toLocaleString("tr-TR")}
                      {scan.status === "pending" && (
                        <Box component="span" sx={{ ml: 1, display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                          <CircularProgress size={10} /> Analiz devam ediyor...
                        </Box>
                      )}
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Chip
                    label={statusCfg.label} size="small"
                    sx={{ bgcolor: statusCfg.bgcolor, color: statusCfg.color, fontWeight: 600, fontSize: 11 }}
                  />
                  {scan.status === "done" && (
                    <Chip
                      label={scan.lesion_detected ? "⚠ Lezyon Var" : "✓ Normal"} size="small"
                      sx={{
                        bgcolor: scan.lesion_detected ? "#fff3e0" : "#e8f5e9",
                        color:   scan.lesion_detected ? "#e65100"  : "#2e7d32",
                        fontWeight: 600, fontSize: 11,
                      }}
                    />
                  )}
                  {isOpen
                    ? <ExpandLessIcon sx={{ color: "#9aa5b4" }} />
                    : <ExpandMoreIcon sx={{ color: "#9aa5b4" }} />}
                </Stack>
              </Box>

              {/* Genişleme alanı */}
              <Collapse in={isOpen}>
                <Box sx={{ p: 2 }}>
                  {scan.status === "pending" && (
                    <Box sx={{ py: 4, textAlign: "center" }}>
                      <CircularProgress size={32} sx={{ color: "#e65100", mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Yapay zeka modeliniz görüntüyü analiz ediyor, lütfen bekleyin...
                      </Typography>
                    </Box>
                  )}

                  {scan.status === "error" && (
                    <Box sx={{ p: 2, bgcolor: "#ffebee", borderRadius: 2, borderLeft: "3px solid #c62828" }}>
                      <Typography variant="body2" color="#c62828">
                        {scan.ai_comment || "Analiz sırasında bir hata oluştu."}
                      </Typography>
                    </Box>
                  )}

                  {scan.status === "done" && (
                    <>
                      {/* Metrikler */}
                      <Stack direction="row" spacing={1.5} flexWrap="wrap" mb={2}>
                        <Box sx={{ p: 1.5, bgcolor: "#f8faff", border: "1px solid #e8edf5", borderRadius: 2, minWidth: 110 }}>
                          <Typography variant="caption" color="text.secondary">Lezyon</Typography>
                          <Typography variant="body2" fontWeight={700}
                            color={scan.lesion_detected ? "#e65100" : "#2e7d32"}>
                            {scan.lesion_detected ? "Tespit Edildi" : "Yok"}
                          </Typography>
                        </Box>
                        {scan.lesion_volume != null && (
                          <Box sx={{ p: 1.5, bgcolor: "#f8faff", border: "1px solid #e8edf5", borderRadius: 2, minWidth: 110 }}>
                            <Typography variant="caption" color="text.secondary">Hacim</Typography>
                            <Typography variant="body2" fontWeight={700}>
                              {scan.lesion_volume.toLocaleString()} voksel
                            </Typography>
                          </Box>
                        )}
                        {confidencePct != null && (
                          <Box sx={{ p: 1.5, bgcolor: "#f8faff", border: "1px solid #e8edf5", borderRadius: 2, minWidth: 110 }}>
                            <Typography variant="caption" color="text.secondary">Model Güveni</Typography>
                            <Typography variant="body2" fontWeight={700}>%{confidencePct}</Typography>
                          </Box>
                        )}
                      </Stack>

                      {/* AI yorumu */}
                      {scan.ai_comment && (
                        <Box sx={{ mb: 2, p: 2, bgcolor: "#e3f2fd", borderRadius: 2, borderLeft: "3px solid #1565c0" }}>
                          <Stack direction="row" alignItems="center" spacing={0.75} mb={0.5}>
                            <SmartToyIcon sx={{ fontSize: 15, color: "#1565c0" }} />
                            <Typography variant="caption" fontWeight={700} color="#1565c0">AI Değerlendirmesi</Typography>
                          </Stack>
                          <Typography variant="body2">{scan.ai_comment}</Typography>
                        </Box>
                      )}

                      {/* Doktor yorumu */}
                      {scan.doctor_comment && (
                        <Box sx={{ mb: 2, p: 2, bgcolor: "#f3e5f5", borderRadius: 2, borderLeft: "3px solid #6a1b9a" }}>
                          <Stack direction="row" alignItems="center" spacing={0.75} mb={0.5}>
                            <MedicalServicesIcon sx={{ fontSize: 15, color: "#6a1b9a" }} />
                            <Typography variant="caption" fontWeight={700} color="#6a1b9a">Doktor Yorumu</Typography>
                          </Stack>
                          <Typography variant="body2">{scan.doctor_comment}</Typography>
                        </Box>
                      )}

                      {/* GradCAM */}
                      <GradCamViewer scanId={scan.id} hasGradcam={!!scan.gradcam_path} />

                      {/* İndir */}
                      <Box sx={{ mt: 1.5, display: "flex", justifyContent: "flex-end" }}>
                        <Button
                          size="small" variant="outlined" startIcon={<DownloadIcon />}
                          onClick={() => handleDownload(scan)}
                          sx={{ borderColor: "#0a2d57", color: "#0a2d57", fontSize: 12,
                            "&:hover": { bgcolor: "#e3f0ff" } }}
                        >
                          Dosyayı İndir
                        </Button>
                      </Box>
                    </>
                  )}
                </Box>
              </Collapse>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
};

export default MrScanList;
