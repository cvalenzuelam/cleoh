import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DeleteShippingMethodButton } from "@/components/admin/DeleteShippingMethodButton";
import { ShippingMethodForm } from "@/components/admin/ShippingMethodForm";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminEditarEnvioPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServiceClient();
  const { data: method } = await supabase
    .from("shipping_methods")
    .select(
      "id, name, description, price_cents, eta_label, sort_order, is_active",
    )
    .eq("id", id)
    .maybeSingle();

  if (!method) notFound();

  return (
    <>
      <AdminPageHeader
        title={method.name}
        description="Editar método de envío"
      />
      <ShippingMethodForm
        method={{
          id: method.id,
          name: method.name,
          description: method.description ?? "",
          eta_label: method.eta_label ?? "",
          price_cents: method.price_cents,
          sort_order: method.sort_order,
          is_active: method.is_active,
        }}
      />
      <div className="mt-6">
        <DeleteShippingMethodButton id={method.id} />
      </div>
    </>
  );
}
