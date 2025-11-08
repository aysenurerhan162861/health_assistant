import React from "react";
import { Box, Typography, Avatar, Button } from "@mui/material";
import { Doctor } from "../../types/Doctor";

interface Props {
  doctor: Doctor;
  onClose: () => void;
}

const DoctorCard: React.FC<Props> = ({ doctor, onClose }) => {
  return (
    <Box sx={{ p: 3, minWidth: 300 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Avatar sx={{ width: 56, height: 56, mr: 2 }}>
          {doctor.name.charAt(0)}
        </Avatar>
        <Typography variant="h6">{doctor.name}</Typography>
      </Box>
      <Typography>E-posta: {doctor.email}</Typography>
      <Typography>Uzmanlık: {doctor.specialty}</Typography>
      {doctor.phone && <Typography>Telefon: {doctor.phone}</Typography>}

      <Button onClick={onClose} sx={{ mt: 2 }}>
        Kapat
      </Button>
    </Box>
  );
};

export default DoctorCard;
