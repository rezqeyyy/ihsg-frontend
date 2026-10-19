import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppStateProvider } from "@/components/AppState";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { themeInitScript } from "@/components/ThemeToggle";
import { I18nProvider, langInitScript } from "@/lib/i18n";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });

export const metadata: Metadata = {
  title: "IHSG Opening Estimator",
  description: "Estimasi nilai pembukaan IHSG dari sinyal pra-pasar indeks Asia dan ETF Indonesia di bursa AS. / IHSG opening estimate from pre-market signals of Asian indices and U.S.-listed Indonesia ETFs.",
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
    // suppressHydrationWarning: the init scripts may set data-theme / lang before React hydrates
    <html lang="id" className={jakarta.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript + langInitScript }} />
      </head>
      <body>
        <I18nProvider>
          <AppStateProvider>
            <Nav />
            <main>{children}</main>
            <Footer />
          </AppStateProvider>
        </I18nProvider>
      </body>
    </html>
  );
}