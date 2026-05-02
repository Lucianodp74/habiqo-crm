import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "HABIQO — Smart living. Smart real estate.",
    template: "%s · HABIQO",
  },
  description:
    "La piattaforma AI per agenzie immobiliari italiane. CRM, valutazione, voice AI e generazione contenuti in un unico prodotto.",
  applicationName: "HABIQO",
  authors: [{ name: "HABIQO" }],
  generator: "Next.js",
  keywords: ["immobiliare", "CRM", "AI", "valutazione immobiliare", "agenzia immobiliare"],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "it_IT",
    siteName: "HABIQO",
  },
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
        <AppProviders>{children}</AppProviders>
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
