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
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" onClose={() => setError(null)}>
        {error}
      </Alert>
    );
  }

  if (!analysis) {
    return (
      <Alert severity="info">
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
    <Box sx={{ p: 3, maxWidth: "1400px", mx: "auto" }}>
      {/* Başlık */}
      <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: "primary.main" }}>
            Genel Beslenme Alışkanlığı
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Son 30 günlük öğün verilerinize göre hazırlanmış detaylı analiz
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchAnalysis}
          disabled={loading}
          sx={{ borderRadius: 2 }}
        >
          Yenile
        </Button>
      </Box>

      {/* İstatistik Kartları */}
      {analysis.statistics && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 3, mb: 4 }}>
          <Box>
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
                      Ortalama Günlük Kalori
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
                      {analysis.statistics.avg_daily_calories.toFixed(0)}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      kcal/gün
                    </Typography>
                  </Box>
                  <FireIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box>
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
                      Toplam Öğün
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
                      {analysis.statistics.total_meals}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      son 30 gün
                    </Typography>
                  </Box>
                  <RestaurantIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box>
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
                      Aktif Gün Sayısı
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
                      {analysis.statistics.unique_days}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      / 30 gün
                    </Typography>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box>
            <Card
              sx={{
                height: "100%",
                background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                color: "white",
                borderRadius: 3,
                boxShadow: 3,
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Kahvaltı Atlanan
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
                      {analysis.statistics.breakfast_skipped}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      gün
                    </Typography>
                  </Box>
                  <BreakfastIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

      {/* Grafikler */}
      {analysis.statistics && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" }, gap: 3, mb: 4 }}>
          {/* Günlük Kalori Trendi */}
          <Box>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Son 7 Günlük Kalori Trendi
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={prepareCalorieTrendData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="kalori"
                      stroke="#667eea"
                      strokeWidth={3}
                      dot={{ fill: "#667eea", r: 5 }}
                      name="Kalori (kcal)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Box>

          {/* Makro Besin Dağılımı */}
          <Box>
            <Card sx={{ borderRadius: 3, boxShadow: 2, height: "100%" }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Makro Besin Dağılımı
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={prepareMacroData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {prepareMacroData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Box>

          {/* Öğün Tipi Dağılımı */}
          <Box sx={{ gridColumn: { xs: "1", md: "1 / -1" } }}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Öğün Tipi Dağılımı
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={prepareMealTypeData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Öğün Sayısı" fill="#667eea" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

      {/* AI Analizi */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 3 }}>
        {/* Özet */}
        <Box sx={{ gridColumn: { xs: "1", md: "1 / -1" } }}>
          <Card sx={{ borderRadius: 3, boxShadow: 2, background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Genel Değerlendirme
              </Typography>
              <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, fontSize: "1.1rem" }}>
                {analysis.summary}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Olumlu Alışkanlıklar */}
        {analysis.positives && analysis.positives.length > 0 && (
          <Box>
            <Card sx={{ borderRadius: 3, boxShadow: 2, height: "100%", borderLeft: "4px solid #4caf50" }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 600 }}>
                  <CheckCircleIcon color="success" />
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
          </Box>
        )}

        {/* Dikkat Edilmesi Gerekenler */}
        {analysis.warnings && analysis.warnings.length > 0 && (
          <Box>
            <Card sx={{ borderRadius: 3, boxShadow: 2, height: "100%", borderLeft: "4px solid #ff9800" }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 600 }}>
                  <WarningIcon color="warning" />
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
          </Box>
        )}

        {/* Öneriler */}
        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <Box>
            <Card sx={{ borderRadius: 3, boxShadow: 2, height: "100%", borderLeft: "4px solid #2196f3" }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 600 }}>
                  <LightbulbIcon color="primary" />
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
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default NutritionTrendsView;

