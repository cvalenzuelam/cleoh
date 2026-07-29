export const site = {
  name: "Cleoh",
  tagline: "Lencería romántica",
  slogan: "Un toque de romance en cada una de nuestras piezas",
  description:
    "Bienvenida a la lencería romántica en Cleoh. Un toque de romance en cada una de nuestras piezas.",
  url: "https://www.cleohlenceria.com",
  coupon: {
    code: "CLEOH10",
    label: "10% de descuento",
  },
  /** Mensajes del banner superior (rotan en la tienda) */
  announcements: [
    "Envíos gratis en compras mayores a $1,000",
    "Código CLEOH10 — 10% de descuento",
  ],
  social: {
    instagram: "https://www.instagram.com/cleoh.mex/",
    facebook: "https://www.facebook.com/CLEOH-102822385142172",
  },
  shippingNote:
    "Envíos a todo México con Estafeta y DHL. Detalles al checkout.",
} as const;
