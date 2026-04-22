"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "../../components/layout/Layout";
import KVKKCard from "../../components/forms/KVKKCard";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import ScienceIcon from "@mui/icons-material/Science";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import BiotechIcon from "@mui/icons-material/Biotech";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import FavoriteIcon from "@mui/icons-material/Favorite";
import AssignmentIcon from "@mui/icons-material/Assignment";

import { getApprovedPatients, getPendingPatients, getMyDoctors } from "../../services/PatientApi";
import { getUnreadLabCount } from "../../services/LabApi";
import { getMyTrackings } from "../../services/BloodPressureApi";
import { getMyMeals } from "../../services/MealApi";
import { getAssistantPatients, getMyDoctor } from "../../services/AssistantApi";

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  bg: string;
}

function StatCard({ icon, label, value, color, bg }: StatCardProps) {
  return (
    <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e8edf5", height: "100%" }}>
      <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, p: 2.5 }}>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 2.5,
            bgcolor: bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#0a2d57", lineHeight: 1.1 }}>
            {value}
          </Typography>
          <Typography variant="body2" sx={{ color: "#6b7a90", mt: 0.3 }}>
            {label}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Quick Action Card ────────────────────────────────────────────────────────
interface ActionCardProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  href: string;
  color: string;
  bg: string;
}

function ActionCard({ icon, label, description, href, color, bg }: ActionCardProps) {
  return (
    <Link href={href} passHref style={{ textDecoration: "none" }}>
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #e8edf5",
          cursor: "pointer",
          height: "100%",
          transition: "all 0.18s ease",
          "&:hover": {
            borderColor: color,
            boxShadow: `0 4px 20px ${bg}`,
            transform: "translateY(-2px)",
          },
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              bgcolor: bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color,
              mb: 1.5,
            }}
          >
            {icon}
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#0a2d57" }}>
            {label}
          </Typography>
          <Typography variant="body2" sx={{ color: "#8a96a8", mt: 0.3, fontSize: 13 }}>
            {description}
          </Typography>
        </CardContent>
      </Card>
    </Link>
  );
}

// ─── Role label ───────────────────────────────────────────────────────────────
const roleLabels: Record<string, string> = {
  doctor: "Doktor",
  citizen: "Hasta",
  assistant: "Asistan",
  sekreter: "Sekreter",
};


// ─── Main Component ───────────────────────────────────────────────────────────
export default function DashboardHome() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isConsentGiven, setIsConsentGiven] = useState(false);
  const [loading, setLoading] = useState(true);

  // Doctor stats
  const [approvedCount, setApprovedCount] = useState<number>(0);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [unreadLabs, setUnreadLabs] = useState<number>(0);

  // Patient stats
  const [lastBPDate, setLastBPDate] = useState<string>("-");
  const [mealCount, setMealCount] = useState<number>(0);
  const [doctorCount, setDoctorCount] = useState<number>(0);

  // Assistant stats
  const [assignedPatients, setAssignedPatients] = useState<number>(0);
  const [myDoctorName, setMyDoctorName] = useState<string>("-");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      const kvkk = localStorage.getItem("kvkk") === "true";
      setIsConsentGiven(kvkk);
    } else {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    if (!user || !isConsentGiven) return;
    const role = user.role;

    const loadStats = async () => {
      setLoading(true);
      try {
        if (role === "doctor") {
          const [approved, pending, unread] = await Promise.allSettled([
            getApprovedPatients(),
            getPendingPatients(),
            getUnreadLabCount(),
          ]);
          if (approved.status === "fulfilled") setApprovedCount(approved.value.length);
          if (pending.status === "fulfilled") setPendingCount(pending.value.length);
          if (unread.status === "fulfilled") setUnreadLabs(unread.value);
        }

        if (role === "citizen") {
          const [bpRes, mealRes, doctorRes] = await Promise.allSettled([
            getMyTrackings(),
            getMyMeals(),
            getMyDoctors(),
          ]);
          if (bpRes.status === "fulfilled" && bpRes.value.length > 0) {
            const last = bpRes.value[bpRes.value.length - 1];
            if (last) {
              const d = new Date(last.date);
              setLastBPDate(d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" }));
            }
          }
          if (mealRes.status === "fulfilled") setMealCount(mealRes.value.length);
          if (doctorRes.status === "fulfilled") {
            const approved = doctorRes.value.filter((d) => d.status === "onaylandı");
            setDoctorCount(approved.length);
          }
        }

        if (role === "assistant") {
          const [patientsRes, doctorRes] = await Promise.allSettled([
            getAssistantPatients(user.id),
            getMyDoctor(),
          ]);
          if (patientsRes.status === "fulfilled")
            setAssignedPatients(Array.isArray(patientsRes.value) ? patientsRes.value.length : 0);
          if (doctorRes.status === "fulfilled")
            setMyDoctorName(doctorRes.value.doctor_name);
        }
      } catch (_) {
        // sessiz hata
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [user, isConsentGiven]);

  if (!user) return <p>Yükleniyor...</p>;

  // ─── KVKK ─────────────────────────────────────────────────────────────────
  if (!isConsentGiven) {
    return (
      <Layout user={user}>
        <KVKKCard
          onConsentGiven={() => {
            localStorage.setItem("kvkk", "true");
            setIsConsentGiven(true);
          }}
        />
      </Layout>
    );
  }

  const role: string = user.role || "";
  const roleLabel = roleLabels[role] || role;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Günaydın";
    if (hour < 18) return "İyi günler";
    return "İyi akşamlar";
  };

  // ─── DOKTOR ───────────────────────────────────────────────────────────────
  const DoctorDashboard = () => (
    <Box>
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            icon={<PeopleIcon />}
            label="Onaylı Hasta"
            value={loading ? "..." : approvedCount}
            color="#1565c0"
            bg="#e3f0ff"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            icon={<HourglassEmptyIcon />}
            label="Onay Bekleyen"
            value={loading ? "..." : pendingCount}
            color="#e65100"
            bg="#fff3e0"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            icon={<NotificationsActiveIcon />}
            label="Okunmamış Tahlil"
            value={loading ? "..." : unreadLabs}
            color="#6a1b9a"
            bg="#f3e5f5"
          />
        </Grid>
      </Grid>

      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#0a2d57", mb: 2 }}>
        Hızlı Erişim
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <ActionCard icon={<FavoriteIcon />} label="Hastalar" description="Hasta listesi ve onaylar" href="/dashboard/patients/approved" color="#1565c0" bg="#e3f0ff" />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <ActionCard icon={<ScienceIcon />} label="Tahliller" description="Lab raporlarını incele" href="/dashboard/doctors/labs" color="#2e7d32" bg="#e8f5e9" />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <ActionCard icon={<RestaurantIcon />} label="Öğün Analizi" description="Hasta öğün verileri" href="/dashboard/doctors/meals" color="#e65100" bg="#fff3e0" />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <ActionCard icon={<MonitorHeartIcon />} label="Tansiyon" description="Tansiyon takibi" href="/dashboard/doctors/blood-pressure" color="#c62828" bg="#ffebee" />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <ActionCard icon={<BiotechIcon />} label="MR Analizleri" description="MR görüntü sonuçları" href="/dashboard/doctors/mr-analizi" color="#6a1b9a" bg="#f3e5f5" />
        </Grid>
      </Grid>
    </Box>
  );

  // ─── HASTA ────────────────────────────────────────────────────────────────
  const PatientDashboard = () => (
    <Box>
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            icon={<MonitorHeartIcon />}
            label="Son Tansiyon Tarihi"
            value={loading ? "..." : lastBPDate}
            color="#c62828"
            bg="#ffebee"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            icon={<RestaurantIcon />}
            label="Kayıtlı Öğün"
            value={loading ? "..." : mealCount}
            color="#e65100"
            bg="#fff3e0"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            icon={<LocalHospitalIcon />}
            label="Onaylı Doktorum"
            value={loading ? "..." : doctorCount === 0 ? "Yok" : doctorCount}
            color="#2e7d32"
            bg="#e8f5e9"
          />
        </Grid>
      </Grid>

      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#0a2d57", mb: 2 }}>
        Hızlı Erişim
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <ActionCard icon={<ScienceIcon />} label="Tahlillerim" description="Lab raporlarım" href="/tahlil" color="#2e7d32" bg="#e8f5e9" />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <ActionCard icon={<RestaurantIcon />} label="Öğün Analizi" description="Yemek takibim" href="/ogun" color="#e65100" bg="#fff3e0" />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <ActionCard icon={<MonitorHeartIcon />} label="Tansiyon" description="Ölçüm geçmişim" href="/tansiyon" color="#c62828" bg="#ffebee" />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <ActionCard icon={<BiotechIcon />} label="MR Analizi" description="MR görüntülerim" href="/mr-analizi" color="#6a1b9a" bg="#f3e5f5" />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <ActionCard icon={<TrendingUpIcon />} label="Trendler" description="Sağlık trendlerim" href="/trendler" color="#0277bd" bg="#e1f5fe" />
        </Grid>
      </Grid>
    </Box>
  );

  // ─── ASİSTAN ──────────────────────────────────────────────────────────────
  const AssistantDashboard = () => (
    <Box>
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            icon={<PeopleIcon />}
            label="Atanmış Hasta"
            value={loading ? "..." : assignedPatients}
            color="#6a1b9a"
            bg="#f3e5f5"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            icon={<LocalHospitalIcon />}
            label="Bağlı Doktor"
            value={loading ? "..." : myDoctorName}
            color="#2e7d32"
            bg="#e8f5e9"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            icon={<AssignmentIcon />}
            label="Rol"
            value="Asistan"
            color="#1565c0"
            bg="#e3f0ff"
          />
        </Grid>
      </Grid>

      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#0a2d57", mb: 2 }}>
        Hızlı Erişim
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <ActionCard icon={<PeopleIcon />} label="Hastalar" description="Hasta listesi" href="/dashboard/assistant" color="#6a1b9a" bg="#f3e5f5" />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <ActionCard icon={<ScienceIcon />} label="Tahliller" description="Hasta tahlilleri" href="/dashboard/assistant/labs" color="#2e7d32" bg="#e8f5e9" />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <ActionCard icon={<RestaurantIcon />} label="Öğün Analizi" description="Hasta öğünleri" href="/dashboard/assistant/meals" color="#e65100" bg="#fff3e0" />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <ActionCard icon={<MonitorHeartIcon />} label="Tansiyon" description="Tansiyon verileri" href="/dashboard/assistant/blood-pressure" color="#c62828" bg="#ffebee" />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <ActionCard icon={<BiotechIcon />} label="MR Analizleri" description="MR görüntüleri" href="/dashboard/assistant/mr" color="#0277bd" bg="#e1f5fe" />
        </Grid>
      </Grid>
    </Box>
  );

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <Layout user={user}>
      <Box sx={{ maxWidth: 1100, mx: "auto" }}>

        {/* Hoş geldiniz banner */}
        <Box
          sx={{
            background: "linear-gradient(135deg, #0a2d57 0%, #1565c0 100%)",
            borderRadius: 4,
            p: { xs: 3, sm: 4 },
            mb: 4,
            display: "flex",
            alignItems: "center",
            gap: 3,
            color: "white",
          }}
        >
          <Avatar
            src={user.photo_url || ""}
            sx={{
              width: 64,
              height: 64,
              border: "3px solid rgba(255,255,255,0.4)",
              flexShrink: 0,
            }}
          />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {greeting()}, {user.name || "Kullanıcı"}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.8 }}>
              <Chip
                label={roleLabel}
                size="small"
                sx={{
                  bgcolor: "rgba(255,255,255,0.2)",
                  color: "white",
                  fontWeight: 600,
                  fontSize: 12,
                  height: 24,
                }}
              />
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)" }}>
                {new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Rol bazlı içerik */}
        {role === "doctor"    && <DoctorDashboard />}
        {role === "citizen"   && <PatientDashboard />}
        {role === "assistant" && <AssistantDashboard />}
        {role === "sekreter"  && (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <Typography variant="h6" color="text.secondary">
              Hoş geldiniz. Sisteme giriş yaptınız.
            </Typography>
          </Box>
        )}
      </Box>
    </Layout>
  );
}
