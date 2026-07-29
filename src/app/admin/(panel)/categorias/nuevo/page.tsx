import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CategoryForm } from "@/components/admin/CategoryForm";

export default function AdminNuevaCategoriaPage() {
  return (
    <>
      <AdminPageHeader
        title="Nueva categoría"
        description="Aparecerá en menú y/o home según las opciones."
      />
      <CategoryForm />
    </>
  );
}
