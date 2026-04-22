import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/layout/Layout";
import KVKKCard from "../../components/forms/KVKKCard";
import CitizenForm from "../../components/forms/CitizenForm";
import DoctorForm from "../../components/forms/DoctorForm";
import StaffForm from "../../components/forms/StaffForm";
import { getMe, User } from "../../services/api";
import { Box } from "@mui/material";

const PersonalInfoPage: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isConsentGiven, setIsConsentGiven] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const me: User = await getMe();
        setUser(me);
      } catch {
        router.push("/login");
      }
    }
    fetchUser();
    setIsConsentGiven(localStorage.getItem("kvkk") === "true");
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
        <Box sx={{ maxWidth: 1100, mx: "auto" }}>
          {user.role === "citizen"   && <CitizenForm user={user} setUser={setUser} />}
          {user.role === "doctor"    && <DoctorForm  user={user} setUser={setUser} />}
          {user.role === "assistant" && <StaffForm   user={user} setUser={setUser} isSubUser />}
        </Box>
      )}
    </Layout>
  );
};

export default PersonalInfoPage;
