"use client";
import { Box, Paper, Typography } from "@mui/material";
import { ChatMessage } from "@/types/Chat";

interface Props {
  message: ChatMessage;
}

const MessageBubble = ({ message }: Props) => {
  const isUser = message.sender === "user";

  return (
    <Box
      display="flex"
      justifyContent={isUser ? "flex-end" : "flex-start"}
      mb={1}
    >
      <Paper
        sx={{
          p: 1.5,
          maxWidth: "70%",
          bgcolor: isUser ? "primary.main" : "grey.200",
          color: isUser ? "white" : "black",
        }}
      >
        <Typography variant="body1">{message.content}</Typography>
      </Paper>
    </Box>
  );
};

export default MessageBubble;
