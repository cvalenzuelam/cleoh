import type { Metadata } from "next";
import { DEFAULT_HERO_IMAGE } from "@/lib/site/settings";
import { site } from "@/data/site";

export const siteMetadataBase = new URL(site.url);

const defaultTitle = `${site.name} | ${site.tagline}`;

export const rootMetadata: Metadata = {
  metadataBase: siteMetadataBase,
  title: {
    default: defaultTitle,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: site.url,
    siteName: site.name,
    title: defaultTitle,
    description: site.description,
    images: [
      {
        url: DEFAULT_HERO_IMAGE,
        width: 1200,
        height: 630,
        alt: `${site.name} — ${site.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: site.description,
    images: [DEFAULT_HERO_IMAGE],
  },
  alternates: {
    canonical: site.url,
  },
};

export function productMetadata(input: {
  name: string;
  description?: string | null;
  image?: string | null;
  slug: string;
}): Metadata {
  const title = input.name;
  const description = input.description ?? site.description;
  const image = input.image?.replace(/[\r\n\t]+/g, "").trim() || DEFAULT_HERO_IMAGE;
  const url = `${site.url}/producto/${input.slug}`;

  return {
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description,
      url,
      images: [{ url: image, alt: input.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    alternates: { canonical: url },
  };
}
