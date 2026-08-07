import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { IconMail } from "@/components/admin/icons";
import { getPurchasedEmailSet } from "@/lib/newsletter/purchased-emails";
import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default async function AdminNewsletterPage() {
  const supabase = createServiceClient();
  const [subscribersResult, purchasedEmails] = await Promise.all([
    supabase
      .from("newsletter_subscribers")
      .select("id, email, source, subscribed_at")
      .order("subscribed_at", { ascending: false })
      .limit(500),
    getPurchasedEmailSet(),
  ]);

  const subscribers = subscribersResult.data;
  const error = subscribersResult.error;
  const purchasedCount =
    subscribers?.filter((s) => purchasedEmails.has(s.email.toLowerCase()))
      .length ?? 0;

  return (
    <>
      <AdminPageHeader
        title="Newsletter"
        description="Correos capturados desde el popup de bienvenida (cupón CLEOH10)."
        icon={<IconMail className="h-[18px] w-[18px]" />}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <a
          href="/api/admin/newsletter/export"
          className="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
        >
          Exportar CSV
        </a>
        <p className="text-xs text-zinc-500">
          {subscribers?.length ?? 0} suscriptor
          {(subscribers?.length ?? 0) === 1 ? "" : "es"}
          {subscribers?.length ? (
            <>
              {" "}
              · {purchasedCount} compró ·{" "}
              {(subscribers?.length ?? 0) - purchasedCount} solo suscrito
            </>
          ) : null}
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error.message.includes("newsletter_subscribers")
            ? "Falta aplicar la migración de newsletter en Supabase."
            : error.message}
        </p>
      ) : !subscribers?.length ? (
        <p className="rounded-lg border border-zinc-200 bg-white px-4 py-8 text-center text-sm text-zinc-500">
          Aún no hay suscriptores. Aparecerán aquí cuando alguien deje su email
          en el popup de la tienda.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Origen</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => {
                const purchased = purchasedEmails.has(s.email.toLowerCase());
                return (
                  <tr
                    key={s.id}
                    className="border-t border-zinc-50 text-zinc-600"
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {s.email}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide ${
                          purchased
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {purchased ? "Compró" : "Solo suscrito"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">{s.source || "popup"}</td>
                    <td className="px-4 py-3 text-xs">
                      {formatDate(s.subscribed_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 text-xs text-zinc-500">
        El popup muestra el código{" "}
        <Link href="/admin/cupones" className="underline">
          CLEOH10
        </Link>{" "}
        y envía un correo de confirmación si Resend está configurado. «Compró»
        incluye pedidos pagados o entregados.
      </p>
    </>
  );
}
