import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Avatar,
  Typography,
  CircularProgress,
} from "@mui/material";
import { User } from "../../types/Staff";
import StaffFileUpload from "./StaffFileUpload";
import { getStaffMember } from "../../services/StaffApi"; // 🔹 ekledik

interface Props {
  staff: User | null;
  onClose: () => void;
}

export default function StaffCardModal({ staff, onClose }: Props) {
  const [staffData, setStaffData] = useState<User | null>(staff);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStaff = async () => {
      if (staff) {
        try {
          setLoading(true);
          const updatedStaff = await getStaffMember(staff.id); // 🔹 API'den güncel veri çek
          setStaffData(updatedStaff);
        } catch (err) {
          console.error("Kullanıcı bilgisi alınamadı:", err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchStaff();
  }, [staff]); // her staff değişiminde (veya kart her açıldığında) çağrılır

  if (!staffData) return null;

  return (
    <Dialog open={!!staff} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{staffData.name} - Bilgiler</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Avatar src={staffData.photoUrl ?? ""} sx={{ width: 80, height: 80 }} />
            <Typography>Email: {staffData.email}</Typography>
            <Typography>Role: {staffData.role}</Typography>
            <Typography>Telefon: {staffData.phone || "-"}</Typography>
            <Typography>Doğum Tarihi: {staffData.birth_date || "-"}</Typography>
            <Typography>Cinsiyet: {staffData.gender || "-"}</Typography>
            <Typography>Kan Grubu: {staffData.blood_type || "-"}</Typography>
            <Typography>Şehir: {staffData.city || "-"}</Typography>
            <Typography>İlçe: {staffData.district || "-"}</Typography>
            <Typography>Mahalle: {staffData.neighborhood || "-"}</Typography>

            {/* Dosya yükleme */}
            <StaffFileUpload staffId={staffData.id} />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
