import type { AppProps } from "next/app";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "../theme/theme";
import { useEffect } from "react";
import { requestFirebaseNotificationPermission } from "../firebase";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Service Worker kaydı
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then((registration) => {
          console.log("Service Worker registered:", registration);
        })
        .catch((err) => console.log("Service Worker failed:", err));
    }

    // FCM token alma
    requestFirebaseNotificationPermission()
      .then((token) => {
        if (token) console.log("FCM token:", token);
        else console.log("Token alınamadı veya izin verilmedi.");
      })
      .catch((err) => console.log("Token alma hatası:", err));
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
