import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Box, CircularProgress } from "@mui/material"; // Box ve yükleniyor için CircularProgress
import Layout from "../../../components/layout/Layout";
import PatientDoctors from "../../../components/doctors/PatientDoctors";
import { User, getMe } from "../../../services/api";

const DoctorsPage: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const me = await getMe();
        setUser(me);
      } catch (err) {
        console.error(err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [router]);

  if (loading) return <CircularProgress />; // Yükleniyorken spinner göster

  if (!user) return null; // Eğer user yoksa boş dön

  return (
    <Layout user={user}>
      <Box sx={{ mt: 10, mx: 3 }}>
        <PatientDoctors />
      </Box>
    </Layout>
  );
};

export default DoctorsPage;
