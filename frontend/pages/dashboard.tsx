import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../components/layout/Layout";
import KVKKCard from "../components/forms/KVKKCard";
import { Box, Typography } from "@mui/material";

const Dashboard: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string; photoUrl?: string } | null>(null);
  const [isConsentGiven, setIsConsentGiven] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.push("/login");
    }

    // LocalStorage'da KVKK varsa bile state false başlatılıyor, kullanıcı girişte KVKKCard görüyor
  }, [router]);

  if (!user) return <p>Yükleniyor...</p>;

  return (
    <Layout>
      {!isConsentGiven ? (
        <KVKKCard onConsentGiven={() => setIsConsentGiven(true)} />
      ) : (
        <Box textAlign="center">
          <Typography variant="h4" gutterBottom>
            KVKK Onayı Verildi
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Teşekkürler, KVKK onayınız alınmıştır.
          </Typography>
        </Box>
      )}
    </Layout>
  );
};

export default Dashboard;
