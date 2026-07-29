import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { DeleteCategoryButton } from "@/components/admin/DeleteCategoryButton";
import { createServiceClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export default async function AdminEditarCategoriaPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServiceClient();
  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!category) notFound();

  return (
    <>
      <AdminPageHeader
        title={category.name}
        description={`Slug: ${category.slug}`}
      />
      <CategoryForm
        category={{
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description ?? "",
          cover_image_url: category.cover_image_url ?? "",
          sort_order: String(category.sort_order ?? 0),
          is_nav: category.is_nav,
          is_tile: category.is_tile,
        }}
      />
      <div className="mt-6">
        <DeleteCategoryButton id={category.id} />
      </div>
    </>
  );
}
