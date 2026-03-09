"use client";

import React, { useState, useEffect } from "react";
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
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import SettingsIcon from "@mui/icons-material/Settings";
import PeopleIcon from "@mui/icons-material/People";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import axios from "axios";
import BiotechIcon from "@mui/icons-material/Biotech";
import MedicalInformationIcon from "@mui/icons-material/MedicalInformation";

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
  const [role, setRole] = useState<string>("");
  const [unreadLabs, setUnreadLabs] = useState<number>(0);

  const handleToggle = (text: string) => {
    setOpenGroup((prev) => (prev === text ? null : text));
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const roleMap: Record<string, string> = {
        doctor: "doktor",
        citizen: "hasta",
        assistant: "asistan",
        sekreter: "sekreter",
      };
      setRole(roleMap[storedUser.role] || roleMap[user?.role || ""] || "");
    }
  }, [user]);

  useEffect(() => {
    const fetchUnreadLabs = async () => {
      try {
        if (role === "doktor") {
          const token = localStorage.getItem("token") || "";
          const res = await axios.get(
            "http://localhost:8000/api/lab_reports/unread_lab_count",
            { headers: { "token-header": `Bearer ${token}` } }
          );
          setUnreadLabs(res.data.count || 0);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchUnreadLabs();
  }, [role]);

  const normalizedUser = {
    name: user?.name || "",
    email: user?.email || "",
    photo_url: user?.photo_url || "",
  };

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
        { text: "Onaylı Hastalar", href: "/dashboard/patients/approved" },
        { text: "Onay Bekleyenler", href: "/dashboard/patients/pending" },
      ],
    },
    { text: "Tahliller",     icon: <ScienceIcon fontSize="small" />,     href: "/dashboard/doctors/labs" },
    { text: "Öğün Analizi",  icon: <RestaurantIcon fontSize="small" />,  href: "/dashboard/doctors/meals" },
    { text: "Tansiyon",      icon: <MonitorHeartIcon fontSize="small" />, href: "/dashboard/doctors/blood-pressure" },
    { text: "MR Analizleri", icon: <BiotechIcon fontSize="small" />,     href: "/dashboard/doctors/mr-analizi" },
  ];

  const patientItems: MenuItem[] = [
    { text: "Doktorlar",     icon: <PeopleIcon fontSize="small" />,      href: "/dashboard/doctors" },
    { text: "Tahlillerim",   icon: <ScienceIcon fontSize="small" />,     href: "/tahlil" },
    { text: "Öğün Analizi",  icon: <RestaurantIcon fontSize="small" />,  href: "/ogun" },
    { text: "Tansiyon",      icon: <MonitorHeartIcon fontSize="small" />, href: "/tansiyon" },
    { text: "MR Analizi",    icon: <FavoriteIcon fontSize="small" />,    href: "/mr-analizi" },
  ];

  const assistantItems: MenuItem[] = [
    { text: "Hastalar",      icon: <PeopleIcon fontSize="small" />,             href: "/dashboard/assistant" },
    { text: "Öğün Analizi",  icon: <RestaurantIcon fontSize="small" />,         href: "/dashboard/assistant/meals" },
    { text: "Tansiyon",      icon: <MonitorHeartIcon fontSize="small" />,        href: "/dashboard/assistant/blood-pressure" },
    { text: "Tahliller",     icon: <MedicalInformationIcon fontSize="small" />,  href: "/dashboard/assistant/labs" },
    { text: "MR Analizleri", icon: <BiotechIcon fontSize="small" />,            href: "/dashboard/assistant/mr" },
  ];

  const commonItems: MenuItem[] = [
    { text: "Trendler", icon: <TrendingUpIcon fontSize="small" />, href: "/trendler" },
    { text: "Ayarlar",  icon: <SettingsIcon fontSize="small" />,   href: "/ayarlar" },
  ];

  let menuItems: MenuItem[] = [...baseItems];
  switch (role) {
    case "doktor":
      menuItems = [...menuItems, ...doctorItems];
      break;
    case "hasta":
      menuItems = [...menuItems, ...patientItems];
      break;
    case "asistan":
      menuItems = [...menuItems, ...assistantItems];
      break;
    default:
      menuItems = [...menuItems];
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

      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 1, py: 1 }}>
        <Avatar src={normalizedUser.photo_url || ""} sx={{ width: 70, height: 70, mb: 1, border: "2px solid white" }} />
        <Typography variant="subtitle2" sx={{ fontWeight: "bold", textAlign: "center", fontSize: 14 }}>
          {normalizedUser.name}
        </Typography>
        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", textAlign: "center" }}>
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </Typography>
      </Box>

      <List sx={{ mt: 0, overflow: "hidden" }}>
        {menuItems.map((item) =>
          "type" in item && item.type === "group" ? (
            <Box key={item.text}>
              <ListItemButton onClick={() => handleToggle(item.text)} sx={{ borderRadius: 1 }}>
                {item.icon && <ListItemIcon sx={{ color: "rgba(255,255,255,0.9)", minWidth: 32, mr: 1 }}>{item.icon}</ListItemIcon>}
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
                      <ListItemButton sx={{ pl: 6, borderRadius: 1, "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" } }}>
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
                {item.icon && <ListItemIcon sx={{ color: "rgba(255,255,255,0.9)", minWidth: 32, mr: 1 }}>{item.icon}</ListItemIcon>}
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {item.text}
                      {role === "doktor" && item.text === "Tahliller" && unreadLabs > 0 && (
                        <Box sx={{ width: 10, height: 10, bgcolor: "#800000", borderRadius: "50%", display: "inline-block" }} />
                      )}
                    </Box>
                  }
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