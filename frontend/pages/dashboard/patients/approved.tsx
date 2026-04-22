"use client";
import { useEffect, useState } from "react";
import Layout from "../../../components/layout/Layout";
import ApprovedPatients from "../../../components/patients/ApprovedPatients";

const ApprovedPatientsPage = () => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);
  if (!isClient) return null;

  return (
    <Layout>
      <ApprovedPatients />
    </Layout>
  );
};

export default ApprovedPatientsPage;
