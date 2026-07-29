export function formatOrderMoney(cents: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export function orderStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending: "Pendiente",
    paid: "Pagado",
    fulfilled: "Enviado",
    cancelled: "Cancelado",
    refunded: "Reembolso",
  };
  return map[status] ?? status;
}

export function orderStatusBadgeClass(status: string) {
  const map: Record<string, string> = {
    pending: "bg-amber-50 text-amber-800 ring-amber-200/80",
    paid: "bg-emerald-50 text-emerald-800 ring-emerald-200/80",
    fulfilled: "bg-sky-50 text-sky-800 ring-sky-200/80",
    cancelled: "bg-zinc-100 text-zinc-600 ring-zinc-200/80",
    refunded: "bg-violet-50 text-violet-800 ring-violet-200/80",
  };
  return map[status] ?? "bg-zinc-100 text-zinc-600 ring-zinc-200/80";
}
