import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ShippingMethodForm } from "@/components/admin/ShippingMethodForm";

export default function AdminNuevoEnvioPage() {
  return (
    <>
      <AdminPageHeader
        title="Nuevo método de envío"
        description="Aparecerá en el checkout si está activo."
      />
      <ShippingMethodForm />
    </>
  );
}
