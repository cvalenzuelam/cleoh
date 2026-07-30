import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AparienciaForm } from "@/components/admin/AparienciaForm";
import { IconImage } from "@/components/admin/icons";
import {
  DEFAULT_HERO_IMAGE,
  getHeroImageUrl,
} from "@/lib/site/settings";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminAparienciaPage() {
  let heroImageUrl = DEFAULT_HERO_IMAGE;
  let tableMissing = false;

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "hero_image_url")
      .maybeSingle();

    if (error) {
      if (error.message.includes("site_settings") || error.code === "42P01") {
        tableMissing = true;
      }
    } else if (data?.value?.trim()) {
      heroImageUrl = data.value.replace(/[\r\n\t]+/g, "").trim();
    } else {
      heroImageUrl = await getHeroImageUrl();
    }
  } catch {
    heroImageUrl = await getHeroImageUrl();
  }

  return (
    <>
      <AdminPageHeader
        title="Apariencia"
        description="Imagen y elementos visuales de la landing."
        icon={<IconImage className="h-[18px] w-[18px]" />}
      />

      {tableMissing ? (
        <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Falta la tabla{" "}
          <code className="text-xs">site_settings</code>. Aplica la migración{" "}
          <code className="text-xs">20260722100000_site_settings.sql</code> en
          Supabase.
        </p>
      ) : null}

      <AparienciaForm heroImageUrl={heroImageUrl} />
    </>
  );
}
