import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/admin",
    name: "Cleoh Admin",
    short_name: "Cleoh Admin",
    description: "Panel de administración de Cleoh — solo uso interno.",
    start_url: "/admin",
    scope: "/admin",
    display: "standalone",
    orientation: "portrait",
    background_color: "#faf7f6",
    theme_color: "#18181b",
    lang: "es-MX",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/admin/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/admin/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
