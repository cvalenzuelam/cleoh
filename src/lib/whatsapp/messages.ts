import { site } from "@/data/site";

const FOOTER = "\n\nResponde 0 para volver al menú.";

function url(path: string) {
  const base = site.url.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function whatsAppMainMenu() {
  return `Hola, somos ${site.name} · ${site.tagline.toLowerCase()}

Compras solo en la web:
${url("/tienda")}

Responde con el número:

1 · Cómo comprar
2 · Guía de tallas
3 · Envíos y envío gratis
4 · Cupón 10% (${site.coupon.code})
5 · Cambios y devoluciones
6 · Ya pagué / mi pedido
7 · Ver la tienda

Aquí te orientamos con links; no hacemos ventas por chat.${FOOTER}`;
}

function replyHowToBuy() {
  return `Cómo comprar en ${site.name}:

1. Entra a la tienda y elige tu pieza
2. Selecciona talla y agrégala al carrito
3. Ve a checkout y completa tus datos
4. Paga con Mercado Pago o PayPal

Tienda: ${url("/tienda")}
Checkout: ${url("/checkout")}${FOOTER}`;
}

function replySizeGuide() {
  return `Guía de tallas:

${url("/guia-tallas")}

En cada producto también puedes abrir la guía al elegir talla.${FOOTER}`;
}

function replyShipping() {
  return `Envíos a todo México (Estafeta y DHL).

Envío gratis en compras desde $${site.freeShippingThresholdMxn.toLocaleString("es-MX")} MXN.

El costo y tiempo exactos se calculan al pagar en checkout.

Más info: ${url("/envios-devoluciones")}${FOOTER}`;
}

function replyCoupon() {
  return `${site.coupon.label} en tu primera compra

Suscríbete con tu email en la web (popup o footer del sitio) y te mostramos el código ${site.coupon.code}.

Escríbelo al pagar en checkout.

${url("/")}${FOOTER}`;
}

function replyReturns() {
  return `Cambios y devoluciones:

Consulta la política completa aquí:
${url("/envios-devoluciones")}

Aviso de privacidad: ${url("/politicas")}${FOOTER}`;
}

function replyPaidOrder() {
  return `Si ya pagaste, revisa el correo de confirmación que enviamos al pagar.

Si no lo ves, busca en Promociones o Spam.

Para compras nuevas: ${url("/tienda")}

No damos seguimiento de pedidos por este chat; el correo es tu comprobante.${FOOTER}`;
}

function replyShopLink() {
  return `Nuestra colección:

${url("/tienda")}

${site.slogan}.${FOOTER}`;
}

function replyUnknown() {
  return `No atendemos ventas por chat.

Usa el menú (responde 0) o entra directo a:
${url("/tienda")}${FOOTER}`;
}

const MENU_REPLIES: Record<string, () => string> = {
  "1": replyHowToBuy,
  "2": replySizeGuide,
  "3": replyShipping,
  "4": replyCoupon,
  "5": replyReturns,
  "6": replyPaidOrder,
  "7": replyShopLink,
};

export function resolveWhatsAppReply(raw: string) {
  const text = raw.trim().toLowerCase();
  const normalized = text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ");

  if (!text || normalized === "0" || normalized === "menu" || normalized === "inicio") {
    return whatsAppMainMenu();
  }

  const digit = normalized.match(/^[1-7]$/)?.[0];
  if (digit && MENU_REPLIES[digit]) {
    return MENU_REPLIES[digit]();
  }

  if (/(hola|buenas|buenos|hey|info|ayuda|menu)/.test(normalized)) {
    return whatsAppMainMenu();
  }

  if (/(talla|medida|size|guia)/.test(normalized)) {
    return replySizeGuide();
  }

  if (/(envio|envío|entrega|llega|paqueteria|paquetería)/.test(normalized)) {
    return replyShipping();
  }

  if (/(cupon|cupón|descuento|cleoh10|10%|promo)/.test(normalized)) {
    return replyCoupon();
  }

  if (/(comprar|como compro|pagar|checkout|carrito)/.test(normalized)) {
    return replyHowToBuy();
  }

  if (/(cambio|devol|reembolso)/.test(normalized)) {
    return replyReturns();
  }

  if (/(pedido|pague|pagué|pagado|rastreo|tracking|clh-)/.test(normalized)) {
    return replyPaidOrder();
  }

  if (/(tienda|catalogo|catálogo|producto|coleccion|colección)/.test(normalized)) {
    return replyShopLink();
  }

  return replyUnknown();
}
