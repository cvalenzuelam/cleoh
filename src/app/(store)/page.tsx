import { CategoryTiles } from "@/components/home/CategoryTiles";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { Hero } from "@/components/home/Hero";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoryTiles />
      <FeaturedProducts />
    </>
  );
}
