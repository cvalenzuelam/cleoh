import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { IconReceipt } from "@/components/admin/icons";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPedidosPage() {
  const supabase = createServiceClient();
  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, customer_name, email, total_cents, status, payment_method, created_at, mp_payment_id",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <>
      <AdminPageHeader
        title="Pedidos"
        description="Estados: pending → paid → fulfilled. PayPal, Mercado Pago y transferencias SPEI."
        icon={<IconReceipt className="h-[18px] w-[18px]" />}
      />

      {error ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error.message}
        </p>
      ) : !orders?.length ? (
        <p className="rounded-lg border border-zinc-200 bg-white px-4 py-8 text-center text-sm text-zinc-500">
          Aún no hay pedidos. Se crean al iniciar checkout.
        </p>
      ) : (
        <OrdersTable orders={orders} />
      )}
    </>
  );
}
