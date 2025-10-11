import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  MenuItem,
} from "@mui/material";
import { User, updateUser } from "../../services/api";

interface Props {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const CitizenForm: React.FC<Props> = ({ user, setUser }) => {
  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: "",
    birthDate: "",
    gender: "female",
    city: "",
    district: "",
    neighborhood: "",
    bloodType: "",
    chronicDiseases: "",
    allergies: "",
  });
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await updateUser(formData);
      setMessage("Bilgiler güncellendi!");
      if (res.user) setUser(res.user);
    } catch {
      setMessage("Güncelleme başarısız!");
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const primaryColor = "#0a2d57";
  const backgroundBlue = "#e6f0ff"; // arka plan
  const inputWhite = "#ffffff"; // form kutuları

  return (
    <Box sx={{ p: 4, bgcolor: backgroundBlue, minHeight: "80vh" }}>
      <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 3 }}>
        <Typography variant="h6" sx={{ color: primaryColor, fontWeight: "bold", mb: 3 }}>
          Kişisel Bilgileriniz
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          {[
            { name: "name", label: "Ad Soyad" },
            { name: "email", label: "Email" },
            { name: "phone", label: "Telefon" },
            { name: "birthDate", label: "Doğum Tarihi", type: "date" },
            { name: "city", label: "İl" },
            { name: "district", label: "İlçe" },
            { name: "neighborhood", label: "Mahalle / Semt" },
            { name: "bloodType", label: "Kan Grubu" },
            { name: "chronicDiseases", label: "Kronik Hastalıklar" },
            { name: "allergies", label: "Alerjiler" },
          ].map((field) => (
            <TextField
              key={field.name}
              fullWidth
              margin="normal"
              name={field.name}
              label={field.label}
              type={field.type || "text"}
              value={(formData as any)[field.name]}
              onChange={handleChange}
              sx={{ mb: 2, bgcolor: inputWhite }}
              InputLabelProps={field.type === "date" ? { shrink: true } : {}}
            />
          ))}

          <TextField
            select
            fullWidth
            margin="normal"
            name="gender"
            label="Cinsiyet"
            value={formData.gender}
            onChange={handleChange}
            sx={{ mb: 2, bgcolor: inputWhite }}
          >
            <MenuItem value="female">Kadın</MenuItem>
            <MenuItem value="male">Erkek</MenuItem>
            <MenuItem value="other">Diğer</MenuItem>
          </TextField>

          <Button
            type="submit"
            variant="contained"
            sx={{ mt: 2, bgcolor: primaryColor, "&:hover": { bgcolor: "#082147" } }}
          >
            Güncelle
          </Button>

          {message && (
            <Typography sx={{ mt: 2, color: primaryColor, fontWeight: "bold" }}>
              {message}
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default CitizenForm;
