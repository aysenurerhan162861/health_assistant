"use client";
import { useEffect, useState } from "react";
import Layout from "../../../components/layout/Layout";
import PendingPatients from "../../../components/patients/PendingPatients";

const PendingPatientsPage = () => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);
  if (!isClient) return null;

  return (
    <Layout>
      <PendingPatients />
    </Layout>
  );
};

export default PendingPatientsPage;
