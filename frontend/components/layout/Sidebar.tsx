import React from "react";
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

interface SidebarProps {
  user?: { name: string; email: string; photoUrl?: string } | null;
}

const Sidebar: React.FC<SidebarProps> = ({ user }) => {
  const menuItems = [
    { text: "Panel", icon: <DashboardIcon fontSize="small" />, href: "/dashboard" },
    { text: "Kişisel Bilgiler", icon: <PersonIcon fontSize="small" />, href: "/dashboard/personal-info" },
    { text: "Öğün Ekle", icon: <RestaurantIcon fontSize="small" />, href: "/ogun-ekle" },
    { text: "Tahliller", icon: <ScienceIcon fontSize="small" />, href: "/tahlil" },
    { text: "Tansiyon", icon: <MonitorHeartIcon fontSize="small" />, href: "/tansiyon" },
    { text: "MR Analizi", icon: <FavoriteIcon fontSize="small" />, href: "/mr-analizi" },
    { text: "Trendler", icon: <TrendingUpIcon fontSize="small" />, href: "/trendler" },
    { text: "Ayarlar", icon: <SettingsIcon fontSize="small" />, href: "/ayarlar" },
  ];

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
          paddingTop: 2,
          borderRight: "1px solid rgba(255,255,255,0.1)",
        },
      }}
    >
      <Toolbar />

      {/* Kullanıcı Bilgileri */}
      {user && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 2,
            px: 2,
            py: 2,
            bgcolor: "rgba(255,255,255,0.05)",
            borderRadius: 2,
          }}
        >
          <Avatar
            src={user.photoUrl || ""}
            sx={{ width: 80, height: 80, mb: 1, border: "2px solid white" }}
          />
          <Typography
            variant="subtitle1"
            sx={{ color: "white", fontWeight: "bold", fontSize: 16 }}
          >
            {user.name}
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
            {user.email}
          </Typography>
        </Box>
      )}

      {/* Menü */}
      <List sx={{ mt: -1 }}> {/* 👈 Listeyi yukarı çektik */}
        {menuItems.map((item) => (
          <Link
            key={item.text}
            href={item.href}
            passHref
            style={{ textDecoration: "none" }}
          >
            <ListItemButton
              sx={{
                mb: 0.5,
                borderRadius: 1,
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.1)",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: "rgba(255,255,255,0.9)",
                  minWidth: 32,
                  mr: 1,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  sx: {
                    color: "rgba(255,255,255,0.85)",
                    fontSize: 15,
                    fontWeight: 500,
                    textDecoration: "none",
                  },
                }}
              />
            </ListItemButton>
          </Link>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;
