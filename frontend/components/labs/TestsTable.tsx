import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  TableContainer,
} from "@mui/material";

interface TestsTableProps {
  parsedData: Record<string, { value: number; normal_range: string }>;
}


const TestsTable: React.FC<TestsTableProps> = ({ parsedData }) => (
  <Table>
    <TableHead>
      <TableRow>
        <TableCell>Test</TableCell>
        <TableCell>Değer</TableCell>
        <TableCell>Normal Aralık</TableCell>
        <TableCell>Durum</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {Object.entries(parsedData).map(([name, data]) => (
        <TableRow key={name}>
          <TableCell>{name}</TableCell>
          <TableCell>{data.value}</TableCell>
          <TableCell>{data.normal_range}</TableCell>
          <TableCell>
            {data.value >= Number(data.normal_range.split("-")[0]) &&
            data.value <= Number(data.normal_range.split("-")[1])
              ? "Normal"
              : "Anormal"}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

export default TestsTable;
