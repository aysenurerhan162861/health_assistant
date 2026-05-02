"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, Tabs, Tab, Box, Button,
  TextField, IconButton, Typography, Chip, CircularProgress,
  Stack, Avatar, Collapse,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import BiotechIcon from "@mui/icons-material/Biotech";
import PersonIcon from "@mui/icons-material/Person";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import PatientCardContent from "../patients/PatientCardContent";
import { MrScan } from "@/types/MrScan";
import axios from "axios";
import GradCamViewer from "./GradCamViewer";

interface Props {
  open:        boolean;
  onClose:     () => void;
  patientId:   number | null;
  patientName: string;
  onRefresh:   () => void;
  userRole?:   "doctor" | "assistant";
  allScans?:   MrScan[];
}

type StatusCfg = { label: string; bgcolor: string; color: string };

const STATUS_MAP: Record<string, StatusCfg> = {
  done:    { label: "Tamamlandı", bgcolor: "#e8f5e9", color: "#2e7d32" },
  pending: { label: "İşleniyor",  bgcolor: "#fff3e0", color: "#e65100" },
  error:   { label: "Hata",       bgcolor: "#ffebee", color: "#c62828" },
};
const STATUS_FALLBACK: StatusCfg = { label: "Bilinmiyor", bgcolor: "#f3f4f6", color: "#555" };
const getStatusCfg = (s: string): StatusCfg => STATUS_MAP[s] ?? STATUS_FALLBACK;

const isSuspicious = (scan: MrScan): boolean => {
  if (scan.lesion_detected) return false;
  const volume = scan.lesion_volume ?? 0;
  return volume > 0 && volume < 200;
};

const getBorderColor = (scan: MrScan): string => {
  if (scan.status === "pending") return "#e65100";
  if (scan.status === "error")   return "#c62828";
  if (scan.lesion_detected)      return "#c62828";  // kırmızı
  if (isSuspicious(scan))        return "#f57c00";  // turuncu
  return "#2e7d32";                                  // yeşil
};

/* ─── Tek tarama kartı ─── */
const MrScanDetailCard: React.FC<{
  scan:           MrScan;
  onCommentSaved: () => void;
  userRole?:      "doctor" | "assistant";
}> = ({ scan, onCommentSaved, userRole = "doctor" }) => {
  const [expanded, setExpanded] = useState(false);
  const [editing,  setEditing]  = useState(false);
  const [comment,  setComment]  = useState(scan.doctor_comment || "");
  const [saving,   setSaving]   = useState(false);

  const statusCfg     = getStatusCfg(scan.status);
  const confidencePct = scan.dice_confidence != null ? Math.round(scan.dice_confidence * 100) : null;

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token") || "";
      await axios.patch(
        `http://localhost:8000/api/mr_scans/${scan.id}/doctor-comment`,
        { doctor_comment: comment },
        { headers: { "token-header": `Bearer ${token}` } }
      );
      onCommentSaved();
      setEditing(false);
    } catch {
      alert("Yorum kaydedilemedi!");
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    window.open(`http://localhost:8000/api/mr_scans/${scan.id}/file`, "_blank");
  };

  return (
    <Box sx={{
      border: "1px solid #e8edf5", borderRadius: 2, overflow: "hidden",
      borderLeft: `4px solid ${getBorderColor(scan)}`,
    }}>
      {/* Başlık */}
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          px: 2, py: 1.5, bgcolor: "#f8faff", cursor: "pointer",
          "&:hover": { bgcolor: "#f0f6ff" },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <BiotechIcon sx={{ color: "#6a1b9a", fontSize: 18 }} />
          <Box>
            <Typography variant="subtitle2" fontWeight={700} color="#0a2d57" sx={{ lineHeight: 1.2 }}>
              {scan.file_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(scan.upload_date).toLocaleString("tr-TR")}
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
    label={scan.lesion_detected ? "⚠ Lezyon Var" : isSuspicious(scan) ? "⚡ Şüpheli" : "✓ Normal"}
    size="small"
    sx={{
      bgcolor: scan.lesion_detected ? "#ffebee" : isSuspicious(scan) ? "#fff3e0" : "#e8f5e9",
      color:   scan.lesion_detected ? "#c62828" : isSuspicious(scan) ? "#e65100" : "#2e7d32",
      fontWeight: 600, fontSize: 11,
    }}
  />
)}
          {userRole !== "assistant" && (
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setExpanded(true); setEditing(true); }}
              sx={{ color: "#9aa5b4" }}>
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          {expanded
            ? <ExpandLessIcon sx={{ color: "#9aa5b4" }} />
            : <ExpandMoreIcon sx={{ color: "#9aa5b4" }} />}
        </Stack>
      </Box>

      {/* Genişleme */}
      <Collapse in={expanded}>
        <Box sx={{ p: 2 }}>
          {scan.status === "pending" && (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <CircularProgress size={28} sx={{ color: "#e65100", mb: 1 }} />
              <Typography variant="body2" color="text.secondary">Analiz devam ediyor...</Typography>
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
  color={scan.lesion_detected ? "#c62828" : isSuspicious(scan) ? "#e65100" : "#2e7d32"}>
  {scan.lesion_detected ? "Tespit Edildi" : isSuspicious(scan) ? "Şüpheli" : "Yok"}
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
                <Box sx={{
  mb: 2, p: 2, borderRadius: 2,
  bgcolor: scan.lesion_detected ? "#ffebee" : isSuspicious(scan) ? "#fff3e0" : "#e3f2fd",
  borderLeft: `3px solid ${scan.lesion_detected ? "#c62828" : isSuspicious(scan) ? "#e65100" : "#1565c0"}`,
}}>
  <Stack direction="row" alignItems="center" spacing={0.75} mb={0.5}>
    <SmartToyIcon sx={{ fontSize: 15, color: scan.lesion_detected ? "#c62828" : isSuspicious(scan) ? "#e65100" : "#1565c0" }} />
    <Typography variant="caption" fontWeight={700}
      color={scan.lesion_detected ? "#c62828" : isSuspicious(scan) ? "#e65100" : "#1565c0"}>
      AI Değerlendirmesi
    </Typography>
  </Stack>
                  <Typography variant="body2">{scan.ai_comment}</Typography>
                </Box>
              )}

              {/* GradCAM */}
              <GradCamViewer scanId={scan.id} hasGradcam={!!scan.gradcam_path} />

              {/* Doktor yorumu */}
              {userRole === "assistant" ? (
                <Box sx={{ mt: 1.5 }}>
                  {scan.doctor_comment ? (
                    <Box sx={{ p: 2, bgcolor: "#f3e5f5", borderRadius: 2, borderLeft: "3px solid #6a1b9a" }}>
                      <Stack direction="row" alignItems="center" spacing={0.75} mb={0.5}>
                        <MedicalServicesIcon sx={{ fontSize: 15, color: "#6a1b9a" }} />
                        <Typography variant="caption" fontWeight={700} color="#6a1b9a">Doktor Yorumu</Typography>
                      </Stack>
                      <Typography variant="body2">{scan.doctor_comment}</Typography>
                    </Box>
                  ) : (
                    <Typography variant="caption" color="text.secondary">Henüz doktor yorumu eklenmemiş.</Typography>
                  )}
                </Box>
              ) : editing ? (
                <Box sx={{ mt: 1.5, p: 2, bgcolor: "#f8faff", borderRadius: 2, border: "1px solid #e0e7ef" }}>
                  <Typography variant="subtitle2" fontWeight={700} color="#0a2d57" mb={1}>
                    Doktor Açıklaması
                  </Typography>
                  <TextField
                    multiline minRows={3} fullWidth size="small"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Hasta için açıklama yazın..."
                  />
                  <Stack direction="row" justifyContent="flex-end" spacing={1} mt={1.5}>
                    <Button size="small" onClick={() => setEditing(false)}
                      disabled={saving} sx={{ color: "#6b7a90" }}>
                      Kapat
                    </Button>
                    <Button variant="contained" size="small"
                      startIcon={<SaveIcon fontSize="small" />}
                      onClick={handleSave} disabled={saving}
                      sx={{ bgcolor: "#0a2d57", "&:hover": { bgcolor: "#071d3c" } }}>
                      {saving ? "Kaydediliyor..." : "Kaydet"}
                    </Button>
                  </Stack>
                </Box>
              ) : (
                <Box sx={{ mt: 1.5 }}>
                  {scan.doctor_comment ? (
                    <Box sx={{ p: 2, bgcolor: "#f3e5f5", borderRadius: 2, borderLeft: "3px solid #6a1b9a" }}>
                      <Stack direction="row" alignItems="center" spacing={0.75} mb={0.5}>
                        <MedicalServicesIcon sx={{ fontSize: 15, color: "#6a1b9a" }} />
                        <Typography variant="caption" fontWeight={700} color="#6a1b9a">Doktor Yorumu</Typography>
                      </Stack>
                      <Typography variant="body2">{scan.doctor_comment}</Typography>
                    </Box>
                  ) : (
                    <Typography variant="caption" color="text.secondary">Henüz doktor yorumu eklenmemiş.</Typography>
                  )}
                </Box>
              )}

              {/* İndir */}
              <Box sx={{ mt: 1.5, display: "flex", justifyContent: "flex-end" }}>
                <Button
                  size="small" variant="outlined" startIcon={<DownloadIcon />}
                  onClick={handleDownload}
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
};

/* ─── Ana modal ─── */
const DoctorMrModal: React.FC<Props> = ({
  open, onClose, patientId, patientName, onRefresh,
  userRole = "doctor", allScans = [],
}) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [scans, setScans]       = useState<MrScan[]>([]);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (!open || !patientId) return;
    if (userRole === "assistant") {
      const filtered = allScans.filter((s: any) =>
        s.patient_id === patientId || s.patient?.id === patientId
      );
      setScans(filtered);
    } else {
      fetchScans();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, patientId, userRole]);

  const fetchScans = async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res   = await axios.get(`http://localhost:8000/api/mr_scans/patient/${patientId}`, {
        headers: { "token-header": `Bearer ${token}` },
      });
      setScans(res.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleCommentSaved = () => { fetchScans(); onRefresh(); };

  if (!patientId) return null;

  const initials = patientName.charAt(0).toUpperCase();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3, maxHeight: "88vh" } } }}>

      {/* Başlık */}
      <DialogTitle sx={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: "1px solid #e8edf5", pb: 1.5,
      }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ width: 36, height: 36, bgcolor: "#ede7f6", color: "#6a1b9a", fontWeight: 700 }}>
            {initials}
          </Avatar>
          <Box>
            <Typography fontWeight={700} color="#0a2d57" lineHeight={1.2}>{patientName}</Typography>
            <Typography variant="caption" color="text.secondary">MR Analiz Detayı</Typography>
          </Box>
        </Stack>
        <IconButton size="small" onClick={onClose} sx={{ color: "#9aa5b4" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Sekmeler */}
      <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)}
        sx={{ px: 3, borderBottom: "1px solid #e8edf5", bgcolor: "#fafbff" }}>
        <Tab icon={<PersonIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Kişisel Bilgiler" />
        <Tab icon={<BiotechIcon sx={{ fontSize: 16 }} />} iconPosition="start"
          label={`MR Görüntüleri (${scans.length})`} />
      </Tabs>

      <DialogContent sx={{ p: 3, overflowY: "auto" }}>
        {tabIndex === 0 && (
          <PatientCardContent patient={{ id: patientId, name: patientName } as any} />
        )}

        {tabIndex === 1 && (
          loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
              <CircularProgress sx={{ color: "#6a1b9a" }} />
            </Box>
          ) : scans.length === 0 ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <BiotechIcon sx={{ fontSize: 36, color: "#d0d7e3", mb: 1 }} />
              <Typography color="text.secondary">Bu hastaya ait MR görüntüsü bulunamadı.</Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {scans.map((scan) => (
                <MrScanDetailCard
                  key={scan.id}
                  scan={scan}
                  onCommentSaved={handleCommentSaved}
                  userRole={userRole}
                />
              ))}
            </Stack>
          )
        )}
      </DialogContent>

      <Box sx={{ display: "flex", justifyContent: "flex-end", px: 3, pb: 2, borderTop: "1px solid #e8edf5" }}>
        <Button variant="outlined" onClick={onClose} sx={{ color: "#6b7a90", borderColor: "#d0d7e3" }}>
          Kapat
        </Button>
      </Box>
    </Dialog>
  );
};

export default DoctorMrModal;
