import React, { useState } from "react";
import { Box, Paper, Typography, Checkbox, Button, FormControlLabel } from "@mui/material";

interface KVKKCardProps {
  onConsentGiven?: () => void;
}

const KVKKCard: React.FC<KVKKCardProps> = ({ onConsentGiven }) => {
  const [consent, setConsent] = useState(false);

  const handleConsent = () => {
    localStorage.setItem("consent", "true");
    if (onConsentGiven) onConsentGiven();
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
      <Paper elevation={3} sx={{ padding: 4, maxWidth: 500, textAlign: "center" }}>
        <Typography variant="h5" gutterBottom>
          Hoş Geldiniz
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          Devam etmeden önce KVKK Aydınlatma ve Açık Rıza’yı onaylayın.
        </Typography>

        <Paper variant="outlined" sx={{ padding: 2, textAlign: "left", marginBottom: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Aydınlatma Metni (özet)
          </Typography>
          <ul>
            <li>Verileriniz yalnızca sağlık asistan hizmeti için işlenecektir.</li>
            <li>Dilediğiniz an verilerinize erişebilir, indirebilir, silebilirsiniz.</li>
            <li>Görüntü verileri anonimleştirilerek işlenir.</li>
          </ul>
        </Paper>

        <FormControlLabel
          control={<Checkbox checked={consent} onChange={(e) => setConsent(e.target.checked)} />}
          label="Açık Rıza metnini okudum, onaylıyorum"
        />

        <Box mt={2}>
          <Button variant="contained" color="primary" disabled={!consent} onClick={handleConsent}>
            Devam Et
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default KVKKCard;
