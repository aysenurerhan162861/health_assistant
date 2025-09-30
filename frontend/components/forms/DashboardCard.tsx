import React from "react";

interface DashboardCardProps {
  title: string;
  value: string | number;
  description?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, description }) => {
  return (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: "8px",
        padding: "16px",
        minWidth: "200px",
        textAlign: "center",
        boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
      }}
    >
      <h3>{title}</h3>
      <p style={{ fontSize: "24px", fontWeight: "bold" }}>{value}</p>
      {description && <small>{description}</small>}
    </div>
  );
};

export default DashboardCard;
