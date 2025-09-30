import React from "react";
import Link from "next/link";
import { Container, Button, Typography } from "@mui/material";

export default function HomePage() {
  return (
    <Container
      maxWidth="sm"
      style={{ textAlign: "center", marginTop: "100px" }}
    >
      <Typography variant="h3" gutterBottom>
        Welcome to Health Assistant
      </Typography>
      <Typography variant="body1" gutterBottom>
        Please login or register to continue
      </Typography>
      <div style={{ marginTop: "30px" }}>
        <Link href="/login" passHref>
          <Button variant="contained" color="primary" style={{ marginRight: 10 }}>
            Login
          </Button>
        </Link>
        <Link href="/register" passHref>
          <Button variant="outlined" color="primary">
            Register
          </Button>
        </Link>
      </div>
    </Container>
  );
}
