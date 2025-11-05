import React from "react";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { Button, Stack, Avatar } from "@mui/material";

export interface Patient {
  id: number;
  name: string;
  phone?: string;
  description?: string;
  photoUrl?: string;
}

interface Props {
  patients: Patient[];
  type: "pending" | "approved";
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
}

const PatientTable: React.FC<Props> = ({ patients, type, onApprove, onReject }) => {
  const columns: GridColDef[] = [
    {
      field: "photo",
      headerName: "Fotoğraf",
      width: 80,
      renderCell: (params: GridRenderCellParams) => (
        <Avatar src={params.row.photoUrl} />
      ),
    },
    { field: "name", headerName: "İsim", flex: 1 },
    { field: "phone", headerName: "Telefon", flex: 1 },
    { field: "description", headerName: "Açıklama", flex: 2 },
  ];

  if (type === "pending") {
    columns.push({
      field: "actions",
      headerName: "İşlemler",
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            color="success"
            size="small"
            onClick={() => onApprove && onApprove(params.row.id)}
          >
            Onayla
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={() => onReject && onReject(params.row.id)}
          >
            Reddet
          </Button>
        </Stack>
      ),
    });
  }

  return (
    <div style={{ height: 400, width: "100%" }}>
      <DataGrid
        rows={patients}
        columns={columns}
        getRowId={(row) => row.id}
        autoHeight
        pageSizeOptions={[5, 10, 20]}
        disableRowSelectionOnClick
      />
    </div>
  );
};

export default PatientTable;
