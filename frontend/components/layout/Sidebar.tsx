import React from "react";
import { Drawer, List, ListItemButton, ListItemText, Toolbar, Box, Typography, Avatar } from "@mui/material";
import Link from "next/link";

interface SidebarProps {
  user?: { name: string; email: string; photoUrl?: string } | null;
}

const Sidebar: React.FC<SidebarProps> = ({ user }) => {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: 240,
          boxSizing: "border-box",
          backgroundColor: "#0a2d57",
          color: "white",
          paddingTop: 2,
        },
      }}
    >
      <Toolbar />

      {/* Kullanıcı Bilgileri */}
      {user && (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
          <Avatar
            src={user.photoUrl || ""}
            sx={{ width: 80, height: 80, mb: 1 }}
          />
          <Typography variant="subtitle1" sx={{ color: "white", fontWeight: "bold" }}>
            {user.name}
          </Typography>
        </Box>
      )}


      <List>
        <Link href="/dashboard" passHref>
          <ListItemButton sx={{ textDecoration: "none" }}>
            <ListItemText primary="Panel" />
          </ListItemButton>
        </Link>
        <Link href="/dashboard/personal-info" passHref>
          <ListItemButton sx={{ textDecoration: "none" }}>
            <ListItemText primary="Kişisel Bilgiler" />
          </ListItemButton>
        </Link>
        <Link href="/ogun-ekle" passHref>
          <ListItemButton sx={{ textDecoration: "none" }}>
            <ListItemText primary="Öğün Ekle" />
          </ListItemButton>
        </Link>
        <Link href="/tahlil" passHref>
          <ListItemButton sx={{ textDecoration: "none" }}>
            <ListItemText primary="Tahliller" />
          </ListItemButton>
        </Link>
        <Link href="/tansiyon" passHref>
          <ListItemButton sx={{ textDecoration: "none" }}>
            <ListItemText primary="Tansiyon" />
          </ListItemButton>
        </Link>
        <Link href="/mr-analizi" passHref>
          <ListItemButton sx={{ textDecoration: "none" }}>
            <ListItemText primary="MR Analizi" />
          </ListItemButton>
        </Link>
        <Link href="/trendler" passHref>
          <ListItemButton sx={{ textDecoration: "none" }}>
            <ListItemText primary="Trendler" />
          </ListItemButton>
        </Link>
        <Link href="/ayarlar" passHref>
          <ListItemButton sx={{ textDecoration: "none" }}>
            <ListItemText primary="Ayarlar" />
          </ListItemButton>
        </Link>
      </List>
    </Drawer>
  );
};

export default Sidebar;
