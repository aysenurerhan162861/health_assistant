import React from "react";
import { Box, Paper, Typography, Avatar, Divider, Stack } from "@mui/material";
import CitizenForm from "../forms/CitizenForm";
import { User } from "../../services/api";

interface Props {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const PatientProfile: React.FC<Props> = ({ user, setUser }) => {
  const primaryColor = "#0a2d57";
  const backgroundBlue = "#e6f0ff";

  return (
    <Box
      sx={{
        display: "flex",
        gap: 4,
        p: 4,
        bgcolor: backgroundBlue,
        minHeight: "90vh",
      }}
    >
      {/* Sol taraf: Kişi kartı */}
      <Paper
        sx={{
          flex: "0 0 300px",
          p: 3,
          borderRadius: 3,
          boxShadow: 3,
          textAlign: "center",
          bgcolor: "#fff",
          height: "fit-content",
        }}
      >
        <Avatar
          src={user?.photoUrl || ""}
          sx={{
            width: 120,
            height: 120,
            mx: "auto",
            border: `3px solid ${primaryColor}`,
          }}
        />
        <Typography variant="h6" sx={{ mt: 2, color: primaryColor }}>
          {user?.name || "Bilinmeyen Kullanıcı"}
        </Typography>
        <Typography sx={{ color: "gray" }}>{user?.email}</Typography>
        <Divider sx={{ my: 2 }} />
        <Stack spacing={1} sx={{ textAlign: "left" }}>
          <Typography>📞 {user?.phone || "-"}</Typography>
          <Typography>🏙️ {user?.city || "-"} / {user?.district || "-"}</Typography>
          <Typography>💉 Kan Grubu: {user?.blood_type || "-"}</Typography>
          <Typography>🩺 {user?.chronic_diseases || "Kronik hastalık bilgisi yok"}</Typography>
        </Stack>
      </Paper>

      {/* Sağ taraf: Güncelleme formu */}
      <Box sx={{ flex: 1 }}>
        <CitizenForm user={user} setUser={setUser} />
      </Box>
    </Box>
  );
};

export default PatientProfile;
