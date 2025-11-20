// components/labs/TestsTable.tsx
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";

interface TestData {
  name: string;
  value: number;
  normal_range?: string;
  unit?: string;
  status?: string; // backend'den gelen
}

interface TestsTableProps {
  parsedData: {
    tests: TestData[];
  };
}

const TestsTable: React.FC<TestsTableProps> = ({ parsedData }) => {
  const testArray = parsedData.tests || [];

  // Duruma göre renk verme helper fonksiyonu
  const getColor = (status: string) => {
    if (status === "Düşük" || status === "Yüksek") return "red";
    return "green";
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Test Adı</TableCell>
            <TableCell>Değer</TableCell>
            <TableCell>Referans Aralığı</TableCell>
            <TableCell>Durum</TableCell>
            <TableCell>Birim</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {testArray.map((data, idx) => {
            let status = "Normal";

            const range = data.normal_range?.trim();

            if (range) {
              let min: number | undefined;
              let max: number | undefined;

              if (range.includes("-")) {
                const parts = range.split("-").map(Number);
                min = parts[0];
                max = parts[1];
              } else if (range.startsWith("<")) {
                max = Number(range.substring(1));
              } else if (range.startsWith(">")) {
                min = Number(range.substring(1));
              }

              if (min !== undefined && data.value < min) status = "Düşük";
              else if (max !== undefined && data.value > max) status = "Yüksek";
            }

            return (
              <TableRow key={idx}>
                <TableCell>{data.name}</TableCell>

                <TableCell style={{ color: getColor(status), fontWeight: "bold" }}>
                  {data.value}
                </TableCell>

                <TableCell>{data.normal_range || "-"}</TableCell>

                <TableCell style={{ color: getColor(status), fontWeight: "bold" }}>
                  {status}
                </TableCell>

                <TableCell>{data.unit}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TestsTable;
