"use client"; // sayfanın sadece client-side çalışmasını sağlar

import React from "react";
import PendingPatients from "../../../components/patients/PendingPatients";
import Navbar from "../../../components/layout/Navbar";
import Sidebar from "../../../components/layout/Sidebar";

const PendingPatientsPage = () => {
  return (
    <>
      <Navbar />
      <Sidebar />
      <div style={{ marginLeft: 260, marginTop: 80, padding: "20px" }}>
        <PendingPatients />
      </div>
    </>
  );
};

export default PendingPatientsPage;
