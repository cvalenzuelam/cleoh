export type CategorySlug =
  | "babydoll"
  | "novias"
  | "pijamas"
  | "coordinados"
  | "batas";

const cover = (id: string) =>
  `https://static.wixstatic.com/media/${id}/v1/fill/w_1200,h_1500,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/${id}`;

export type Category = {
  slug: CategorySlug;
  name: string;
  navLabel: string;
  description: string;
  coverImage: string;
  /** Shown in Edge-style home tiles */
  tile: boolean;
  nav: boolean;
};

export const categories: Category[] = [
  {
    slug: "babydoll",
    name: "BabyDoll",
    navLabel: "BabyDoll",
    description: "Babydolls con encaje, transparencias y siluetas coquetas.",
    coverImage: cover("7f4d67_64e50f84607944118736f90535394c8b~mv2.jpeg"),
    tile: true,
    nav: true,
  },
  {
    slug: "novias",
    name: "Novias",
    navLabel: "Novias",
    description: "Blancos y especiales para una noche inolvidable.",
    coverImage: cover("7f4d67_59d72805d9f942299266a25f7bcb3a08~mv2.jpeg"),
    tile: true,
    nav: true,
  },
  {
    slug: "pijamas",
    name: "Pijamas",
    navLabel: "Pijamas",
    description: "Pijamas cómodas con detalle romántico para el día a día.",
    coverImage: cover("7f4d67_5250cc41ddb045b3a0b895c8f274b8b2~mv2.jpeg"),
    tile: true,
    nav: true,
  },
  {
    slug: "coordinados",
    name: "Coordinados",
    navLabel: "Coordinados",
    description: "Sets de top y panty, conjuntos y looks a juego.",
    coverImage: cover("7f4d67_414f44e8d25441dfac1001aff1e3bce1~mv2.jpeg"),
    tile: true,
    nav: true,
  },
  {
    slug: "batas",
    name: "Batas",
    navLabel: "Batas",
    description: "Batas ligeras para completar tu ritual.",
    coverImage: cover("7f4d67_81035b4c49b545e0b6563e2aca38839f~mv2.jpeg"),
    tile: false,
    nav: true,
  },
];

export const navCategories = categories.filter((c) => c.nav);
export const tileCategories = categories.filter((c) => c.tile);

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}
