import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 md:flex-row">
      <AdminSidebar />
      <div className="flex-1 overflow-auto [padding-bottom:env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
