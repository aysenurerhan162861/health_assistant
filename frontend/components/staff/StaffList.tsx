// components/staff/StaffList.tsx
import React from "react";
import { Box, Paper, Typography, Button, Stack } from "@mui/material";
import { User } from "../../services/api";

interface Props {
  staffMembers: User[];
  onRemove: (memberId: number) => void;
}

const StaffList: React.FC<Props> = ({ staffMembers, onRemove }) => {
  if (staffMembers.length === 0) {
    return <Typography>Henüz alt kullanıcı eklenmemiş.</Typography>;
  }

  return (
    <Stack spacing={1}>
      {staffMembers.map((staff) => (
        <Paper
          key={staff.id}
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor: "#f1f5ff",
            borderRadius: 2,
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 600 }}>{staff.name}</Typography>
            <Typography variant="body2">{staff.email}</Typography>
            <Typography variant="body2">{staff.role}</Typography>
          </Box>
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={() => onRemove(staff.id)}
          >
            Sil
          </Button>
        </Paper>
      ))}
    </Stack>
  );
};

export default StaffList;
