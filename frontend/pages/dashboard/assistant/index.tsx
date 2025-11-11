// pages/dashboard/assistant/index.tsx
import React, { useEffect, useState } from "react";
import Navbar from "../../../components/layout/Navbar";
import Sidebar from "../../../components/layout/Sidebar";
import AssistantPatients from "../../../components/assistant/AssistantPatients";

const AssistantPatientsPage: React.FC = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // localStorage sadece client tarafında var
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <>
      <Navbar />
      <Sidebar />
      <div style={{ marginLeft: 260, marginTop: 80, padding: 20 }}>
        <AssistantPatients />
      </div>
    </>
  );
};

export default AssistantPatientsPage;
