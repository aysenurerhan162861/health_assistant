import React from "react";
import { NotificationSetting } from "@/types/Notification";
import { Box, Typography, Switch, Stack } from "@mui/material";

interface Props {
  setting: NotificationSetting;
  onChange: (field: "push" | "email", value: boolean) => void;
}

const NotificationSettingCard: React.FC<Props> = ({ setting, onChange }) => {
  return (
    <Box
      sx={{
        p: 2,
        border: "1px solid #ddd",
        borderRadius: 2,
        mb: 2,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Typography variant="body1">{setting.event_name}</Typography>
      <Stack direction="row" spacing={2}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Typography variant="caption">Push</Typography>
          <Switch
            checked={setting.push_enabled}
            onChange={(e) => onChange("push", e.target.checked)}
          />
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Typography variant="caption">Email</Typography>
          <Switch
            checked={setting.email_enabled}
            onChange={(e) => onChange("email", e.target.checked)}
          />
        </Stack>
      </Stack>
    </Box>
  );
};

export default NotificationSettingCard;
