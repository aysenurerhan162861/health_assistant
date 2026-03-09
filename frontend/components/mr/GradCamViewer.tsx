"use client";
import React, { useState } from "react";
import { Box, Typography, Button, Collapse, CircularProgress } from "@mui/material";
import PsychologyIcon from "@mui/icons-material/Psychology";

interface Props {
  scanId: number;
  hasGradcam: boolean;
}

const GradCamViewer: React.FC<Props> = ({ scanId, hasGradcam }) => {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (!hasGradcam) return null;

  return (
    <Box sx={{ mt: 1.5 }}>
      <Button
        size="small"
        variant="outlined"
        startIcon={<PsychologyIcon />}
        onClick={() => setOpen(!open)}
        sx={{ borderColor: "#7c4dff", color: "#7c4dff", "&:hover": { borderColor: "#651fff", bgcolor: "#f3e5f5" } }}
      >
        {open ? "XAI Haritasını Gizle" : "XAI Attention Haritasını Göster"}
      </Button>

      <Collapse in={open}>
        <Box sx={{ mt: 1.5, p: 1.5, bgcolor: "#1a1a2e", borderRadius: 2, position: "relative" }}>
          <Typography variant="caption" sx={{ color: "#b39ddb", display: "block", mb: 1 }}>
            🧠 Modelin odaklandığı bölgeler — kırmızı/sarı alanlar yüksek attention ağırlığını gösterir
          </Typography>
          {!loaded && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={24} sx={{ color: "#7c4dff" }} />
            </Box>
          )}
          <img
            src={`http://localhost:8000/api/mr_scans/${scanId}/gradcam`}
            alt="Attention Haritası"
            onLoad={() => setLoaded(true)}
            style={{
              width: "100%",
              borderRadius: 8,
              display: loaded ? "block" : "none",
            }}
          />
        </Box>
      </Collapse>
    </Box>
  );
};

export default GradCamViewer;