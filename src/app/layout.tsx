import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/misc";
import { env } from "@/lib/env";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(env.SITE_URL),
  title: {
    default: "AquaVision AI — Monitor water bodies with computer vision",
    template: "%s · AquaVision AI",
  },
  description:
    "Upload a photograph of any river, lake or reservoir. AquaVision AI scores its environmental condition in seconds, tracks how it changes over time, and maps every finding — no sensors, no hardware.",
  keywords: [
    "water quality monitoring",
    "AI water analysis",
    "computer vision environment",
    "pollution detection",
    "citizen science",
    "river monitoring",
    "environmental AI",
  ],
  openGraph: {
    type: "website",
    title: "AquaVision AI — Intelligent water body monitoring",
    description:
      "Computer vision that turns a single photograph into a defensible environmental assessment. Score, trend and map every water body.",
    siteName: "AquaVision AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "AquaVision AI",
    description:
      "Turn a photograph of any water body into an environmental assessment in seconds.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#25303f",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="min-h-dvh antialiased">
        {/* Keyboard users land here first — one tab to reach the content. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-aqua-400 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink-950"
        >
          Skip to main content
        </a>

        <TooltipProvider delayDuration={220}>{children}</TooltipProvider>

        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "oklch(0.205 0.017 258 / 0.94)",
              border: "1px solid oklch(1 0 0 / 0.12)",
              color: "oklch(0.935 0.007 258)",
              backdropFilter: "blur(20px)",
              borderRadius: "14px",
            },
          }}
        />
      </body>
    </html>
  );
}
