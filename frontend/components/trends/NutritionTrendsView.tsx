"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Button,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  LocalFireDepartment as FireIcon,
  Restaurant as RestaurantIcon,
  BreakfastDining as BreakfastIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Lightbulb as LightbulbIcon,
  OpenInNew as OpenInNewIcon,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  getNutritionTrendsAnalysis,
  getPatientNutritionTrendsAnalysis,
  NutritionTrendsAnalysis,
} from "@/services/MealApi";

interface NutritionTrendsViewProps {
  patientId?: number; // Eğer verilirse, doktor için hasta trendi; yoksa kendi trendi
  compact?: boolean; // Modal içinde kompakt görünüm için
  onViewDetails?: () => void; // Detaylı görüntüleme için callback
}

const NutritionTrendsView: React.FC<NutritionTrendsViewProps> = ({
  patientId,
  compact = false,
  onViewDetails,
}) => {
  const [analysis, setAnalysis] = useState<NutritionTrendsAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = patientId
        ? await getPatientNutritionTrendsAnalysis(patientId)
        : await getNutritionTrendsAnalysis();
      setAnalysis(data);
    } catch (err: any) {
      console.error("Trend analizi yüklenemedi:", err);
      setError(
        err.response?.data?.detail || "Trend analizi yüklenirken bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [patientId]);

  // Grafik verilerini hazırla
  const prepareCalorieTrendData = () => {
    if (!analysis?.statistics?.daily_calories_trend) return [];
    return analysis.statistics.daily_calories_trend.map((item) => ({
      date: new Date(item.date).toLocaleDateString("tr-TR", { day: "numeric", month: "short" }),
      kalori: item.calories,
    }));
  };

  const prepareMealTypeData = () => {
    if (!analysis?.statistics?.meal_counts) return [];
    const counts = analysis.statistics.meal_counts;
    return [
      { name: "Sabah", value: counts.sabah, color: "#FF6B6B" },
      { name: "Öğle", value: counts.ogle, color: "#4ECDC4" },
      { name: "Akşam", value: counts.aksam, color: "#45B7D1" },
      { name: "Ara Öğün", value: counts.ara, color: "#FFA07A" },
      { name: "Diğer", value: counts.diger, color: "#98D8C8" },
    ].filter((item) => item.value > 0);
  };

  const prepareMacroData = () => {
    if (!analysis?.statistics) return [];
    const stats = analysis.statistics;
    return [
      { name: "Protein", value: stats.protein_ratio, color: "#FF6B6B" },
      { name: "Karbonhidrat", value: stats.carb_ratio, color: "#4ECDC4" },
      { name: "Yağ", value: stats.fat_ratio, color: "#45B7D1" },
    ];
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress sx={{ color: "#0a2d57" }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" onClose={() => setError(null)} sx={{ borderRadius: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!analysis) {
    return (
      <Alert severity="info" sx={{ borderRadius: 2 }}>
        Analiz verisi bulunamadı. Lütfen daha sonra tekrar deneyin.
      </Alert>
    );
  }

  // Kompakt görünüm (modal için)
  if (compact) {
    return (
      <Box>
        {/* Özet */}
        <Card sx={{ mb: 2, background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)" }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
              Genel Değerlendirme
            </Typography>
            <Typography variant="body2" paragraph>
              {analysis.summary}
            </Typography>
          </CardContent>
        </Card>

        {/* Hızlı İstatistikler */}
        {analysis.statistics && (
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2, mb: 2 }}>
            <Card sx={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white" }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Ortalama Kalori
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {analysis.statistics.avg_daily_calories.toFixed(0)} kcal
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", color: "white" }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Toplam Öğün
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {analysis.statistics.total_meals}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Detaylı Görüntüle Butonu */}
        {onViewDetails && (
          <Button
            variant="outlined"
            fullWidth
            startIcon={<OpenInNewIcon />}
            onClick={onViewDetails}
            sx={{ mt: 2 }}
          >
            Detaylı Görüntüle
          </Button>
        )}
      </Box>
    );
  }

  // Tam görünüm (sayfa için)
  return (
    <Box>
      {/* Başlık */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        borderBottom: "1px solid #e8edf5", pb: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight={700} color="#0a2d57">
            Beslenme Trend Analizi
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Son 30 günlük öğün verilerine göre hazırlanmış detaylı analiz
          </Typography>
        </Box>
        <Button
          variant="outlined" size="small"
          startIcon={<RefreshIcon />}
          onClick={fetchAnalysis}
          disabled={loading}
          sx={{ borderColor: "#d0d7e3", color: "#6b7a90", borderRadius: 2,
            "&:hover": { bgcolor: "#f0f6ff", borderColor: "#0a2d57", color: "#0a2d57" } }}
        >
          Yenile
        </Button>
      </Box>

      {/* İstatistik Kartları */}
      {analysis.statistics && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 3, mb: 4 }}>
          <Card sx={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Ortalama Günlük Kalori</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>{analysis.statistics.avg_daily_calories.toFixed(0)}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>kcal/gün</Typography>
                </Box>
                <FireIcon sx={{ fontSize: 48, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", color: "white", borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Toplam Öğün</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>{analysis.statistics.total_meals}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>son 30 gün</Typography>
                </Box>
                <RestaurantIcon sx={{ fontSize: 48, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", color: "white", borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Aktif Gün Sayısı</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>{analysis.statistics.unique_days}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>/ 30 gün</Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 48, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)", color: "white", borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Kahvaltı Atlanan</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>{analysis.statistics.breakfast_skipped}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>gün</Typography>
                </Box>
                <BreakfastIcon sx={{ fontSize: 48, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Grafikler */}
      {analysis.statistics && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" }, gap: 3, mb: 4 }}>
          {/* Günlük Kalori Trendi */}
          <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700, color: "#0a2d57" }}>
                Son 7 Günlük Kalori Trendi
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={prepareCalorieTrendData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f4fa" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="kalori" stroke="#0a2d57" strokeWidth={3}
                    dot={{ fill: "#0a2d57", r: 5 }} name="Kalori (kcal)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Makro Besin Dağılımı */}
          <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700, color: "#0a2d57" }}>
                Makro Besin Dağılımı
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={prepareMacroData()} cx="50%" cy="50%" labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80} fill="#8884d8" dataKey="value">
                    {prepareMacroData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Öğün Tipi Dağılımı */}
          <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2, gridColumn: { xs: "1", md: "1 / -1" } }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700, color: "#0a2d57" }}>
                Öğün Tipi Dağılımı
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={prepareMealTypeData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f4fa" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Öğün Sayısı" fill="#0a2d57" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* AI Analizi */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 3 }}>
        {/* Özet */}
        <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2, bgcolor: "#f8faff", gridColumn: { xs: "1", md: "1 / -1" } }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700, color: "#0a2d57", mb: 1.5 }}>
              Genel Değerlendirme
            </Typography>
            <Typography variant="body2" paragraph sx={{ lineHeight: 1.8, color: "#374151" }}>
              {analysis.summary}
            </Typography>
          </CardContent>
        </Card>

        {/* Olumlu Alışkanlıklar */}
        {analysis.positives && analysis.positives.length > 0 && (
          <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2, borderLeft: "4px solid #2e7d32" }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700, color: "#0a2d57" }}>
                <CheckCircleIcon sx={{ color: "#2e7d32", fontSize: 20 }} />
                Olumlu Alışkanlıklar
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                {analysis.positives.map((item, index) => (
                  <Box component="li" key={index} sx={{ mb: 1 }}>
                    <Typography variant="body2">{item}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Dikkat Edilmesi Gerekenler */}
        {analysis.warnings && analysis.warnings.length > 0 && (
          <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2, borderLeft: "4px solid #e65100" }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700, color: "#0a2d57" }}>
                <WarningIcon sx={{ color: "#e65100", fontSize: 20 }} />
                Dikkat Edilmesi Gereken Noktalar
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                {analysis.warnings.map((item, index) => (
                  <Box component="li" key={index} sx={{ mb: 1 }}>
                    <Typography variant="body2">{item}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Öneriler */}
        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2, borderLeft: "4px solid #1565c0" }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700, color: "#0a2d57" }}>
                <LightbulbIcon sx={{ color: "#1565c0", fontSize: 20 }} />
                Öneriler
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                {analysis.recommendations.map((item, index) => (
                  <Box component="li" key={index} sx={{ mb: 1 }}>
                    <Typography variant="body2">{item}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
};

export default NutritionTrendsView;

