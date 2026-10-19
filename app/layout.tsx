import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppStateProvider } from "@/components/AppState";
import Nav from "@/components/Nav";
import { themeInitScript } from "@/components/ThemeToggle";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });

export const metadata: Metadata = {
  title: "IHSG Opening Estimator",
  description: "Estimasi nilai pembukaan IHSG dari sinyal pra-pasar indeks Asia dan ETF Indonesia di bursa AS.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#19232f" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the theme script may add data-theme before React hydrates
    <html lang="id" className={jakarta.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <AppStateProvider>
          <Nav />
          <main>{children}</main>
          <footer className="site">
            Estimasi dihasilkan model statistik (Random Forest &amp; XGBoost) untuk keperluan penelitian.
            Ini informasi, bukan saran investasi. Data: Yahoo Finance.
          </footer>
        </AppStateProvider>
      </body>
    </html>
  );
}