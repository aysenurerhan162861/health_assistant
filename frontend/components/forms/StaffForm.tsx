import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Stack,
  Avatar,
} from "@mui/material";
import { User } from "../../services/api";
import {
  uploadStaffFile,
  updateMyProfile,
  updateStaffProfile,
} from "../../services/StaffApi";

interface Props {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isSubUser?: boolean; // Alt kullanıcı mı?
}

const StaffForm: React.FC<Props> = ({ user, setUser, isSubUser = false }) => {
  const [form, setForm] = useState<User>(user);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(user.photoUrl ?? null);
  const [loading, setLoading] = useState(false);

  // user prop değişirse formu güncel tut
  useEffect(() => {
    if (user) setForm(user);
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // 1️⃣ Bilgileri güncelle
      let updated: User;
      if (isSubUser) {
        updated = await updateMyProfile(form); // alt kullanıcı kendi profilini güncelliyor
      } else {
        updated = await updateStaffProfile(user.id, form); // doktor alt kullanıcı güncelliyor
      }

      // 2️⃣ Fotoğraf varsa yükle
      if (file) {
        const photoResponse = await uploadStaffFile(user.id, file);
        updated = { ...updated, photoUrl: photoResponse.url };
      }

      // 3️⃣ Frontend state’i güncelle
      setUser(updated);
      setForm(updated);

      alert("Bilgiler başarıyla güncellendi ✅");
    } catch (err) {
      console.error("Güncelleme hatası:", err);
      alert("Güncelleme hatası!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Stack spacing={2}>
        {/* Avatar */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar src={preview || ""} sx={{ width: 80, height: 80 }} />
          <Button variant="contained" component="label">
            Fotoğraf Yükle
            <input type="file" hidden accept="image/*" onChange={handleFileChange} />
          </Button>
        </Box>

        {/* Form alanları */}
        <TextField label="Ad Soyad" name="name" value={form.name || ""} onChange={handleChange} />
        <TextField label="Telefon" name="phone" value={form.phone || ""} onChange={handleChange} />
        <TextField
          label="Doğum Tarihi"
          name="birth_date"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={form.birth_date || ""}
          onChange={handleChange}
        />
        <TextField label="Cinsiyet" name="gender" value={form.gender || ""} onChange={handleChange} />
        <TextField label="Kan Grubu" name="blood_type" value={form.blood_type || ""} onChange={handleChange} />
        <TextField label="Şehir" name="city" value={form.city || ""} onChange={handleChange} />
        <TextField label="İlçe" name="district" value={form.district || ""} onChange={handleChange} />
        <TextField label="Mahalle" name="neighborhood" value={form.neighborhood || ""} onChange={handleChange} />

        <Button variant="contained" color="primary" onClick={handleSave} disabled={loading}>
          {loading ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </Stack>
    </Box>
  );
};

export default StaffForm;
