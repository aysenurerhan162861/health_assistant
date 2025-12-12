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

  const openDoctorId = router.query.openChat ? Number(router.query.openChat) : undefined;

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

  if (loading) return <CircularProgress />;
  if (!user) return null;

  return (
    <Layout user={user}>
      <Box sx={{ mt: 10, mx: 3 }}>
        <PatientDoctors openDoctorId={openDoctorId} />
      </Box>
    </Layout>
  );
};

export default DoctorsPage;