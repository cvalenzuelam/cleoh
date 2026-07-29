import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CouponForm } from "@/components/admin/CouponForm";
import { DeleteCouponButton } from "@/components/admin/DeleteCouponButton";
import { createServiceClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export default async function AdminEditarCuponPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServiceClient();
  const { data: coupon } = await supabase
    .from("coupons")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!coupon) notFound();

  return (
    <>
      <AdminPageHeader
        title={`Cupón ${coupon.code}`}
        description={`${coupon.used_count} uso(s)${coupon.max_uses != null ? ` de ${coupon.max_uses}` : ""}.`}
      />
      <CouponForm
        coupon={{
          id: coupon.id,
          code: coupon.code,
          description: coupon.description ?? "",
          discount_type: coupon.percent_off ? "percent" : "amount",
          percent_off: coupon.percent_off ? String(coupon.percent_off) : "",
          amount_off: coupon.amount_off_cents
            ? String(coupon.amount_off_cents / 100)
            : "",
          min_subtotal: String((coupon.min_subtotal_cents ?? 0) / 100),
          max_uses: coupon.max_uses != null ? String(coupon.max_uses) : "",
          starts_at: coupon.starts_at ?? "",
          ends_at: coupon.ends_at ?? "",
          is_active: coupon.is_active,
        }}
      />
      <div className="mt-6">
        <DeleteCouponButton id={coupon.id} />
      </div>
    </>
  );
}
