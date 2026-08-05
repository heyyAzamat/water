import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/misc";
import { env } from "@/lib/env";
import { LOCALE_META } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { I18nProvider } from "@/lib/i18n/provider";
import "./globals.css";

const inter = Inter({
  // Cyrillic is a first-class script here: the UI ships in Russian and Kazakh.
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();

  return {
    metadataBase: new URL(env.SITE_URL),
    title: {
      default: t.meta.title,
      template: t.meta.titleTemplate,
    },
    description: t.meta.description,
    keywords: [
      "water quality monitoring",
      "AI water analysis",
      "computer vision environment",
      "pollution detection",
      "citizen science",
      "мониторинг качества воды",
      "анализ воды ИИ",
      "су сапасын бақылау",
    ],
    openGraph: {
      type: "website",
      title: t.meta.title,
      description: t.meta.description,
      siteName: "AquaVision AI",
    },
    twitter: {
      card: "summary_large_image",
      title: "AquaVision AI",
      description: t.meta.description,
    },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: "#05070c",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { locale, t } = await getI18n();

  return (
    <html
      lang={LOCALE_META[locale].htmlLang}
      className={`${inter.variable} ${jetbrains.variable}`}
    >
      <body className="min-h-dvh antialiased">
        {/* Keyboard users land here first — one tab to reach the content. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-lume-400 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-abyss-1000"
        >
          {t.common.skipToContent}
        </a>

        <I18nProvider locale={locale}>
          <TooltipProvider delayDuration={220}>{children}</TooltipProvider>
        </I18nProvider>

        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "oklch(0.098 0.02 250 / 0.94)",
              border: "1px solid oklch(1 0 0 / 0.14)",
              color: "oklch(0.945 0.008 240)",
              backdropFilter: "blur(20px)",
              borderRadius: "14px",
            },
          }}
        />
      </body>
    </html>
  );
}
