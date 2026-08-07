import type { Metadata } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsightsClient } from "@/components/SpeedInsightsClient";
import { MetaPixel } from "@/components/MetaPixel";
import { rootMetadata } from "@/lib/seo/metadata";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const body = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = rootMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-dvh antialiased">
        {children}
        <Analytics />
        <SpeedInsightsClient />
        <MetaPixel />
      </body>
    </html>
  );
}
