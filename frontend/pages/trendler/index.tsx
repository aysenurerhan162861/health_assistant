"use client";

import React, { useState, useEffect, useMemo } from "react";
import Layout from "@/components/layout/Layout";
import NutritionTrendsView from "@/components/trends/NutritionTrendsView";
import {
  Box,
  Paper,
  Typography,
  MenuItem,
  TextField,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Card,
  CardContent,
} from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  People as PeopleIcon,
  Wc as GenderIcon,
  CalendarToday as AgeIcon,
} from "@mui/icons-material";
import { getApprovedPatients } from "@/services/PatientApi";
import { User } from "@/types/Staff";

const TrendlerPage: React.FC = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [patients, setPatients] = useState<User[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Kullanıcı rolünü ve hasta listesini yükle
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          const role = userObj.role?.toLowerCase();
          setUserRole(role);

          // Eğer doktor ise, hasta listesini çek
          if (role === "doctor" || role === "doktor") {
            fetchPatients();
          }
        } catch (err) {
          console.error("Kullanıcı bilgisi parse edilemedi:", err);
        }
      }
    }
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const patientsData = await getApprovedPatients();
      setPatients(patientsData);
    } catch (err: any) {
      console.error("Hastalar yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientChange = (event: SelectChangeEvent<number | "">) => {
    const value = event.target.value;
    setSelectedPatientId(value === "" || value === null ? null : Number(value));
  };

  const isDoctor = userRole === "doctor" || userRole === "doktor";

  // İstatistikleri hesapla
  const statistics = useMemo(() => {
    if (!isDoctor || patients.length === 0) return null;

    // Cinsiyet dağılımı
    const genderCounts: Record<string, number> = {};
    let totalAge = 0;
    let ageCount = 0;
    const ageGroups: Record<string, number> = {
      "0-18": 0,
      "19-30": 0,
      "31-45": 0,
      "46-60": 0,
      "60+": 0,
    } as const;

    patients.forEach((patient) => {
      // Cinsiyet
      const gender = patient.gender || "Belirtilmemiş";
      genderCounts[gender] = (genderCounts[gender] || 0) + 1;

      // Yaş
      if (patient.age && patient.age > 0) {
        totalAge += patient.age;
        ageCount++;

        const age = patient.age;
        if (age <= 18) {
          ageGroups["0-18"] = (ageGroups["0-18"] ?? 0) + 1;
        } else if (age <= 30) {
          ageGroups["19-30"] = (ageGroups["19-30"] ?? 0) + 1;
        } else if (age <= 45) {
          ageGroups["31-45"] = (ageGroups["31-45"] ?? 0) + 1;
        } else if (age <= 60) {
          ageGroups["46-60"] = (ageGroups["46-60"] ?? 0) + 1;
        } else {
          ageGroups["60+"] = (ageGroups["60+"] ?? 0) + 1;
        }
      } else if (patient.birth_date) {
        // birth_date'den yaş hesapla
        try {
          const birthDate = new Date(patient.birth_date);
          const today = new Date();
          if (!isNaN(birthDate.getTime())) {
            const age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            const calculatedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;

            if (calculatedAge > 0) {
              totalAge += calculatedAge;
              ageCount++;

              if (calculatedAge <= 18) {
                ageGroups["0-18"] = (ageGroups["0-18"] ?? 0) + 1;
              } else if (calculatedAge <= 30) {
                ageGroups["19-30"] = (ageGroups["19-30"] ?? 0) + 1;
              } else if (calculatedAge <= 45) {
                ageGroups["31-45"] = (ageGroups["31-45"] ?? 0) + 1;
              } else if (calculatedAge <= 60) {
                ageGroups["46-60"] = (ageGroups["46-60"] ?? 0) + 1;
              } else {
                ageGroups["60+"] = (ageGroups["60+"] ?? 0) + 1;
              }
            }
          }
        } catch (e) {
          // Geçersiz tarih, atla
        }
      }
    });

    const genderData = Object.entries(genderCounts).map(([name, value]) => ({
      name: name === "male" ? "Erkek" : name === "female" ? "Kadın" : name,
      value,
      color: name === "male" ? "#4ECDC4" : name === "female" ? "#FF6B6B" : "#98D8C8",
    }));

    const ageData = Object.entries(ageGroups)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value,
      }));

    return {
      totalPatients: patients.length,
      genderData,
      ageData,
      averageAge: ageCount > 0 ? (totalAge / ageCount).toFixed(1) : null,
    };
  }, [patients, isDoctor]);

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        {/* Doktor için hasta seçimi */}
        {isDoctor && (
          <Paper
            sx={{
              p: 3,
              mb: 3,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
              Hasta Seçimi
            </Typography>
            <FormControl fullWidth sx={{ bgcolor: "white", borderRadius: 1 }}>
              <InputLabel id="patient-select-label">Hasta Seçin</InputLabel>
              <Select<number | "">
                labelId="patient-select-label"
                id="patient-select"
                value={selectedPatientId ?? ""}
                label="Hasta Seçin"
                onChange={handlePatientChange}
                disabled={loading}
              >
                <MenuItem value="">
                  <em>Tüm Hastalar (Genel Görünüm)</em>
                </MenuItem>
                {patients.map((patient) => (
                  <MenuItem key={patient.id} value={patient.id}>
                    {patient.name} {patient.email ? `(${patient.email})` : ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {selectedPatientId && (
              <Typography variant="body2" sx={{ mt: 2, opacity: 0.9 }}>
                Seçilen hastanın beslenme alışkanlığı trendleri görüntüleniyor.
              </Typography>
            )}
            {!selectedPatientId && (
              <Typography variant="body2" sx={{ mt: 2, opacity: 0.9 }}>
                Hasta seçilmediği için genel görünüm gösteriliyor. Bir hasta seçerek o hastanın detaylı trend analizini görüntüleyebilirsiniz.
              </Typography>
            )}
          </Paper>
        )}

        {/* Genel görünüm - İstatistikler */}
        {isDoctor && !selectedPatientId && statistics && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3, color: "primary.main" }}>
              Hasta İstatistikleri
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: statistics.averageAge ? "repeat(3, 1fr)" : "repeat(2, 1fr)" },
                gap: 3,
                mb: 3,
              }}
            >
              {/* Toplam Hasta Sayısı */}
              <Card
                sx={{
                  height: "100%",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  borderRadius: 3,
                  boxShadow: 3,
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Toplam Hasta
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
                        {statistics.totalPatients}
                      </Typography>
                    </Box>
                    <PeopleIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>

              {/* Ortalama Yaş */}
              {statistics.averageAge && (
                <Card
                  sx={{
                    height: "100%",
                    background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                    color: "white",
                    borderRadius: 3,
                    boxShadow: 3,
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Box>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Ortalama Yaş
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
                          {statistics.averageAge}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          yaş
                        </Typography>
                      </Box>
                      <AgeIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Cinsiyet Dağılımı Özet */}
              {statistics.genderData.length > 0 && (
                <Card
                  sx={{
                    height: "100%",
                    background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                    color: "white",
                    borderRadius: 3,
                    boxShadow: 3,
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Box>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Cinsiyet Dağılımı
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          {statistics.genderData.map((item) => (
                            <Typography key={item.name} variant="body1" sx={{ fontWeight: 600 }}>
                              {item.name}: {item.value}
                            </Typography>
                          ))}
                        </Box>
                      </Box>
                      <GenderIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                    </Box>
                  </CardContent>
                </Card>
              )}
            </Box>

            {/* Grafikler */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                gap: 3,
              }}
            >
              {/* Cinsiyet Dağılımı Grafiği */}
              {statistics.genderData.length > 0 && (
                <Card sx={{ borderRadius: 3, boxShadow: 2, height: "100%" }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      Cinsiyet Dağılımı
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={statistics.genderData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value, percent }) => 
                            `${name}: ${value} (${percent ? (percent * 100).toFixed(0) : 0}%)`
                          }
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statistics.genderData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Yaş Grupları Dağılımı */}
              {statistics.ageData.length > 0 && (
                <Card sx={{ borderRadius: 3, boxShadow: 2, height: "100%" }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      Yaş Grupları Dağılımı
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={statistics.ageData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" name="Hasta Sayısı" fill="#667eea" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </Box>
          </Box>
        )}

        {/* Trend görünümü */}
        {selectedPatientId ? (
          <NutritionTrendsView
            patientId={selectedPatientId}
            compact={false}
          />
        ) : (
          <NutritionTrendsView
            compact={false}
          />
        )}
      </Box>
    </Layout>
  );
};

export default TrendlerPage;
