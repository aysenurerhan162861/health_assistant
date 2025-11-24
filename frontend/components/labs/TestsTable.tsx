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

            // normal_range'i string olarak al, undefined olabilir
            const range = (data.normal_range || "").trim();

            if (range) {
              let min: number | undefined;
              let max: number | undefined;

              // Parantez içindeki değerleri al (N(...), L(...), vb.)
              const match = range.match(/\((.*)\)/);
              const inside: string = match?.[1] ?? range; // match yoksa range'i kullan

              // "-" varsa min-max olarak ayır
              if (inside.includes("-")) {
                const parts = inside.split("-").map(x => parseFloat(x.trim()));
                min = parts[0];
                max = parts[1];
              } else if (inside.startsWith("<")) {
                max = parseFloat(inside.substring(1));
              } else if (inside.startsWith(">")) {
                min = parseFloat(inside.substring(1));
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
