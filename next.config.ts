import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Asegura que el catálogo SEPOMEX (usado para autocompletar el checkout)
  // viaje en el bundle de la función serverless aunque el tracing automático
  // no detecte el fs.readFileSync con path.join.
  outputFileTracingIncludes: {
    "/api/checkout/postal-code": ["./src/data/sepomex-cp.json.gz"],
  },
  images: {
    /** Evita el optimizador de imágenes de Vercel (cuota gratuita de 5,000 transformaciones/mes se agota con tráfico real). Las imágenes ya vienen optimizadas desde Cloudinary antes de subirse a R2. */
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static.wixstatic.com",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "pub-b74e1fad186743fd98aac094770c4b8f.r2.dev",
      },
    ],
  },
};

export default nextConfig;
