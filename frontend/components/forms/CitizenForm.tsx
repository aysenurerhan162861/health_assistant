// src/components/forms/CitizenForm.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  MenuItem,
  Avatar,
  Stack,
  CircularProgress,
} from "@mui/material";
import { User, updateUser, getMe } from "../../services/api";
import {
  getDoctors,
  requestDoctor,
  getMyDoctorStatus,
} from "../../services/PatientApi";

interface Props {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const CitizenForm: React.FC<Props> = ({ user, setUser }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    birthDate: "",
    gender: "female",
    city: "",
    district: "",
    neighborhood: "",
    bloodType: "",
    chronicDiseases: "",
    allergies: "",
    photoUrl: "",
  });

  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [doctors, setDoctors] = useState<User[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<number | "">("");
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [myDoctor, setMyDoctor] = useState<any>(null);
  const [loadingDoctorInfo, setLoadingDoctorInfo] = useState(true);

  const primaryColor = "#0a2d57";
  const backgroundBlue = "#e6f0ff";
  const inputWhite = "#ffffff";

  // Formu user bilgileriyle doldur
  useEffect(() => {
    if (!user) return;
    setFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      birthDate: user.birth_date || "",
      gender: user.gender || "female",
      city: user.city || "",
      district: user.district || "",
      neighborhood: user.neighborhood || "",
      bloodType: user.blood_type || "",
      chronicDiseases: user.chronic_diseases || "",
      allergies: user.allergies || "",
      photoUrl: user.photoUrl || "",
    });
    setPreview(user.photoUrl || null);
  }, [user]);

  // Doktor listesini çek
  useEffect(() => {
    async function fetchDoctors() {
      try {
        const list = await getDoctors();
        setDoctors(list);
      } catch (err) {
        console.error(err);
      }
    }
    fetchDoctors();
  }, []);

  // Hastanın seçtiği doktor bilgisini çek
  useEffect(() => {
    async function fetchMyDoctor() {
      try {
        const info = await getMyDoctorStatus();
        setMyDoctor(info);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingDoctorInfo(false);
      }
    }
    fetchMyDoctor();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setPreview(imageUrl);
      setFormData({ ...formData, photoUrl: imageUrl });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Partial<User> = {};
      if (formData.name) payload.name = formData.name;
      if (formData.email) payload.email = formData.email;
      if (formData.phone) payload.phone = formData.phone;
      if (formData.birthDate) payload.birth_date = formData.birthDate;
      if (formData.gender) payload.gender = formData.gender;
      if (formData.city) payload.city = formData.city;
      if (formData.district) payload.district = formData.district;
      if (formData.neighborhood) payload.neighborhood = formData.neighborhood;
      if (formData.bloodType) payload.blood_type = formData.bloodType;
      if (formData.chronicDiseases) payload.chronic_diseases = formData.chronicDiseases;
      if (formData.allergies) payload.allergies = formData.allergies;
      if (formData.photoUrl) payload.photoUrl = formData.photoUrl;

      const res = await updateUser(payload);
      if (res.error) throw new Error(res.error);

      const updatedUser = await getMe();
      setUser(updatedUser);
      setPreview(updatedUser.photoUrl || "");
      setMessage("Bilgiler başarıyla güncellendi ✅");
    } catch (err) {
      console.error(err);
      setMessage("Güncelleme başarısız ❌");
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleSelectDoctor = async () => {
    if (!selectedDoctor || !user) return;
    setDoctorLoading(true);
    try {
      await requestDoctor({
        patient_id: user.id,
        doctor_id: selectedDoctor,
        note: `Kendi seçtiği doktor: ${selectedDoctor}`,
      });
      // Seçim sonrası doktor bilgilerini güncelle
      const updatedDoctor = await getMyDoctorStatus();
      setMyDoctor(updatedDoctor);
      setSelectedDoctor("");
    } catch (err: any) {
      alert(err.message || "Doktor seçimi yapılamadı");
    } finally {
      setDoctorLoading(false);
    }
  };

  return (
    <Box sx={{ p: 4, bgcolor: backgroundBlue, minHeight: "90vh" }}>
      <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 3, maxWidth: 600, mx: "auto" }}>
        <Typography
          variant="h6"
          sx={{ color: primaryColor, fontWeight: "bold", mb: 3, textAlign: "center" }}
        >
          Kişisel Bilgileriniz
        </Typography>

        <Stack alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Avatar
            src={preview || ""}
            sx={{ width: 100, height: 100, border: `3px solid ${primaryColor}` }}
          />
          <Button variant="outlined" component="label" sx={{ color: primaryColor }}>
            Fotoğraf Yükle
            <input hidden accept="image/*" type="file" onChange={handleImageChange} />
          </Button>
        </Stack>

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
            sx={{
              mt: 3,
              bgcolor: primaryColor,
              "&:hover": { bgcolor: "#082147" },
              width: "100%",
            }}
          >
            Güncelle
          </Button>

          {message && (
            <Typography
              sx={{
                mt: 2,
                color: primaryColor,
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              {message}
            </Typography>
          )}
        </Box>

        {/* Doktor Seçimi ve Durumu */}
        <Box mt={4}>
          <Typography variant="h6" gutterBottom>
            Doktor Seç
          </Typography>

          <TextField
            select
            fullWidth
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(Number(e.target.value))}
            sx={{ mb: 2, bgcolor: inputWhite }}
          >
            {doctors.map((doc) => (
              <MenuItem key={doc.id} value={doc.id}>
                {doc.name} ({doc.email})
              </MenuItem>
            ))}
          </TextField>

          <Button
            onClick={handleSelectDoctor}
            variant="contained"
            sx={{ bgcolor: primaryColor, "&:hover": { bgcolor: "#082147" }, width: "100%" }}
            disabled={doctorLoading || selectedDoctor === ""}
          >
            {doctorLoading ? "Gönderiliyor..." : "Doktoru Seç"}
          </Button>

          {/* Seçilen doktorun durumu */}
          <Box mt={3}>
            {loadingDoctorInfo ? (
              <CircularProgress />
            ) : !myDoctor || myDoctor.message ? (
              <Typography>Henüz bir doktor seçmediniz.</Typography>
            ) : (
              <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 1 }}>
                <Typography>👨‍⚕️ <b>{myDoctor.doctor_name}</b></Typography>
                <Typography>📧 {myDoctor.doctor_email}</Typography>
                <Typography sx={{ mt: 1 }}>
                  🩺 Durum:{" "}
                  <b
                    style={{
                      color:
                        myDoctor.status === "onaylandı"
                          ? "green"
                          : myDoctor.status === "reddedildi"
                          ? "red"
                          : "orange",
                    }}
                  >
                    {myDoctor.status || "Beklemede"}
                  </b>
                </Typography>
              </Paper>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default CitizenForm;
