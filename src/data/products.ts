import type { CategorySlug } from "./categories";

export type ProductBadge = "nuevo" | "mas-vendido" | "oferta";

export type Product = {
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  category: CategorySlug;
  badge?: ProductBadge;
  description: string;
  sizes: string[];
  /** Wix CDN for skeleton; migrate to R2 later */
  image: string;
  featured?: boolean;
};

export const SIZES = ["Extra Chica", "Chica", "Mediano", "Grande"] as const;

const img = (id: string) =>
  `https://static.wixstatic.com/media/${id}/v1/fill/w_900,h_1200,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/${id}`;

/** Seed from cleohlenceria.com — prices MXN, copy adapted from Wix */
export const products: Product[] = [
  {
    slug: "conjunto-rebeca",
    name: "Conjunto Rebeca",
    price: 660,
    category: "coordinados",
    badge: undefined,
    featured: true,
    description:
      "Bata y babydoll con encaje en pecho y tirantes ajustables. Corte corto, muy cómodo para usarlo de pijama en tu día a día. Color favorecedor, perfecto para la temporada.",
    sizes: [...SIZES],
    image: img("7f4d67_2ec62559007e4348acf89ee16a486046~mv2.jpeg"),
  },
  {
    slug: "babydoll-chocolate",
    name: "BabyDoll Chocolate",
    price: 590,
    category: "babydoll",
    featured: true,
    description:
      "Babydoll con encaje en pecho y transparencia en la cintura. Cómodo para tenerlo de pijama en tu día a día; un color favorecedor, perfecto para la temporada.",
    sizes: [...SIZES],
    image: img("7f4d67_0c115290ef9e434d898f390b49cca083~mv2.jpeg"),
  },
  {
    slug: "pijama-novia",
    name: "Pijama Novia",
    price: 490,
    category: "novias",
    badge: "nuevo",
    featured: true,
    description:
      "Pijama blanca de 2 piezas. El top tiene un corte asimétrico que le da un toque coqueto y divertido; especial y perfecta para novias.",
    sizes: [...SIZES],
    image: img("7f4d67_59d72805d9f942299266a25f7bcb3a08~mv2.jpeg"),
  },
  {
    slug: "babydoll-alejadrina",
    name: "BabyDoll Alejadrina",
    price: 590,
    category: "babydoll",
    featured: true,
    description:
      "Babydoll midi con encaje en mangas y pecho, y un moño en el pecho. Cómodo para usarlo de pijama día a día; color favorecedor, perfecto para la temporada.",
    sizes: [...SIZES],
    image: img("7f4d67_089495c8ded648e28443170ebc3c7345~mv2.jpeg"),
  },
  {
    slug: "set-elena",
    name: "Set Elena",
    price: 359,
    category: "coordinados",
    badge: "nuevo",
    featured: true,
    description:
      "Set de top y panty con transparencias, hecho de encaje para un toque seductor y romántico.",
    sizes: [...SIZES],
    image: img("7f4d67_414f44e8d25441dfac1001aff1e3bce1~mv2.jpeg"),
  },
  {
    slug: "set-amore",
    name: "Set Amore",
    price: 399,
    category: "coordinados",
    badge: "nuevo",
    featured: true,
    description:
      "Set de 4 piezas: top de satén con transparencias, panty, broches para ajustar y guantes.",
    sizes: [...SIZES],
    image: img("7f4d67_a0453c140d6542128b631693cdd61185~mv2.jpeg"),
  },
  {
    slug: "babydoll-esmeralda",
    name: "BabyDoll Esmeralda",
    price: 590,
    category: "babydoll",
    description:
      "Babydoll especial en tono esmeralda, en encaje y satén, con broches para ajustar.",
    sizes: [...SIZES],
    image: img("7f4d67_47a1a46b29144351af47214f9a3b735b~mv2.jpeg"),
  },
  {
    slug: "pijama-dulce",
    name: "Pijama Dulce",
    price: 490,
    category: "pijamas",
    badge: "nuevo",
    description:
      "Pijama azul bebé de 2 piezas. El top tiene moñitos en el pecho y tirantes ajustables, con un toque coqueto y divertido.",
    sizes: [...SIZES],
    image: img("7f4d67_5250cc41ddb045b3a0b895c8f274b8b2~mv2.jpeg"),
  },
  {
    slug: "set-luna-blanco",
    name: "Set Luna Blanco",
    price: 620,
    category: "coordinados",
    badge: "mas-vendido",
    featured: true,
    description:
      "Set especial para una noche romántica, con encaje, listones y moños. Incluye medias.",
    sizes: [...SIZES],
    image: img("7f4d67_7bd3d451d02f49f0b737b5774a729ed2~mv2.jpeg"),
  },
  {
    slug: "babydoll-noche",
    name: "BabyDoll Noche",
    price: 720,
    category: "babydoll",
    badge: "mas-vendido",
    featured: true,
    description:
      "Set especial para una noche romántica, con encaje en pecho para ese toque coqueto. Incluye panty, ligueros y medias.",
    sizes: [...SIZES],
    image: img("7f4d67_64e50f84607944118736f90535394c8b~mv2.jpeg"),
  },
  {
    slug: "babydoll-gitana",
    name: "BabyDoll Gitana",
    price: 590,
    category: "babydoll",
    description:
      "Babydoll negro con encaje, transparencias y broches en los tirantes para ajustar. Incluye panty.",
    sizes: [...SIZES],
    image: img("7f4d67_c7ad9757c2c64ac3b67fdca818b109ed~mv2.jpeg"),
  },
  {
    slug: "pijama-girasol",
    name: "Pijama Girasol",
    price: 490,
    category: "pijamas",
    badge: "nuevo",
    description:
      "Pijama amarillo bebé de 2 piezas. El top tiene moñitos en el pecho y tirantes ajustables, con un toque coqueto y divertido.",
    sizes: [...SIZES],
    image: img("7f4d67_afbbc8ff6d8e43c8b95011c77c4aeb23~mv2.jpeg"),
  },
  {
    slug: "babydoll-veronica-rosa",
    name: "BabyDoll Veronica Rosa",
    price: 590,
    category: "babydoll",
    description:
      "Babydoll en rosa con encaje y silueta favorecedora. Cómodo para usarlo de pijama en tu día a día.",
    sizes: [...SIZES],
    image: img("7f4d67_0ef2d40b180e4653b48f7d0956e87592~mv2.jpeg"),
  },
  {
    slug: "bata-valentina",
    name: "Bata Valentina",
    price: 490,
    category: "batas",
    badge: "nuevo",
    description:
      "Bata de dormir con encaje en pecho y lazo en la cintura. Estilo elegante, romántico y divertido.",
    sizes: [...SIZES],
    image: img("7f4d67_81035b4c49b545e0b6563e2aca38839f~mv2.jpeg"),
  },
  {
    slug: "pijama-babyazul",
    name: "Pijama Baby Azul",
    price: 490,
    category: "pijamas",
    badge: "nuevo",
    description:
      "Pijama baby blue de 2 piezas. El top cierra con listón en el pecho para hacer moño, y tirantes con encaje para un toque coqueto y divertido.",
    sizes: [...SIZES],
    image: img("7f4d67_39acb2de13a34ac6b8a200aebb403ca7~mv2.jpeg"),
  },
  {
    slug: "set-victoria",
    name: "Set Victoria",
    price: 399,
    category: "coordinados",
    badge: "nuevo",
    description:
      "Set de top y panty con transparencias y tul en los bordes, para un toque seductor y especial.",
    sizes: [...SIZES],
    image: img("7f4d67_d597dbd0e071416c906e3c8e7334b163~mv2.jpeg"),
  },
  {
    slug: "especial-novias",
    name: "Especial Novias",
    price: 490,
    compareAtPrice: 590,
    category: "novias",
    badge: "oferta",
    featured: true,
    description:
      "Babydoll especial novias para una noche romántica, con encaje y transparencias, y broches para ajustar en la espalda.",
    sizes: [...SIZES],
    image: img("7f4d67_4843eb6427c2475f9010d935ab528e20~mv2.jpeg"),
  },
];

export function formatPrice(amount: number) {
  return `${new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(amount)} MXN`;
}

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(category: CategorySlug) {
  return products.filter((p) => p.category === category);
}

export function getFeaturedProducts() {
  return products.filter((p) => p.featured);
}

export function badgeLabel(badge: ProductBadge) {
  switch (badge) {
    case "nuevo":
      return "Nuevo";
    case "mas-vendido":
      return "Más vendido";
    case "oferta":
      return "Oferta";
  }
}
