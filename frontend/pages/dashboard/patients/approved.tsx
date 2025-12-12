"use client"; // sayfanın sadece client-side çalışmasını sağlar

import React from "react";
import ApprovedPatients from "../../../components/patients/ApprovedPatients";
import Navbar from "../../../components/layout/Navbar";
import Sidebar from "../../../components/layout/Sidebar";

const ApprovedPatientsPage = () => {
  return (
    <>
      <Navbar />
      <Sidebar />
      <div style={{ marginLeft: 260, marginTop: 80, padding: "20px" }}>
        <ApprovedPatients />
      </div>
    </>
  );
};

export default ApprovedPatientsPage;
