import React, { useState } from "react";
import { Box, Paper, Typography, Button, Stack } from "@mui/material";
import { User } from "../../types/Staff";
import StaffCardModal from "./StaffCardModal";
import StaffFileUpload from "./StaffFileUpload";

interface Props {
  staffMembers: User[];
  onRemove: (memberId: number) => void;
}

const StaffList: React.FC<Props> = ({ staffMembers, onRemove }) => {
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);

  if (staffMembers.length === 0) return <Typography>Henüz alt kullanıcı eklenmemiş.</Typography>;

  return (
    <>
      <Stack spacing={2}>
        {staffMembers.map((staff) => (
          <Paper
            key={staff.id}
            sx={{
              p: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
              bgcolor: "#f1f5ff",
              "&:hover": { bgcolor: "#e3ebff" },
            }}
            onClick={() => {
              console.log("Paper clicked:", staff.name);
              setSelectedStaff(staff);
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
              onClick={(e) => {
                e.stopPropagation();
                onRemove(staff.id);
              }}
            >
              Sil
            </Button>
          </Paper>
        ))}
      </Stack>

      <StaffCardModal staff={selectedStaff} onClose={() => setSelectedStaff(null)} />
    </>
  );
};

export default StaffList;
