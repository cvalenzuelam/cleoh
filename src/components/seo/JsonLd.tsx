type Props = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

/** Emite JSON-LD en un script type="application/ld+json". */
export function JsonLd({ data }: Props) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
