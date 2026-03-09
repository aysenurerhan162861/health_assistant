"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, Tabs, Tab, Box, Button,
  TextField, IconButton, Typography, Chip, CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BiotechIcon from "@mui/icons-material/Biotech";
import DownloadIcon from "@mui/icons-material/Download";
import PatientCardContent from "../patients/PatientCardContent";
import { MrScan } from "@/types/MrScan";
import axios from "axios";
import GradCamViewer from "./GradCamViewer";

interface Props {
  open: boolean;
  onClose: () => void;
  patientId: number | null;
  patientName: string;
  onRefresh: () => void;
  userRole?: "doctor" | "assistant";
  allScans?: any[];
}

const primaryColor = "#0a2d57";

const MrScanDetailCard: React.FC<{
  scan: MrScan;
  onCommentSaved: () => void;
  userRole?: "doctor" | "assistant";
}> = ({ scan, onCommentSaved, userRole = "doctor" }) => {
  const [editing, setEditing] = useState(false);
  const [comment, setComment] = useState(scan.doctor_comment || "");
  const [saving, setSaving] = useState(false);

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
    } catch (err) {
      console.error(err);
      alert("Yorum kaydedilemedi!");
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    window.open(`http://localhost:8000/api/mr_scans/${scan.id}/file`, "_blank");
  };

  const confidencePct = scan.dice_confidence != null ? Math.round(scan.dice_confidence * 100) : null;

  return (
    <Box sx={{
      mb: 2, p: 2, border: "1px solid #e0e0e0", borderRadius: 2,
      borderLeft: scan.lesion_detected ? "4px solid #ff9800" : scan.status === "done" ? "4px solid #4caf50" : "4px solid #e0e0e0",
    }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <BiotechIcon sx={{ color: primaryColor, fontSize: 18 }} />
          <Typography fontWeight={600} variant="body2">{scan.file_name}</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip size="small"
            label={scan.status === "done" ? "Tamamlandı" : scan.status === "pending" ? "İşleniyor" : "Hata"}
            color={scan.status === "done" ? "success" : scan.status === "pending" ? "warning" : "error"}
          />
          {scan.status === "done" && (
            scan.lesion_detected
              ? <WarningAmberIcon sx={{ color: "#ff9800", fontSize: 18 }} />
              : <CheckCircleIcon sx={{ color: "#4caf50", fontSize: 18 }} />
          )}
          <Button size="small" variant="outlined" startIcon={<DownloadIcon />}
            onClick={handleDownload} sx={{ fontSize: 11 }}>
            İndir
          </Button>
        </Box>
      </Box>

      <Typography variant="caption" color="text.secondary">
        {new Date(scan.upload_date).toLocaleString("tr-TR")}
      </Typography>

      {scan.status === "done" && (
        <Box sx={{ mt: 1.5, display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <Box sx={{ p: 1, bgcolor: "#f5f5f5", borderRadius: 1, minWidth: 100 }}>
            <Typography variant="caption" color="text.secondary">Lezyon</Typography>
            <Typography variant="body2" fontWeight={600} color={scan.lesion_detected ? "#f57c00" : "#388e3c"}>
              {scan.lesion_detected ? "⚠️ Var" : "✅ Yok"}
            </Typography>
          </Box>
          {scan.lesion_volume != null && (
            <Box sx={{ p: 1, bgcolor: "#f5f5f5", borderRadius: 1, minWidth: 100 }}>
              <Typography variant="caption" color="text.secondary">Hacim</Typography>
              <Typography variant="body2" fontWeight={600}>{scan.lesion_volume.toLocaleString()} voksel</Typography>
            </Box>
          )}
          {confidencePct != null && (
            <Box sx={{ p: 1, bgcolor: "#f5f5f5", borderRadius: 1, minWidth: 100 }}>
              <Typography variant="caption" color="text.secondary">Güven</Typography>
              <Typography variant="body2" fontWeight={600}>%{confidencePct}</Typography>
            </Box>
          )}
        </Box>
      )}

      {scan.ai_comment && (
        <Box sx={{ mt: 1.5, p: 1.5, bgcolor: "#e3f2fd", borderRadius: 1, borderLeft: `3px solid ${primaryColor}` }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>🤖 AI Değerlendirmesi</Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>{scan.ai_comment}</Typography>
        </Box>
      )}

      <GradCamViewer scanId={scan.id} hasGradcam={!!scan.gradcam_path} />

      {/* Doktor yorumu - asistan sadece okuyabilir */}
      {userRole === "assistant" ? (
        <Box sx={{ mt: 1.5 }}>
          {scan.doctor_comment ? (
            <Box sx={{ p: 1.5, bgcolor: "#f3e5f5", borderRadius: 1, borderLeft: "3px solid #9c27b0" }}>
              <Typography variant="caption" fontWeight={600} color="text.secondary">👨‍⚕️ Doktor Yorumu</Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>{scan.doctor_comment}</Typography>
            </Box>
          ) : (
            <Typography variant="caption" color="text.secondary">Henüz doktor yorumu eklenmemiş.</Typography>
          )}
        </Box>
      ) : !editing ? (
        <Box sx={{ mt: 1.5, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box sx={{ flex: 1 }}>
            {scan.doctor_comment ? (
              <Box sx={{ p: 1.5, bgcolor: "#f3e5f5", borderRadius: 1, borderLeft: "3px solid #9c27b0" }}>
                <Typography variant="caption" fontWeight={600} color="text.secondary">👨‍⚕️ Doktor Yorumu</Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>{scan.doctor_comment}</Typography>
              </Box>
            ) : (
              <Typography variant="caption" color="text.secondary">Henüz doktor yorumu eklenmemiş.</Typography>
            )}
          </Box>
          <Button size="small" onClick={() => setEditing(true)} sx={{ ml: 1, flexShrink: 0 }}>
            {scan.doctor_comment ? "Düzenle" : "Yorum Ekle"}
          </Button>
        </Box>
      ) : (
        <Box sx={{ mt: 1.5 }}>
          <TextField label="Doktor Yorumu" multiline minRows={3} fullWidth size="small"
            value={comment} onChange={(e) => setComment(e.target.value)} />
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 1 }}>
            <Button size="small" onClick={() => setEditing(false)}>İptal</Button>
            <Button size="small" variant="contained" onClick={handleSave} disabled={saving}
              sx={{ bgcolor: primaryColor, "&:hover": { bgcolor: "#082147" } }}>
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

const DoctorMrModal: React.FC<Props> = ({
  open, onClose, patientId, patientName, onRefresh,
  userRole = "doctor", allScans = [],
}) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [scans, setScans] = useState<MrScan[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !patientId) return;
    if (userRole === "assistant") {
      // allScans içinden bu hastanın taramalarını filtrele
      const filtered = allScans.filter((s: any) =>
        s.patient_id === patientId || s.patient?.id === patientId
      );
      setScans(filtered);
    } else {
      fetchScans();
    }
  }, [open, patientId, userRole]);

  const fetchScans = async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await axios.get(`http://localhost:8000/api/mr_scans/patient/${patientId}`, {
        headers: { "token-header": `Bearer ${token}` },
      });
      setScans(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSaved = () => {
    fetchScans();
    onRefresh();
  };

  if (!patientId) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {patientName} – MR Detayları
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ display: "flex", flexDirection: "column", height: "70vh", p: 0 }}>
        <Box sx={{ px: 3 }}>
          <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)}>
            <Tab label="Kişisel Bilgiler" />
            <Tab label={`MR Görüntüleri (${scans.length})`} />
          </Tabs>
        </Box>

        <Box sx={{ flex: 1, overflowY: "auto", p: 3 }}>
          {tabIndex === 0 && (
            <PatientCardContent patient={{ id: patientId, name: patientName } as any} />
          )}

          {tabIndex === 1 && (
            loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", pt: 4 }}>
                <CircularProgress />
              </Box>
            ) : scans.length === 0 ? (
              <Typography color="text.secondary" align="center" sx={{ pt: 4 }}>
                Bu hastaya ait MR görüntüsü bulunamadı.
              </Typography>
            ) : (
              scans.map((scan) => (
                <MrScanDetailCard
                  key={scan.id}
                  scan={scan}
                  onCommentSaved={handleCommentSaved}
                  userRole={userRole}
                />
              ))
            )
          )}
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end", p: 2, borderTop: "1px solid #eee" }}>
          <Button variant="outlined" onClick={onClose}>Kapat</Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default DoctorMrModal;