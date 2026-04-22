import React, { useState, useEffect, useMemo } from "react";
import {
  Box, Card, Typography, Button, Stack, TextField, MenuItem,
  Snackbar, Alert, IconButton, Chip, InputAdornment, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar,
} from "@mui/material";
import AddIcon         from "@mui/icons-material/Add";
import EditIcon        from "@mui/icons-material/Edit";
import DeleteIcon      from "@mui/icons-material/Delete";
import SearchIcon      from "@mui/icons-material/Search";
import PeopleIcon      from "@mui/icons-material/People";
import CloseIcon       from "@mui/icons-material/Close";
import SendIcon        from "@mui/icons-material/Send";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

import {
  User, getMyStaff, addTeamMember, updateTeamMember,
  removeTeamMember, resendStaffMail,
} from "../../services/api";
import Layout from "../../components/layout/Layout";
import AssistantPermissionManager from "../../components/assistant/AssistantPermissionManager";

const ROLE_CFG: Record<string, { label: string; bgcolor: string; color: string }> = {
  assistant: { label: "Asistan",  bgcolor: "#e3f0ff", color: "#1565c0" },
  sekreter:  { label: "Sekreter", bgcolor: "#f3e5f5", color: "#6a1b9a" },
};

const getRoleCfg = (role: string) =>
  ROLE_CFG[role] ?? { label: role, bgcolor: "#e8edf5", color: "#0a2d57" };

const initials = (name?: string) =>
  (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

const UserManagementPage: React.FC = () => {
  const [staffMembers, setStaffMembers]   = useState<User[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);
  const [formOpen, setFormOpen]           = useState(false);
  const [formMode, setFormMode]           = useState<"add" | "edit">("add");
  const [teamData, setTeamData]           = useState({ name: "", email: "", role: "assistant" as "assistant" | "sekreter" });
  const [snackbar, setSnackbar]           = useState<{ open: boolean; message: string; severity: "success" | "error" | "info" }>({ open: false, message: "", severity: "info" });
  const [loadingMail, setLoadingMail]     = useState(false);
  const [search, setSearch]              = useState("");
  const [submitting, setSubmitting]      = useState(false);

  const fetchStaff = async () => {
    try {
      setStaffMembers(await getMyStaff());
    } catch {
      setSnackbar({ open: true, message: "Kullanıcılar alınamadı", severity: "error" });
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  const openAdd = () => {
    setFormMode("add");
    setSelectedStaff(null);
    setTeamData({ name: "", email: "", role: "assistant" });
    setFormOpen(true);
  };

  const openEdit = (staff: User) => {
    setFormMode("edit");
    setSelectedStaff(staff);
    setTeamData({ name: staff.name || "", email: staff.email || "", role: (staff.role as "assistant" | "sekreter") || "assistant" });
    setFormOpen(true);
  };

  const closeForm = () => { setFormOpen(false); setSelectedStaff(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (formMode === "edit" && selectedStaff) {
        await updateTeamMember(selectedStaff.id, teamData);
        setSnackbar({ open: true, message: "Kullanıcı güncellendi", severity: "success" });
      } else {
        await addTeamMember(teamData);
        setSnackbar({ open: true, message: "Kullanıcı eklendi", severity: "success" });
      }
      closeForm();
      fetchStaff();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || "İşlem başarısız", severity: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id: number) => {
    if (!window.confirm("Bu kullanıcıyı silmek istiyor musunuz?")) return;
    try {
      await removeTeamMember(id);
      setStaffMembers((prev) => prev.filter((s) => s.id !== id));
      setSnackbar({ open: true, message: "Kullanıcı silindi", severity: "success" });
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || "Silinemedi", severity: "error" });
    }
  };

  const handleResendMail = async () => {
    if (!selectedStaff) return;
    setLoadingMail(true);
    try {
      const res = await resendStaffMail(selectedStaff.id);
      setSnackbar({ open: true, message: res.message || "Mail gönderildi", severity: "success" });
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || "Mail gönderilemedi", severity: "error" });
    } finally {
      setLoadingMail(false);
    }
  };

  const filtered = useMemo(() =>
    staffMembers.filter((s) =>
      !search ||
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase())
    ), [staffMembers, search]);

  return (
    <Layout>
      <Box>
        {/* Başlık */}
        <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            <Typography variant="h5" fontWeight={700} color="#0a2d57">Kullanıcı Yönetimi</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Ekibinizdeki asistan ve sekreterleri yönetin
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Chip
              icon={<PeopleIcon fontSize="small" />}
              label={`${filtered.length} kullanıcı`}
              sx={{ bgcolor: "#e3f0ff", color: "#1565c0", fontWeight: 600 }}
            />
            <Button
              variant="contained" startIcon={<AddIcon />}
              onClick={openAdd}
              sx={{ bgcolor: "#0a2d57", "&:hover": { bgcolor: "#071d3c" }, borderRadius: 2 }}
            >
              Yeni Kullanıcı
            </Button>
          </Stack>
        </Box>

        {/* Arama */}
        <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2, p: 2, mb: 2 }}>
          <TextField
            size="small" fullWidth placeholder="Ad veya e-posta ile ara..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: "#9aa5b4" }} />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Card>

        {/* Kullanıcı listesi */}
        {filtered.length === 0 ? (
          <Box sx={{ py: 10, textAlign: "center" }}>
            <PeopleIcon sx={{ fontSize: 44, color: "#d0d7e3", mb: 1.5 }} />
            <Typography color="text.secondary">
              {staffMembers.length === 0 ? "Henüz kullanıcı eklenmemiş." : "Eşleşen kullanıcı bulunamadı."}
            </Typography>
          </Box>
        ) : (
          <Card elevation={0} sx={{ border: "1px solid #e8edf5", borderRadius: 2, overflow: "hidden", mb: 3 }}>
            {/* Başlık satırı */}
            <Box sx={{
              px: 2.5, py: 1.5, bgcolor: "#f8faff",
              borderBottom: "1px solid #e8edf5",
              display: "grid", gridTemplateColumns: "2fr 2fr 1fr auto", gap: 1,
            }}>
              {["Ad Soyad", "E-posta", "Rol", ""].map((h) => (
                <Typography key={h} variant="caption" fontWeight={700} color="#6b7a90"
                  sx={{ textTransform: "uppercase", letterSpacing: 0.6 }}>
                  {h}
                </Typography>
              ))}
            </Box>

            <Stack divider={<Divider sx={{ borderColor: "#f0f4fa" }} />}>
              {filtered.map((staff) => {
                const cfg = getRoleCfg(staff.role || "");
                return (
                  <Box key={staff.id} sx={{
                    px: 2.5, py: 1.75,
                    display: "grid", gridTemplateColumns: "2fr 2fr 1fr auto", gap: 1,
                    alignItems: "center",
                    "&:hover": { bgcolor: "#fafbff" },
                    transition: "background .15s",
                  }}>
                    {/* Ad Soyad */}
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Avatar sx={{ width: 36, height: 36, bgcolor: cfg.bgcolor, color: cfg.color, fontSize: 13, fontWeight: 700 }}>
                        {initials(staff.name)}
                      </Avatar>
                      <Typography variant="body2" fontWeight={600} color="#1a2e4a" noWrap>
                        {staff.name || "—"}
                      </Typography>
                    </Stack>

                    {/* E-posta */}
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {staff.email || "—"}
                    </Typography>

                    {/* Rol */}
                    <Chip
                      label={cfg.label}
                      size="small"
                      sx={{ bgcolor: cfg.bgcolor, color: cfg.color, fontWeight: 600, fontSize: 11 }}
                    />

                    {/* Aksiyonlar */}
                    <Stack direction="row" spacing={0.5} flexShrink={0}>
                      <IconButton
                        size="small" onClick={() => openEdit(staff)}
                        sx={{ color: "#6b7a90", "&:hover": { color: "#0a2d57", bgcolor: "#f0f6ff" } }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small" onClick={() => handleRemove(staff.id)}
                        sx={{ color: "#6b7a90", "&:hover": { color: "#c62828", bgcolor: "#ffebee" } }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </Card>
        )}

        {/* Asistan İzin Yönetimi */}
        <AssistantPermissionManager />

        {/* Ekle / Düzenle Dialog */}
        <Dialog
          open={formOpen} onClose={closeForm}
          fullWidth maxWidth="sm"
          slotProps={{ paper: { sx: { borderRadius: 3 } } }}
        >
          <DialogTitle sx={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            borderBottom: "1px solid #e8edf5", pb: 1.5,
          }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <AdminPanelSettingsIcon sx={{ color: "#0a2d57" }} />
              <Typography fontWeight={700} color="#0a2d57">
                {formMode === "add" ? "Yeni Kullanıcı Ekle" : "Kullanıcıyı Düzenle"}
              </Typography>
            </Stack>
            <IconButton size="small" onClick={closeForm} sx={{ color: "#9aa5b4" }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>

          <form onSubmit={handleSubmit}>
            <DialogContent sx={{ pt: 3 }}>
              <Stack spacing={2.5}>
                <TextField
                  label="Ad Soyad" required size="small" fullWidth
                  value={teamData.name}
                  onChange={(e) => setTeamData((d) => ({ ...d, name: e.target.value }))}
                />
                <TextField
                  label="E-posta" required size="small" fullWidth type="email"
                  value={teamData.email}
                  onChange={(e) => setTeamData((d) => ({ ...d, email: e.target.value }))}
                  disabled={formMode === "edit"}
                />
                <TextField
                  select label="Rol" size="small" fullWidth
                  value={teamData.role}
                  onChange={(e) => setTeamData((d) => ({ ...d, role: e.target.value as "assistant" | "sekreter" }))}
                >
                  <MenuItem value="assistant">Asistan</MenuItem>
                </TextField>
              </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
              {formMode === "edit" && (
                <Button
                  variant="outlined" startIcon={<SendIcon fontSize="small" />}
                  onClick={handleResendMail} disabled={loadingMail}
                  sx={{ borderColor: "#d0d7e3", color: "#6b7a90", mr: "auto",
                    "&:hover": { borderColor: "#0a2d57", color: "#0a2d57" } }}
                >
                  {loadingMail ? "Gönderiliyor..." : "Mail Gönder"}
                </Button>
              )}
              <Button onClick={closeForm} sx={{ color: "#6b7a90" }}>İptal</Button>
              <Button
                type="submit" variant="contained" disabled={submitting}
                sx={{ bgcolor: "#0a2d57", "&:hover": { bgcolor: "#071d3c" } }}
              >
                {submitting ? "..." : formMode === "add" ? "Ekle" : "Güncelle"}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        <Snackbar open={snackbar.open} autoHideDuration={4000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
          <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
};

export default UserManagementPage;
