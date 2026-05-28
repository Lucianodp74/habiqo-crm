import { AppProviders } from "@/components/providers/app-providers";
import { ThemeProvider } from "@/components/providers/theme-provider";
import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://habiquo.com"),
  title: {
    default: "Habiquo — Smart living. Smart real estate.",
    template: "%s · Habiquo",
  },
  description: "L'unica piattaforma di cui un'agenzia immobiliare ha bisogno.",
  applicationName: "Habiquo",
  authors: [{ name: "Habiquo" }],
  generator: "Next.js",
  keywords: ["immobiliare", "CRM", "AI", "valutazione immobiliare", "agenzia immobiliare"],
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    locale: "it_IT",
    siteName: "Habiquo",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#f6f2e9",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        {/* Fonts loaded directly to keep the design system independent
            of next/font (which couples to the app build). */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=Geist:wght@300..700&family=Geist+Mono:wght@400;500&display=swap"
        />
      </head>
      <body className="transition-colors duration-300">
        <ThemeProvider storageKey="habiquo-theme">
          <AppProviders>{children}</AppProviders>
        </ThemeProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--color-onyx-900)",
              color: "var(--color-surface)",
              border: "1px solid var(--color-onyx-800)",
              fontFamily: "var(--font-sans)",
              fontSize: "13px",
            },
          }}
        />
      </body>
    </html>
  );
}
