"use client";
import { useEffect, useState } from "react";
import Layout from "../../../components/layout/Layout";
import AssistantPatients from "../../../components/assistant/AssistantPatients";

const AssistantPatientsPage = () => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);
  if (!isClient) return null;

  return (
    <Layout>
      <AssistantPatients />
    </Layout>
  );
};

export default AssistantPatientsPage;
