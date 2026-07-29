import type { MetadataRoute } from "next";
import { site } from "@/data/site";
import { getCategorySlugs, getProductSlugs } from "@/lib/catalog/queries";

const staticRoutes = [
  "",
  "/tienda",
  "/contacto",
  "/faq",
  "/politicas",
  "/envios-devoluciones",
  "/guia-tallas",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const base = site.url.replace(/\/$/, "");

  let productSlugs: string[] = [];
  let categorySlugs: string[] = [];

  try {
    [productSlugs, categorySlugs] = await Promise.all([
      getProductSlugs(),
      getCategorySlugs(),
    ]);
  } catch {
    // Supabase no disponible en build — al menos rutas estáticas
  }

  return [
    ...staticRoutes.map((path) => ({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.8,
    })),
    ...categorySlugs.map((slug) => ({
      url: `${base}/categoria/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...productSlugs.map((slug) => ({
      url: `${base}/producto/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
