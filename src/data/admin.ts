export type AdminNavItem = {
  href: string;
  label: string;
  description: string;
};

export const adminNav: AdminNavItem[] = [
  {
    href: "/admin",
    label: "Resumen",
    description: "Pedidos recientes y atajos",
  },
  {
    href: "/admin/analiticas",
    label: "Analíticas",
    description: "Ventas y rendimiento",
  },
  {
    href: "/admin/productos",
    label: "Productos",
    description: "Catálogo, variantes y stock",
  },
  {
    href: "/admin/pedidos",
    label: "Pedidos",
    description: "Pagos y fulfillment",
  },
  {
    href: "/admin/cupones",
    label: "Cupones",
    description: "Descuentos y códigos",
  },
  {
    href: "/admin/categorias",
    label: "Categorías",
    description: "Nav y tiles del home",
  },
  {
    href: "/admin/apariencia",
    label: "Apariencia",
    description: "Imagen del hero / landing",
  },
  {
    href: "/admin/envios",
    label: "Envíos",
    description: "Métodos y tarifas",
  },
];

/** Demo hasta conectar Supabase */
export const demoStats = {
  products: 17,
  lowStock: 3,
  ordersOpen: 0,
  couponsActive: 1,
};

export const demoProducts = [
  {
    name: "BabyDoll Noche",
    slug: "babydoll-noche",
    price: 720,
    stock: 8,
    status: "activo" as const,
  },
  {
    name: "Pijama Novia",
    slug: "pijama-novia",
    price: 490,
    stock: 2,
    status: "activo" as const,
  },
  {
    name: "Set Elena",
    slug: "set-elena",
    price: 359,
    stock: 0,
    status: "agotado" as const,
  },
  {
    name: "Conjunto Rebeca",
    slug: "conjunto-rebeca",
    price: 660,
    stock: 5,
    status: "activo" as const,
  },
];

export const demoOrders = [
  {
    number: "—",
    customer: "Sin pedidos aún",
    total: "—",
    status: "demo",
  },
];

export const demoCoupons = [
  {
    code: "CLEOH10",
    detail: "10% · activo (migración Wix)",
  },
];
