"use client";

import React, { useState, useEffect, useMemo } from "react";
import Layout from "@/components/layout/Layout";
import NutritionTrendsView from "@/components/trends/NutritionTrendsView";
import {
  Box, Typography, MenuItem, Card, FormControl, Select,
  SelectChangeEvent, Chip, Stack,
} from "@mui/material";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  People as PeopleIcon, Wc as GenderIcon,
  CalendarToday as AgeIcon, Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import { getApprovedPatients } from "@/services/PatientApi";
import { User } from "@/types/Staff";
import axios from "axios";

const TrendlerPage: React.FC = () => {
  const [userRole, setUserRole]           = useState<string | null>(null);
  const [, setUserId]                     = useState<number | null>(null);
  const [patients, setPatients]           = useState<User[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [loading, setLoading]             = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const userStr = localStorage.getItem("user");
    if (!userStr) return;
    try {
      const userObj = JSON.parse(userStr);
      const role = userObj.role?.toLowerCase();
      setUserRole(role);
      setUserId(userObj.id ?? null);
      if (role === "doctor" || role === "doktor") fetchDoctorPatients();
      if (role === "assistant" || role === "asistan") fetchAssistantPatients(userObj.id);
    } catch { /* ignore */ }
  }, []);

  const fetchDoctorPatients = async () => {
    try {
      setLoading(true);
      const data = await getApprovedPatients();
      setPatients(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const fetchAssistantPatients = async (assistantId: number) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token") || "";
      const res   = await axios.get(
        `http://localhost:8000/api/assistants/${assistantId}/patients`,
        { headers: { "token-header": `Bearer ${token}` } }
      );
      setPatients(res.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const handlePatientChange = (e: SelectChangeEvent<number | "">) => {
    const v = e.target.value;
    setSelectedPatientId(v === "" ? null : Number(v));
  };

  const isDoctor    = userRole === "doctor" || userRole === "doktor";
  const isAssistant = userRole === "assistant" || userRole === "asistan";
  const showPatientSelect = isDoctor || isAssistant;

  /* ── Hasta istatistikleri (sadece doktor için) ── */
  const statistics = useMemo(() => {
    if (!isDoctor || patients.length === 0) return null;

    const genderCounts: Record<string, number> = {};
    let totalAge = 0, ageCount = 0;
    const ageGroups: Record<string, number> = { "0-18": 0, "19-30": 0, "31-45": 0, "46-60": 0, "60+": 0 };

    const calcAge = (birth_date?: string, age?: number): number | null => {
      if (age && age > 0) return age;
      if (!birth_date) return null;
      try {
        const bd  = new Date(birth_date);
        const now = new Date();
        if (isNaN(bd.getTime())) return null;
        let a = now.getFullYear() - bd.getFullYear();
        if (now.getMonth() < bd.getMonth() ||
          (now.getMonth() === bd.getMonth() && now.getDate() < bd.getDate())) a--;
        return a > 0 ? a : null;
      } catch { return null; }
    };

    patients.forEach((p) => {
      const gender = p.gender || "Belirtilmemiş";
      genderCounts[gender] = (genderCounts[gender] || 0) + 1;

      const a = calcAge(p.birth_date, p.age);
      if (a !== null) {
        totalAge += a; ageCount++;
        if      (a <= 18) ageGroups["0-18"]  = (ageGroups["0-18"]  ?? 0) + 1;
        else if (a <= 30) ageGroups["19-30"] = (ageGroups["19-30"] ?? 0) + 1;
        else if (a <= 45) ageGroups["31-45"] = (ageGroups["31-45"] ?? 0) + 1;
        else if (a <= 60) ageGroups["46-60"] = (ageGroups["46-60"] ?? 0) + 1;
        else              ageGroups["60+"]   = (ageGroups["60+"]   ?? 0) + 1;
      }
    });

    const genderData = Object.entries(genderCounts).map(([name, value]) => ({
      name:  name === "male" ? "Erkek" : name === "female" ? "Kadın" : name,
      value,
      color: name === "male" ? "#4ECDC4" : name === "female" ? "#FF6B6B" : "#98D8C8",
    }));

    const ageData = Object.entries(ageGroups)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));

    return {
      totalPatients: patients.length,
      genderData,
      ageData,
      averageAge: ageCount > 0 ? (totalAge / ageCount).toFixed(1) : null,
    };
  }, [patients, isDoctor]);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  return (
    <Layout>
      <Box sx={{ maxWidth: 1200, mx: "auto", p: 2 }}>
        {/* Başlık */}
        <Box sx={{ mb: 3, mt: 2, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            <Typography variant="h5" fontWeight={700} color="#0a2d57">Trendler</Typography>
            <Typography variant="body2" color="text.secondary">
              {isDoctor    ? "Hastalarınızın beslenme trend analizi"
               : isAssistant ? "Takip ettiğiniz hastaların beslenme trend analizi"
               : "Son 30 günlük beslenme ve sağlık trendleriniz"}
            </Typography>
          </Box>
          {showPatientSelect && (
            <Chip
              icon={<PeopleIcon fontSize="small" />}
              label={`${patients.length} hasta`}
              sx={{ bgcolor: "#e3f2fd", color: "#1565c0", fontWeight: 600 }}
            />
          )}
        </Box>

        {/* Hasta seçimi (doktor + asistan) */}
        {showPatientSelect && (
          <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2, p: 2.5, mb: 3 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 130 }}>
                <PersonIcon sx={{ color: "#9aa5b4", fontSize: 20 }} />
                <Typography variant="subtitle2" fontWeight={700} color="#0a2d57">
                  Hasta Seçin
                </Typography>
              </Stack>
              <FormControl size="small" fullWidth>
                <Select<number | "">
                  value={selectedPatientId ?? ""}
                  onChange={handlePatientChange}
                  disabled={loading}
                  displayEmpty
                  sx={{ bgcolor: "#fff", borderRadius: 1.5 }}
                >
                  <MenuItem value="">
                    <em>{isDoctor ? "Tüm Hastalar (Genel Görünüm)" : "Hasta seçin..."}</em>
                  </MenuItem>
                  {patients.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name} {p.email ? `(${p.email})` : ""}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedPatient && (
                <Chip
                  label={selectedPatient.name} size="small"
                  sx={{ bgcolor: "#e8f5e9", color: "#2e7d32", fontWeight: 600, whiteSpace: "nowrap" }}
                />
              )}
              {isDoctor && !selectedPatientId && (
                <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                  Genel görünüm aktif
                </Typography>
              )}
            </Stack>
          </Card>
        )}

        {/* Asistan — Hasta seçilmeden boş durum */}
        {isAssistant && !selectedPatientId && (
          <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2, py: 8, textAlign: "center" }}>
            <TrendingUpIcon sx={{ fontSize: 48, color: "#d0d7e3", mb: 1.5 }} />
            <Typography color="text.secondary" fontWeight={500}>
              Trend analizini görüntülemek için bir hasta seçin.
            </Typography>
          </Card>
        )}

        {/* Doktor — Genel hasta istatistikleri (hasta seçilmediğinde) */}
        {isDoctor && !selectedPatientId && statistics && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" fontWeight={700} color="#0a2d57" mb={2}>
              Hasta İstatistikleri
            </Typography>

            <Box sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: statistics.averageAge ? "repeat(3, 1fr)" : "repeat(2, 1fr)" },
              gap: 2, mb: 3,
            }}>
              <Card sx={{
                p: 2.5, borderRadius: 3,
                background: "linear-gradient(135deg, #0a2d57 0%, #1565c0 100%)",
                color: "white",
              }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>Toplam Hasta</Typography>
                    <Typography variant="h4" fontWeight={700} mt={0.5}>{statistics.totalPatients}</Typography>
                  </Box>
                  <PeopleIcon sx={{ fontSize: 44, opacity: 0.25 }} />
                </Box>
              </Card>

              {statistics.averageAge && (
                <Card sx={{
                  p: 2.5, borderRadius: 3,
                  background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                  color: "white",
                }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>Ortalama Yaş</Typography>
                      <Typography variant="h4" fontWeight={700} mt={0.5}>{statistics.averageAge}</Typography>
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>yaş</Typography>
                    </Box>
                    <AgeIcon sx={{ fontSize: 44, opacity: 0.25 }} />
                  </Box>
                </Card>
              )}

              {statistics.genderData.length > 0 && (
                <Card sx={{
                  p: 2.5, borderRadius: 3,
                  background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                  color: "white",
                }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>Cinsiyet Dağılımı</Typography>
                      <Box mt={0.5}>
                        {statistics.genderData.map((item) => (
                          <Typography key={item.name} variant="body1" fontWeight={600}>
                            {item.name}: {item.value}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                    <GenderIcon sx={{ fontSize: 44, opacity: 0.25 }} />
                  </Box>
                </Card>
              )}
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 2 }}>
              {statistics.genderData.length > 0 && (
                <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2, p: 2 }}>
                  <Typography variant="subtitle1" fontWeight={700} color="#0a2d57" mb={1}>
                    Cinsiyet Dağılımı
                  </Typography>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={statistics.genderData} cx="50%" cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) =>
                          `${name}: ${value} (%${percent ? (percent * 100).toFixed(0) : 0})`}
                        outerRadius={95} fill="#8884d8" dataKey="value"
                      >
                        {statistics.genderData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {statistics.ageData.length > 0 && (
                <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2, p: 2 }}>
                  <Typography variant="subtitle1" fontWeight={700} color="#0a2d57" mb={1}>
                    Yaş Grupları Dağılımı
                  </Typography>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={statistics.ageData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f4fa" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Hasta Sayısı" fill="#0a2d57" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}
            </Box>
          </Box>
        )}

        {/* Trend analizi — hasta seçildiyse veya hasta/doktor rolü */}
        {!(isAssistant && !selectedPatientId) && (
          <NutritionTrendsView
            patientId={selectedPatientId ?? undefined}
            compact={false}
          />
        )}
      </Box>
    </Layout>
  );
};

export default TrendlerPage;
