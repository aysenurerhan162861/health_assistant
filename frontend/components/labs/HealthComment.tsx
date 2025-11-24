"use client";

import { useState, useEffect } from "react";
import { fetchGeminiComment, TestResult } from "../../services/GeminiApi";
import { Box, Typography } from "@mui/material";

interface Props {
  testResults: TestResult[];
}

const HealthComment: React.FC<Props> = ({ testResults }) => {
  const [comment, setComment] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComment = async () => {
      try {
        const result = await fetchGeminiComment(testResults);
        setComment(result);
      } catch (err) {
        console.error(err);
        setComment("Yorum alınamadı.");
      } finally {
        setLoading(false);
      }
    };

    fetchComment();
  }, [testResults]);

  return (
    <Box sx={{ mt: 2 }}>
      {loading ? (
        <Typography>Yorum yükleniyor...</Typography>
      ) : (
        <Typography sx={{ whiteSpace: "pre-line" }}>
          {comment}
        </Typography>
      )}
    </Box>
  );
};

export default HealthComment;
