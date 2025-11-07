// components/users/UserTable.tsx
import React, { useMemo, useState } from "react";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { Box, Stack, IconButton, TextField, MenuItem, Typography, Paper } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { User } from "../../services/api";

export interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete?: (userId: number) => void;
}

const UserTable: React.FC<UserTableProps> = ({ users, onEdit, onDelete }) => {
  const [filterText, setFilterText] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"name" | "email" | "role">("name");
  const filterOptions = ["name", "email", "role"] as const;
  const primaryColor = "#0a2d57";

  const filteredUsers = useMemo(() => {
    if (!filterText) return users;
    return users.filter((user) =>
      (user[selectedFilter] || "")
        .toString()
        .toLowerCase()
        .includes(filterText.toLowerCase())
    );
  }, [users, filterText, selectedFilter]);

  const columns: GridColDef[] = [
    { field: "name", headerName: "Ad Soyad", flex: 1 },
    { field: "email", headerName: "E-posta", flex: 1.5 },
    { field: "role", headerName: "Rol", flex: 1 },
    {
      field: "actions",
      headerName: "İşlemler",
      flex: 1,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" spacing={1}>
          <IconButton size="small" color="primary" onClick={() => onEdit(params.row)}>
            <EditIcon />
          </IconButton>
          {onDelete && (
            <IconButton size="small" color="error" onClick={() => onDelete(params.row.id)}>
              <DeleteIcon />
            </IconButton>
          )}
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ p: 4, minHeight: "100vh" }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold", color: primaryColor }}>
        Kullanıcı Yönetimi
      </Typography>

      {/* Filtreleme */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={2}>
        <TextField
          select
          label="Filtre Alanı"
          size="small"
          variant="outlined"
          value={selectedFilter}
          onChange={(e) => setSelectedFilter(e.target.value as "name" | "email" | "role")}
          sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
        >
          {filterOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Ara..."
          variant="outlined"
          size="small"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          sx={{ flex: 1, "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
        />
      </Stack>

      {/* Tablo */}
      <Paper elevation={4} sx={{ p: 2, borderRadius: 2 }}>
        <Box sx={{ height: 500, width: "100%" }}>
          <DataGrid
            rows={filteredUsers}
            columns={columns}
            getRowId={(row) => row.id}
            autoHeight
            disableRowSelectionOnClick
            pageSizeOptions={[5, 10, 20]}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default UserTable;
