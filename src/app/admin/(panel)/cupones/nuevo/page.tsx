import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CouponForm } from "@/components/admin/CouponForm";

export default function AdminNuevoCuponPage() {
  return (
    <>
      <AdminPageHeader
        title="Nuevo cupón"
        description="El código se valida en checkout al pagar con Mercado Pago."
      />
      <CouponForm />
    </>
  );
}
