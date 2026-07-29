import Image from "next/image";
import Link from "next/link";
import { site } from "@/data/site";
import { getHeroImageUrl } from "@/lib/site/settings";

export async function Hero() {
  const heroImage = await getHeroImageUrl();

  return (
    <section className="relative min-h-[88vh] w-full overflow-hidden bg-ink">
      <Image
        src={heroImage}
        alt="Lencería romántica Cleoh"
        fill
        priority
        sizes="100vw"
        className="object-cover object-[center_20%] transition-transform duration-[1.2s] ease-out"
      />
      <div className="hero-veil absolute inset-0" />

      <div className="relative mx-auto flex min-h-[88vh] max-w-7xl flex-col justify-end px-4 pb-16 pt-28 sm:px-6 sm:pb-20 lg:px-8">
        <p className="animate-fade-up font-display text-4xl tracking-[0.2em] text-porcelain sm:text-5xl md:text-6xl">
          CLEOH
        </p>
        <h1 className="animate-fade-up-delay mt-4 max-w-md font-display text-2xl leading-snug text-porcelain/95 sm:text-3xl">
          {site.tagline}
        </h1>
        <p className="animate-fade-up-delay-2 mt-3 max-w-sm text-sm leading-relaxed text-porcelain/80">
          {site.slogan}.
        </p>
        <p className="animate-fade-up-delay-2 mt-5 max-w-sm text-[0.8rem] leading-relaxed tracking-[0.04em] text-porcelain/70">
          Usa el código{" "}
          <span className="font-medium tracking-[0.12em] text-porcelain">
            {site.coupon.code}
          </span>{" "}
          — {site.coupon.label} en tu pedido
        </p>
        <div className="animate-fade-up-delay-2 mt-7">
          <Link
            href="/tienda"
            className="btn btn-light min-w-[14rem] px-10 sm:min-w-[16rem]"
          >
            Ver colección
          </Link>
        </div>
      </div>
    </section>
  );
}
