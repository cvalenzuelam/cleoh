import type { Metadata, Viewport } from "next";
import { AdminInstallHint } from "@/components/admin/AdminInstallHint";

export const viewport: Viewport = {
  themeColor: "#18181b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "Cleoh Admin",
    template: "%s | Cleoh Admin",
  },
  description: "Panel de administración de Cleoh.",
  applicationName: "Cleoh Admin",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Cleoh Admin",
  },
  formatDetection: {
    telephone: false,
  },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AdminInstallHint />
      {children}
    </>
  );
}
