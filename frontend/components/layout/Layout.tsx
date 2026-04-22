"use client";
import React, { ReactNode, useEffect, useState } from "react";
import { Box, Toolbar } from "@mui/material";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import HealthChatbot from "../chatbot/HealthChatbot";

interface LayoutProps {
  user?: Partial<User> | null; // tüm alanları opsiyonel yap
  children: React.ReactNode;
}

interface User {
  name: string;
  email: string;
  role: string;
  photoUrl?: string;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <Sidebar user={user} />

      {/* Ana içerik */}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Navbar />
        <Toolbar /> {/* Fixed Navbar için boşluk */}
        <Box sx={{ p: 3, flexGrow: 1 }}>{children}</Box>
      </Box>

      {/* Chatbot */}
      <HealthChatbot />
    </Box>
  );
};

export default Layout;
