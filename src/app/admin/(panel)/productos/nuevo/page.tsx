import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ProductForm } from "@/components/admin/ProductForm";
import { createClient } from "@/lib/supabase/server";

export default async function AdminNuevoProductoPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("sort_order");

  return (
    <>
      <AdminPageHeader
        title="Nuevo producto"
        description="Se crean automáticamente las tallas Extra Chica → Grande."
      />
      <ProductForm categories={categories ?? []} />
    </>
  );
}
