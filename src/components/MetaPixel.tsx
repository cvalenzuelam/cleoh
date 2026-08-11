import { MetaPixelRouteChange } from "@/components/MetaPixel.client";

// NEXT_PUBLIC_* debe leerse así para que Next.js lo inline en build time.
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/**
 * El snippet base va en el HTML del servidor, no con next/script
 * `afterInteractive`: así las herramientas de Meta (configuración de eventos,
 * Pixel Helper) lo encuentran al leer la página, y `fbq` existe antes de que
 * React hidrate.
 *
 * Solo se monta en el grupo (store). El panel admin no es tráfico real de
 * clientes y ensuciaría los datos de campañas.
 */
export function MetaPixel() {
  if (!PIXEL_ID) return null;

  return (
    <>
      <script
        id="meta-pixel-base"
        dangerouslySetInnerHTML={{
          __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${PIXEL_ID}');
fbq('track', 'PageView');`,
        }}
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
      <MetaPixelRouteChange />
    </>
  );
}
