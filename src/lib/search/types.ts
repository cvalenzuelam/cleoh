export type SearchHit = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  image: string | null;
  categorySlug: string | null;
  categoryName: string | null;
};
