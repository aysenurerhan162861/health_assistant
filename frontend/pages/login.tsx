// pages/login.tsx
import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import LoginForm from "../components/forms/LoginForm";

export default function LoginPage() {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#0a2d57" }}>
      {/* Sol panel */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
        }}
      >
        <Typography variant="h1" fontWeight="bold">
          HEALTH
        </Typography>
        <Typography variant="h1" fontWeight="bold">
          ASSISTANT
        </Typography>
      </Box>

      {/* Sağ panel */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: 350,
          }}
        >
          <LoginForm />
        </Paper>
      </Box>
    </Box>
  );
}
