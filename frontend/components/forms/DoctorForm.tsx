import React, { useState, useEffect } from "react";
import { Box, TextField, Button, MenuItem, Typography } from "@mui/material";
import { User, addTeamMember, updateUser } from "../../services/api";

interface Props {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

interface TeamData {
  name: string;
  email: string;
  role: "assistant" | "sekreter";
}

const DoctorForm: React.FC<Props> = ({ user, setUser }) => {
  const [userData, setUserData] = useState({ name: user.name || "", email: user.email || "" });
  const [teamData, setTeamData] = useState<TeamData>({ name: "", email: "", role: "assistant" });
  const [message, setMessage] = useState("");

  // Kullanıcı bilgilerinin state’e gelmesini sağla
  useEffect(() => {
    setUserData({ name: user.name || "", email: user.email || "" });
  }, [user]);

  // Kendi bilgilerini güncelle
  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!user.id) return;
      const res = await updateUser({ id: user.id, ...userData });
      setMessage("Bilgiler güncellendi!");
      if (res.user) setUser(res.user);
    } catch {
      setMessage("Güncelleme başarısız!");
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  };

  // Alt kullanıcı ekleme
  const handleTeamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTeamData({ ...teamData, [name]: value });
  };

  const handleTeamSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    await addTeamMember({
      name: teamData.name,
      email: teamData.email,
      role: teamData.role
    });

    setMessage("Alt kullanıcı eklendi ve mail gönderildi! ✅");
    setTeamData({ name: "", email: "", role: "assistant" });
  } catch {
    setMessage("Alt kullanıcı ekleme başarısız! ❌");
  } finally {
    setTimeout(() => setMessage(""), 3000);
  }
};

  return (
    <Box sx={{ mt: 2 }}>
      {/* Kendi bilgileri */}
      <Typography variant="subtitle1">Kendi Bilgileriniz</Typography>
      <Box component="form" onSubmit={handleUserSubmit}>
        <TextField fullWidth margin="normal" name="name" label="Ad Soyad" value={userData.name} onChange={handleUserChange} />
        <TextField fullWidth margin="normal" name="email" label="Email" value={userData.email} onChange={handleUserChange} />
        <Button type="submit" variant="contained" sx={{ mt: 2 }}>
          Güncelle
        </Button>
      </Box>

      {/* Alt kullanıcı ekleme */}
      <Typography variant="subtitle1" sx={{ mt: 4 }}>Alt Kullanıcı Ekle</Typography>
      <Box component="form" onSubmit={handleTeamSubmit}>
        <TextField fullWidth margin="normal" name="name" label="Ad Soyad" value={teamData.name} onChange={handleTeamChange} />
        <TextField fullWidth margin="normal" name="email" label="Email" value={teamData.email} onChange={handleTeamChange} />
        <TextField select fullWidth margin="normal" name="role" label="Rol" value={teamData.role} onChange={handleTeamChange}>
          <MenuItem value="assistant">Asistan</MenuItem>
          <MenuItem value="sekreter">Sekreter</MenuItem>
        </TextField>
        <Button type="submit" variant="contained" sx={{ mt: 2 }}>
          Ekle
        </Button>
      </Box>

      {message && <Typography sx={{ mt: 2 }}>{message}</Typography>}
    </Box>
  );
};

export default DoctorForm;
