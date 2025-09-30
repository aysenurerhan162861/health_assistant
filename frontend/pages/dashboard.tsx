import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import DashboardCard from "../components/forms/DashboardCard";

interface User {
  name: string;
  email: string;
  role: string;
}

const Dashboard: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.push("/login"); // login değilse yönlendir
    }
  }, [router]);

  if (!user) return <p>Yükleniyor...</p>;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
      <h1>Dashboard</h1>
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", justifyContent: "center", marginTop: "20px" }}>
        <DashboardCard title="Adınız" value={user.name} />
        <DashboardCard title="Email" value={user.email} />
        <DashboardCard 
          title="Kullanıcı Tipi" 
          value={user.role === "citizen" ? "Vatandaş" : "Doktor / Klinisyen"} 
        />
      </div>
    </div>
  );
};

export default Dashboard;
