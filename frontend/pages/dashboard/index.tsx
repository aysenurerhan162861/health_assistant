"use client"; // Sayfanın tamamen client-side render olmasını sağlar

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/layout/Layout";
import KVKKCard from "../../components/forms/KVKKCard";
import { Box, Typography } from "@mui/material";

export default function DashboardHome() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isConsentGiven, setIsConsentGiven] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      const kvkk = localStorage.getItem("kvkk") === "true";
      setIsConsentGiven(kvkk);
    } else {
      router.push("/login"); // login yoksa yönlendir
    }
  }, [router]);

  if (!user) return <p>Yükleniyor...</p>;

  return (
    <Layout user={user}>
      {!isConsentGiven ? (
        <KVKKCard
          onConsentGiven={() => {
            localStorage.setItem("kvkk", "true");
            setIsConsentGiven(true);
          }}
        />
      ) : (
        <Box textAlign="center">
          <Typography variant="h4" gutterBottom>
            Dashboard Ana Panel
          </Typography>
          <Typography>Burada özet bilgiler ve istatistikler olabilir.</Typography>
        </Box>
      )}
    </Layout>
  );
}
