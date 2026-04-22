import React from "react";
import { NotificationSetting } from "@/types/Notification";
import { Box, Typography, Switch, Stack, Chip } from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import BiotechIcon from "@mui/icons-material/Biotech";
import AssignmentIcon from "@mui/icons-material/Assignment";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export interface EventConfig {
  label:       string;
  description: string;
  icon:        React.ReactElement;
  iconBg:      string;
  iconColor:   string;
}

// Her event için role bazlı config'ler
type RoleKey = "doctor" | "citizen" | "assistant";

const EVENT_CONFIGS: Record<string, Record<RoleKey, EventConfig>> = {
  lab_uploaded: {
    doctor: {
      label:       "Tahlil Raporu Yüklendi",
      description: "Hastanız yeni bir tahlil raporu yüklediğinde bildirim alın",
      icon:        <AssignmentIcon />, iconBg: "#e8f5e9", iconColor: "#2e7d32",
    },
    citizen: {
      label:       "Tahlil Raporu Yüklendi",
      description: "Tahlil raporunuz sisteme eklendiğinde bildirim alın",
      icon:        <AssignmentIcon />, iconBg: "#e8f5e9", iconColor: "#2e7d32",
    },
    assistant: {
      label:       "Hasta Tahlil Yükledi",
      description: "Takip ettiğiniz hasta yeni tahlil raporu yüklediğinde bildirim alın",
      icon:        <AssignmentIcon />, iconBg: "#e8f5e9", iconColor: "#2e7d32",
    },
  },
  meal_uploaded: {
    doctor: {
      label:       "Hasta Öğün Ekledi",
      description: "Hastanız yeni bir öğün kaydı eklediğinde bildirim alın",
      icon:        <RestaurantIcon />, iconBg: "#fff8e1", iconColor: "#f57c00",
    },
    citizen: {
      label:       "Öğün Kaydedildi",
      description: "Öğününüz sisteme kaydedildiğinde bildirim alın",
      icon:        <RestaurantIcon />, iconBg: "#fff8e1", iconColor: "#f57c00",
    },
    assistant: {
      label:       "Hasta Öğün Ekledi",
      description: "Takip ettiğiniz hasta yeni öğün eklediğinde bildirim alın",
      icon:        <RestaurantIcon />, iconBg: "#fff8e1", iconColor: "#f57c00",
    },
  },
  blood_pressure_completed: {
    doctor: {
      label:       "Tansiyon Ölçümü Tamamlandı",
      description: "Hastanız tansiyon ölçümlerini doktora gönderdiğinde bildirim alın",
      icon:        <MonitorHeartIcon />, iconBg: "#ffebee", iconColor: "#c62828",
    },
    citizen: {
      label:       "Tansiyon Takibi Tamamlandı",
      description: "Tansiyon takibiniz tamamlandığında bildirim alın",
      icon:        <MonitorHeartIcon />, iconBg: "#ffebee", iconColor: "#c62828",
    },
    assistant: {
      label:       "Hasta Tansiyon Tamamladı",
      description: "Takip ettiğiniz hastanın tansiyon ölçümü tamamlandığında bildirim alın",
      icon:        <MonitorHeartIcon />, iconBg: "#ffebee", iconColor: "#c62828",
    },
  },
  mr_uploaded: {
    doctor: {
      label:       "Hasta MR Görüntüsü Yükledi",
      description: "Hastanız yeni bir MR görüntüsü yüklediğinde bildirim alın",
      icon:        <BiotechIcon />, iconBg: "#ede7f6", iconColor: "#6a1b9a",
    },
    citizen: {
      label:       "MR Analizi Başlatıldı",
      description: "MR görüntünüz analiz kuyruğuna alındığında bildirim alın",
      icon:        <BiotechIcon />, iconBg: "#ede7f6", iconColor: "#6a1b9a",
    },
    assistant: {
      label:       "Hasta MR Görüntüsü Yükledi",
      description: "Takip ettiğiniz hasta yeni MR görüntüsü yüklediğinde bildirim alın",
      icon:        <BiotechIcon />, iconBg: "#ede7f6", iconColor: "#6a1b9a",
    },
  },
  patient_selected_doctor: {
    doctor: {
      label:       "Yeni Hasta İsteği",
      description: "Bir hasta sizi doktor olarak seçtiğinde bildirim alın",
      icon:        <PersonAddIcon />, iconBg: "#e3f2fd", iconColor: "#1565c0",
    },
    citizen: {
      label:       "Doktor Seçimi",
      description: "Doktor seçim isteğiniz iletildiğinde bildirim alın",
      icon:        <PersonAddIcon />, iconBg: "#e3f2fd", iconColor: "#1565c0",
    },
    assistant: {
      label:       "Hasta İsteği",
      description: "Hasta seçim durumu değiştiğinde bildirim alın",
      icon:        <PersonAddIcon />, iconBg: "#e3f2fd", iconColor: "#1565c0",
    },
  },
  doctor_approved_patient: {
    doctor: {
      label:       "Hasta Onaylandı",
      description: "Hasta onay durumu güncellendiğinde bildirim alın",
      icon:        <CheckCircleIcon />, iconBg: "#e8f5e9", iconColor: "#2e7d32",
    },
    citizen: {
      label:       "Doktorunuz Sizi Onayladı",
      description: "Seçtiğiniz doktor sizi onayladığında bildirim alın",
      icon:        <CheckCircleIcon />, iconBg: "#e8f5e9", iconColor: "#2e7d32",
    },
    assistant: {
      label:       "Hasta Onaylandı",
      description: "Takip ettiğiniz hastanın onay durumu değiştiğinde bildirim alın",
      icon:        <CheckCircleIcon />, iconBg: "#e8f5e9", iconColor: "#2e7d32",
    },
  },
  doctor_comment: {
    doctor: {
      label:       "Yorum Bildirimi",
      description: "Yorum durumunuz güncellendiğinde bildirim alın",
      icon:        <MedicalServicesIcon />, iconBg: "#f3e5f5", iconColor: "#6a1b9a",
    },
    citizen: {
      label:       "Doktor Yorum Ekledi",
      description: "Doktorunuz herhangi bir kaydınıza yorum eklediğinde bildirim alın",
      icon:        <MedicalServicesIcon />, iconBg: "#f3e5f5", iconColor: "#6a1b9a",
    },
    assistant: {
      label:       "Doktor Yorum Ekledi",
      description: "Bir kayda doktor yorumu eklendiğinde bildirim alın",
      icon:        <MedicalServicesIcon />, iconBg: "#f3e5f5", iconColor: "#6a1b9a",
    },
  },
  assistant_patient_assigned: {
    doctor: {
      label:       "Hasta Atandı",
      description: "Asistana hasta erişimi verildiğinde bildirim alın",
      icon:        <PersonAddIcon />, iconBg: "#e3f2fd", iconColor: "#1565c0",
    },
    citizen: {
      label:       "Yeni Erişim",
      description: "Kaydınıza erişim izni verildiğinde bildirim alın",
      icon:        <PersonAddIcon />, iconBg: "#e3f2fd", iconColor: "#1565c0",
    },
    assistant: {
      label:       "Yeni Hasta Erişimi",
      description: "Doktorunuz size yeni bir hasta için erişim izni verdiğinde bildirim alın",
      icon:        <PersonAddIcon />, iconBg: "#e3f2fd", iconColor: "#1565c0",
    },
  },
};

const FALLBACK_CONFIG: EventConfig = {
  label:       "",
  description: "",
  icon:        <AssignmentIcon />,
  iconBg:      "#e8edf5",
  iconColor:   "#0a2d57",
};

export const getEventConfig = (event_name: string, role: RoleKey = "citizen"): EventConfig => {
  const roleConfigs = EVENT_CONFIGS[event_name];
  if (!roleConfigs) return { ...FALLBACK_CONFIG, label: event_name };
  return roleConfigs[role] ?? roleConfigs["citizen"] ?? FALLBACK_CONFIG;
};

interface Props {
  setting: NotificationSetting;
  onChange: (field: "push" | "email", value: boolean) => void;
  role?:    RoleKey;
}

const NotificationSettingCard: React.FC<Props> = ({ setting, onChange, role = "citizen" }) => {
  const cfg         = getEventConfig(setting.event_name, role);
  const activeCount = [setting.push_enabled, setting.email_enabled].filter(Boolean).length;

  return (
    <Box sx={{
      px: 2.5, py: 2,
      display: "flex", justifyContent: "space-between", alignItems: "center",
      gap: 2, bgcolor: "#fff",
      "&:hover": { bgcolor: "#fafbff" },
      transition: "background .15s",
    }}>
      {/* Sol: ikon + etiket + açıklama + durum */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{
          width: 44, height: 44, borderRadius: 2,
          bgcolor: cfg.iconBg, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          "& svg": { fontSize: 22, color: cfg.iconColor },
        }}>
          {cfg.icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
            <Typography variant="body2" fontWeight={700} color="#1a2e4a">
              {cfg.label}
            </Typography>
            <Chip
              label={activeCount === 2 ? "Aktif" : activeCount === 1 ? "Kısmi" : "Kapalı"}
              size="small"
              sx={{
                bgcolor: activeCount === 2 ? "#e8f5e9" : activeCount === 1 ? "#fff3e0" : "#f3f4f6",
                color:   activeCount === 2 ? "#2e7d32" : activeCount === 1 ? "#e65100" : "#9aa5b4",
                fontWeight: 600, fontSize: 10, height: 18,
              }}
            />
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {cfg.description}
          </Typography>
        </Box>
      </Stack>

      {/* Sağ: toggle'lar */}
      <Stack direction="row" spacing={0} alignItems="center" flexShrink={0}
        sx={{ border: "1px solid #e8edf5", borderRadius: 2, overflow: "hidden" }}>
        {/* Push */}
        <Stack alignItems="center" spacing={0.25} sx={{ px: 2.5, py: 1.25, bgcolor: "#fafbff" }}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <PhoneAndroidIcon sx={{ fontSize: 13, color: "#9aa5b4" }} />
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: 11 }}>
              Push
            </Typography>
          </Stack>
          <Switch
            size="small"
            checked={setting.push_enabled}
            onChange={(e) => onChange("push", e.target.checked)}
            sx={{
              "& .MuiSwitch-switchBase.Mui-checked":                    { color: "#0a2d57" },
              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#0a2d57" },
            }}
          />
        </Stack>

        <Box sx={{ width: "1px", alignSelf: "stretch", bgcolor: "#e8edf5" }} />

        {/* E-posta */}
        <Stack alignItems="center" spacing={0.25} sx={{ px: 2.5, py: 1.25, bgcolor: "#fafbff" }}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <EmailIcon sx={{ fontSize: 13, color: "#9aa5b4" }} />
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: 11 }}>
              E-posta
            </Typography>
          </Stack>
          <Switch
            size="small"
            checked={setting.email_enabled}
            onChange={(e) => onChange("email", e.target.checked)}
            sx={{
              "& .MuiSwitch-switchBase.Mui-checked":                    { color: "#0a2d57" },
              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#0a2d57" },
            }}
          />
        </Stack>
      </Stack>
    </Box>
  );
};

export default NotificationSettingCard;
