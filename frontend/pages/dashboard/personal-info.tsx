import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/layout/Layout";
import KVKKCard from "../../components/forms/KVKKCard";
import CitizenForm from "../../components/forms/CitizenForm";
import DoctorForm from "../../components/forms/DoctorForm";
import StaffForm from "../../components/forms/StaffForm";
import PatientModule from "../../components/patients/PatientModule"; // ✅ Hasta modülü
import { getMe, User } from "../../services/api";
import { Box, Typography } from "@mui/material";

const PersonalInfoPage: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isConsentGiven, setIsConsentGiven] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const me: User = await getMe();
        setUser(me);
      } catch (err) {
        console.error(err);
        router.push("/login"); // user alınamazsa login sayfasına yönlendir
      }
    }
    fetchUser();

    const kvkk = localStorage.getItem("kvkk") === "true";
    setIsConsentGiven(kvkk);
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
        <Box>
          <Typography variant="h5" gutterBottom>
            Kişisel Bilgiler
          </Typography>

          {user.role === "citizen" && (
            <>
              <CitizenForm user={user} setUser={setUser} />
            </>
          )}

          {user.role === "doctor" && (
            <>
              <DoctorForm user={user} setUser={setUser} />
              <PatientModule /> {/* Hasta modülü burada gösterilecek */}
            </>
          )}

          {user.role === "assistant" && (
            <StaffForm user={user} setUser={setUser} isSubUser={true} />
          )}
        </Box>
      )}
    </Layout>
  );
};

export default PersonalInfoPage;
