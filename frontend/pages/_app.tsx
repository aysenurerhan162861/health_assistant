import type { AppProps } from "next/app";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "../theme/theme";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
