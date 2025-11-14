import React, { useState } from "react";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
} from "@mui/material";
import TestsTable from "./TestsTable";

interface LabReport {
  id: number;
  file_name: string;
  file_path: string;
  created_at: string;
  parsed_data: Record<string, any>;
}

interface ReportListProps {
  reports: LabReport[];
}

const ReportList: React.FC<ReportListProps> = ({ reports }) => {
  const [selectedReport, setSelectedReport] = useState<LabReport | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handlePreview = (report: LabReport) => {
    setSelectedReport(report);
    setPreviewOpen(true);
  };

  const handleClose = () => {
    setPreviewOpen(false);
    setSelectedReport(null);
  };

  return (
    <Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tarih</TableCell>
              <TableCell>Dosya</TableCell>
              <TableCell>Detay</TableCell>
              <TableCell>Önizleme</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell>{new Date(report.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{report.file_name}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handlePreview(report)}
                  >
                    Göster
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    size="small"
                    href={`http://localhost:8000/${report.file_path}`}
                    target="_blank"
                  >
                    Önizle / İndir
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Detay modal */}
      <Dialog open={previewOpen} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>PDF İçeriği / Test Detayları</DialogTitle>
        <DialogContent>
          {selectedReport ? (
            <TestsTable parsedData={selectedReport.parsed_data} />
          ) : (
            <Typography>Yükleniyor...</Typography>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ReportList;
