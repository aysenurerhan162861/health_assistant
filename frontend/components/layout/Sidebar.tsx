import React, { useState } from "react";
import {
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
  Box,
  Typography,
  Avatar,
  ListItemIcon,
  Collapse,
} from "@mui/material";
import Link from "next/link";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PersonIcon from "@mui/icons-material/Person";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import ScienceIcon from "@mui/icons-material/Science";
import FavoriteIcon from "@mui/icons-material/Favorite";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import SettingsIcon from "@mui/icons-material/Settings";
import PeopleIcon from "@mui/icons-material/People";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";

interface SidebarProps {
  user?: {
    name: string;
    email: string;
    photo_url?: string;
    role?: "doctor" | "citizen" | "assistant" | "sekreter" | string | null;
  } | null;
}

interface MenuItemBase {
  text: string;
  icon?: React.ReactNode;
}

interface MenuItemLink extends MenuItemBase {
  href: string;
}

interface MenuItemGroup extends MenuItemBase {
  type: "group";
  children: MenuItemLink[];
}

type MenuItem = MenuItemLink | MenuItemGroup;

const Sidebar: React.FC<SidebarProps> = ({ user }) => {
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const handleToggle = (text: string) => {
    setOpenGroup((prev) => (prev === text ? null : text));
  };

  // ✅ LocalStorage'tan kullanıcıyı yedek olarak alıyoruz
  const storedUser =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")
      : {};

  const roleFromStorage = storedUser?.role || user?.role;

  // ✅ Rol dönüştürme
  const normalizedUser = user
    ? {
        ...user,
        role:
          roleFromStorage === "doctor"
            ? "doktor"
            : roleFromStorage === "citizen"
            ? "hasta"
            : roleFromStorage === "assistant"
            ? "asistan"
            : roleFromStorage === "sekreter"
            ? "sekreter"
            : roleFromStorage || "doktor", // default artık "doktor"
      }
    : { name: "", email: "", role: "doktor" };

  const baseItems: MenuItem[] = [
    { text: "Panel", icon: <DashboardIcon fontSize="small" />, href: "/dashboard" },
    { text: "Kişisel Bilgiler", icon: <PersonIcon fontSize="small" />, href: "/dashboard/personal-info" },
  ];

  const doctorItems: MenuItem[] = [
    { text: "Kullanıcı Yönetimi", icon: <PeopleIcon fontSize="small" />, href: "/dashboard/users" },
    {
      text: "Hastalar",
      icon: <FavoriteIcon fontSize="small" />,
      type: "group",
      children: [
        { text: "Onaylı Hastalar", href: "/dashboard/patients/approved" }, // ✅ düzeltilmiş path
        { text: "Onay Bekleyenler", href: "/dashboard/patients/pending" }, // ✅ düzeltilmiş path
      ],
    },
  ];

  const patientItems: MenuItem[] = [
    { text: "Doktorlar", icon: <PeopleIcon fontSize="small" />, href: "/dashboard/doctors" },
  ];

  const staffItems: MenuItem[] = [
    { text: "Hastalar", icon: <FavoriteIcon fontSize="small" />, href: "/dashboard/patients" },
  ];

  const commonItems: MenuItem[] = [
    { text: "Öğün Ekle", icon: <RestaurantIcon fontSize="small" />, href: "/ogun-ekle" },
    { text: "Tahliller", icon: <ScienceIcon fontSize="small" />, href: "/tahlil" },
    { text: "Tansiyon", icon: <MonitorHeartIcon fontSize="small" />, href: "/tansiyon" },
    { text: "MR Analizi", icon: <FavoriteIcon fontSize="small" />, href: "/mr-analizi" },
    { text: "Trendler", icon: <TrendingUpIcon fontSize="small" />, href: "/trendler" },
    { text: "Ayarlar", icon: <SettingsIcon fontSize="small" />, href: "/ayarlar" },
  ];

  let menuItems: MenuItem[] = [...baseItems];
  const role = normalizedUser.role ?? "doktor";

  switch (role) {
    case "doktor":
      menuItems = [...menuItems, ...doctorItems];
      break;
    case "hasta":
      menuItems = [...menuItems, ...patientItems];
      break;
    case "asistan":
    case "sekreter":
      menuItems = [...menuItems, ...staffItems];
      break;
    default:
      break;
  }

  menuItems = [...menuItems, ...commonItems];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: 240,
          boxSizing: "border-box",
          background: "linear-gradient(180deg, #0a2d57 0%, #132f65 100%)",
          color: "white",
          paddingTop: 1,
          borderRight: "1px solid rgba(255,255,255,0.1)",
        },
      }}
    >
      <Toolbar />

      {/* Profil */}
      {normalizedUser && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 1,
            py: 1,
          }}
        >
          <Avatar
            src={normalizedUser.photo_url || ""}
            sx={{ width: 70, height: 70, mb: 1, border: "2px solid white" }}
          />
          <Typography variant="subtitle2" sx={{ fontWeight: "bold", textAlign: "center", fontSize: 14 }}>
            {normalizedUser.name}
          </Typography>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", textAlign: "center" }}>
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </Typography>
        </Box>
      )}

      {/* Menü */}
      <List sx={{ mt: 0, overflow: "hidden" }}>
        {menuItems.map((item) =>
          "type" in item && item.type === "group" ? (
            <Box key={item.text}>
              <ListItemButton onClick={() => handleToggle(item.text)} sx={{ borderRadius: 1 }}>
                {item.icon && (
                  <ListItemIcon sx={{ color: "rgba(255,255,255,0.9)", minWidth: 32, mr: 1 }}>
                    {item.icon}
                  </ListItemIcon>
                )}
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{ sx: { color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: 500 } }}
                />
                {openGroup === item.text ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
              <Collapse in={openGroup === item.text} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.children.map((child) => (
                    <Link key={child.text} href={child.href} passHref style={{ textDecoration: "none" }}>
                      <ListItemButton
                        sx={{
                          pl: 6,
                          borderRadius: 1,
                          "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
                        }}
                      >
                        <ListItemText
                          primary={child.text}
                          primaryTypographyProps={{ sx: { color: "rgba(255,255,255,0.75)", fontSize: 13 } }}
                        />
                      </ListItemButton>
                    </Link>
                  ))}
                </List>
              </Collapse>
            </Box>
          ) : (
            <Link key={item.text} href={(item as MenuItemLink).href} passHref style={{ textDecoration: "none" }}>
              <ListItemButton sx={{ mb: 0.3, borderRadius: 1, "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" } }}>
                {item.icon && (
                  <ListItemIcon sx={{ color: "rgba(255,255,255,0.9)", minWidth: 32, mr: 1 }}>
                    {item.icon}
                  </ListItemIcon>
                )}
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{ sx: { color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: 500 } }}
                />
              </ListItemButton>
            </Link>
          )
        )}
      </List>
    </Drawer>
  );
};

export default Sidebar;
