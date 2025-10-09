import React, { useState } from "react";
import { Box, TextField, Button } from "@mui/material";
import { User, updateUser } from "../../services/api";

interface Props {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const CitizenForm: React.FC<Props> = ({ user }) => {
  const [formData, setFormData] = useState({ name: user.name || "", email: user.email || "" });
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUser(formData);
      setMessage("Bilgiler güncellendi!");
    } catch {
      setMessage("Güncelleme başarısız!");
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <TextField
        fullWidth
        margin="normal"
        name="name"
        label="Ad Soyad"
        value={formData.name}
        onChange={handleChange}
      />
      <TextField
        fullWidth
        margin="normal"
        name="email"
        label="Email"
        value={formData.email}
        onChange={handleChange}
      />
      <Button type="submit" variant="contained" sx={{ mt: 2 }}>
        Güncelle
      </Button>
      {message && <p>{message}</p>}
    </Box>
  );
};

export default CitizenForm;
