// components/labs/TestsTable.tsx
"use client";
import React from "react";
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Box, Typography,
} from "@mui/material";

interface TestData {
  name: string;
  value: number;
  normal_range?: string;
  unit?: string;
  status?: string;
}

interface TestsTableProps {
  parsedData: { tests: TestData[] };
}

const deriveStatus = (value: number, normal_range?: string): "Normal" | "Düşük" | "Yüksek" => {
  const range = (normal_range || "").trim();
  if (!range) return "Normal";

  const match = range.match(/\((.*)\)/);
  const inside = match?.[1] ?? range;

  let min: number | undefined;
  let max: number | undefined;

  if (inside.includes("-")) {
    const parts = inside.split("-").map((x) => parseFloat(x.trim()));
    min = parts[0];
    max = parts[1];
  } else if (inside.startsWith("<")) {
    max = parseFloat(inside.substring(1));
  } else if (inside.startsWith(">")) {
    min = parseFloat(inside.substring(1));
  }

  if (min !== undefined && value < min) return "Düşük";
  if (max !== undefined && value > max) return "Yüksek";
  return "Normal";
};

const statusStyle = {
  Normal:  { bgcolor: "#e8f5e9", color: "#2e7d32" },
  Düşük:   { bgcolor: "#fff3e0", color: "#e65100" },
  Yüksek:  { bgcolor: "#ffebee", color: "#c62828" },
};

const TestsTable: React.FC<TestsTableProps> = ({ parsedData }) => {
  const tests = parsedData?.tests || [];

  if (tests.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography color="text.secondary">Test verisi bulunamadı.</Typography>
      </Box>
    );
  }

  return (
    <TableContainer sx={{ border: "1px solid #e8edf5", borderRadius: 2, overflow: "hidden" }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "#f8faff" }}>
            {["Test Adı", "Değer", "Referans Aralığı", "Durum", "Birim"].map((h) => (
              <TableCell key={h} sx={{ fontWeight: 700, color: "#0a2d57", borderColor: "#e8edf5" }}>
                {h}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {tests.map((data, idx) => {
            const status = deriveStatus(data.value, data.normal_range);
            const cfg = statusStyle[status];
            return (
              <TableRow
                key={idx}
                sx={{
                  "&:hover": { bgcolor: "#f0f6ff" },
                  bgcolor: status !== "Normal" ? "#fffbf5" : "white",
                }}
              >
                <TableCell sx={{ fontWeight: 500, color: "#1a2e4a", borderColor: "#f0f4fa" }}>
                  {data.name}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: cfg.color, borderColor: "#f0f4fa" }}>
                  {data.value}
                </TableCell>
                <TableCell sx={{ color: "#6b7a90", borderColor: "#f0f4fa" }}>
                  {data.normal_range || "—"}
                </TableCell>
                <TableCell sx={{ borderColor: "#f0f4fa" }}>
                  <Chip
                    label={status}
                    size="small"
                    sx={{ bgcolor: cfg.bgcolor, color: cfg.color, fontWeight: 600, fontSize: 11 }}
                  />
                </TableCell>
                <TableCell sx={{ color: "#6b7a90", borderColor: "#f0f4fa" }}>
                  {data.unit || "—"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TestsTable;
