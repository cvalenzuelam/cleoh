import Link from "next/link";
import { logoutAdmin } from "@/app/admin/actions";
import {
  IconChartBar,
  IconGrid,
  IconImage,
  IconLayers,
  IconMail,
  IconReceipt,
  IconTag,
  IconTicket,
  IconTruck,
} from "@/components/admin/icons";
import { adminNav } from "@/data/admin";

const NAV_ICONS: Record<string, (props: { className?: string }) => React.ReactElement> = {
  "/admin": IconGrid,
  "/admin/analiticas": IconChartBar,
  "/admin/productos": IconTag,
  "/admin/pedidos": IconReceipt,
  "/admin/cupones": IconTicket,
  "/admin/newsletter": IconMail,
  "/admin/categorias": IconLayers,
  "/admin/apariencia": IconImage,
  "/admin/envios": IconTruck,
};

export function AdminSidebar() {
  return (
    <aside className="flex w-full flex-col border-b border-zinc-200 bg-zinc-950 text-zinc-100 md:w-56 md:border-b-0 md:border-r md:border-zinc-800 [padding-top:env(safe-area-inset-top)]">
      <div className="flex items-center justify-between gap-3 px-4 py-4 md:block">
        <Link href="/admin" className="text-sm font-semibold tracking-wide">
          Cleoh Admin
        </Link>
        <div className="flex items-center gap-3 md:mt-2 md:block">
          <Link
            href="/"
            className="text-xs text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline"
          >
            Ver tienda
          </Link>
          <form action={logoutAdmin} className="md:hidden">
            <button
              type="submit"
              className="text-xs text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline"
            >
              Salir
            </button>
          </form>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-2 pb-3 md:flex-col md:overflow-visible md:px-2 md:pb-6">
        {adminNav.map((item) => {
          const Icon = NAV_ICONS[item.href];
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              {Icon && <Icon className="h-4 w-4 shrink-0 text-zinc-400" />}
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto hidden space-y-3 px-4 pb-4 md:block">
        <form action={logoutAdmin}>
          <button
            type="submit"
            className="text-xs text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline"
          >
            Cerrar sesión
          </button>
        </form>
        <p className="text-[0.65rem] leading-relaxed text-zinc-500">
          Supabase conectado. Aplica el SQL si aún no hay tablas.
        </p>
      </div>
    </aside>
  );
}
