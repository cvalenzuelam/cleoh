export const site = {
  name: "Cleoh",
  tagline: "Lencería romántica",
  slogan: "Un toque de romance en cada una de nuestras piezas",
  description:
    "Bienvenida a la lencería romántica en Cleoh. Un toque de romance en cada una de nuestras piezas.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://lenceriacleoh.com",
  coupon: {
    code: "CLEOH10",
    label: "10% de descuento",
  },
  newsletter: {
    title: "10% en tu primera compra",
    description:
      "Déjanos tu email y te enviamos tu código de descuento para la primera compra.",
    heroTeaser:
      "Suscríbete con tu email y recibe 10% de descuento en tu primera compra.",
  },
  /** Umbral de subtotal (MXN) para envío gratis real en carrito/checkout. */
  freeShippingThresholdMxn: 1000,
  /** Mensajes del banner superior (rotan en la tienda). El cupón CLEOH10
   *  vive en el widget de newsletter — no duplicar aquí. */
  announcements: [
    "Envíos gratis en compras mayores a $1,000",
    "Envío a todo México con Estafeta y DHL",
  ],
  social: {
    instagram: "https://www.instagram.com/cleoh_lenceria/",
    instagramHandle: "@cleoh_lenceria",
    facebook: "https://www.facebook.com/CLEOH-102822385142172",
  },
  shippingNote:
    "Envíos a todo México con Estafeta y DHL. Detalles al checkout.",
} as const;
