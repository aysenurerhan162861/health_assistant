"use client";
import React, { useState } from "react";
import {
  Box, Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton,
  Collapse, TextField, Button, CircularProgress,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import EditIcon from "@mui/icons-material/Edit";
import axios from "axios";
import { MrScan } from "../../types/MrScan";

const primaryColor = "#0a2d57";

interface Props {
  scans: MrScan[];
  onRefresh: () => void;
}

const DoctorMrList: React.FC<Props> = ({ scans, onRefresh }) => {
  const [openRowId, setOpenRowId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [saving, setSaving] = useState(false);

  const handleToggle = (scan: MrScan) => {
    if (openRowId === scan.id) {
      setOpenRowId(null);
      setCommentText("");
    } else {
      setOpenRowId(scan.id);
      setCommentText(scan.doctor_comment || "");
    }
  };

  const handleSave = async (scanId: number) => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token") || "";
      await axios.patch(
        `http://localhost:8000/api/mr_scans/${scanId}/doctor-comment`,
        { doctor_comment: commentText },
        { headers: { "token-header": `Bearer ${token}` } }
      );
      onRefresh();
      setOpenRowId(null);
      setCommentText("");
    } catch (err) {
      console.error("Doktor yorumu kaydedilemedi:", err);
      alert("Yorum kaydedilemedi!");
    } finally {
      setSaving(false);
    }
  };

  if (scans.length === 0) {
    return (
      <Box sx={{ textAlign: "center", mt: 6, color: "text.secondary" }}>
        <Typography>Henüz MR görüntüsü bulunmuyor.</Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 3 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: "#f0f0f0" }}>
            <TableCell></TableCell>
            <TableCell><strong>Tarih</strong></TableCell>
            <TableCell><strong>Dosya</strong></TableCell>
            <TableCell><strong>Durum</strong></TableCell>
            <TableCell><strong>Lezyon</strong></TableCell>
            <TableCell><strong>Hacim</strong></TableCell>
            <TableCell><strong>Güven</strong></TableCell>
            <TableCell><strong>AI Yorumu</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {scans.map((scan) => (
            <React.Fragment key={scan.id}>
              <TableRow sx={{
                backgroundColor: !scan.viewed_by_doctor && scan.status === "done" ? "#fff8e1" : "white",
                "&:hover": { backgroundColor: "#f9f9f9" },
              }}>
                <TableCell>
                  <IconButton size="small" onClick={() => handleToggle(scan)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </TableCell>
                <TableCell>
                  {new Date(scan.upload_date).toLocaleDateString("tr-TR")}
                </TableCell>
                <TableCell>{scan.file_name}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={scan.status === "done" ? "Tamamlandı" : scan.status === "pending" ? "İşleniyor" : "Hata"}
                    color={scan.status === "done" ? "success" : scan.status === "pending" ? "warning" : "error"}
                  />
                </TableCell>
                <TableCell>
                  {scan.status === "done" ? (
                    scan.lesion_detected
                      ? <WarningAmberIcon sx={{ color: "#ff9800" }} />
                      : <CheckCircleIcon sx={{ color: "#4caf50" }} />
                  ) : (
                    scan.status === "pending" ? <CircularProgress size={16} /> : "—"
                  )}
                </TableCell>
                <TableCell>
                  {scan.lesion_volume != null ? `${scan.lesion_volume.toLocaleString()} voksel` : "—"}
                </TableCell>
                <TableCell>
                  {scan.dice_confidence != null ? `%${Math.round(scan.dice_confidence * 100)}` : "—"}
                </TableCell>
                <TableCell sx={{ maxWidth: 300 }}>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {scan.ai_comment
                      ? scan.ai_comment.length > 80
                        ? scan.ai_comment.slice(0, 80) + "..."
                        : scan.ai_comment
                      : "—"}
                  </Typography>
                </TableCell>
              </TableRow>

              {/* Doktor yorum accordion */}
              {openRowId === scan.id && (
                <TableRow>
                  <TableCell colSpan={8} sx={{ p: 0 }}>
                    <Collapse in={true}>
                      <Box sx={{
                        m: 2, p: 2, borderRadius: 2, backgroundColor: "#f7f9fc",
                        border: "1px solid #e0e7ef",
                      }}>
                        {/* AI yorumun tamamı */}
                        {scan.ai_comment && (
                          <Box sx={{ mb: 2, p: 2, bgcolor: "#e3f2fd", borderRadius: 1, borderLeft: `4px solid ${primaryColor}` }}>
                            <Typography variant="caption" fontWeight={600} color="text.secondary">
                              🤖 AI Değerlendirmesi
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>{scan.ai_comment}</Typography>
                          </Box>
                        )}

                        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                          Doktor Yorumu Ekle / Düzenle
                        </Typography>
                        <TextField
                          label="Doktor Yorumu"
                          multiline
                          minRows={3}
                          fullWidth
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          variant="outlined"
                        />
                        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2, gap: 1 }}>
                          <Button onClick={() => { setOpenRowId(null); setCommentText(""); }}>
                            İptal
                          </Button>
                          <Button
                            variant="contained"
                            onClick={() => handleSave(scan.id)}
                            disabled={saving}
                            sx={{ bgcolor: primaryColor, "&:hover": { bgcolor: "#082147" } }}
                          >
                            {saving ? "Kaydediliyor..." : "Kaydet"}
                          </Button>
                        </Box>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DoctorMrList;