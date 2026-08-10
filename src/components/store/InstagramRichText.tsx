import { InstagramLink } from "@/components/store/InstagramLink";

type Props = {
  text: string;
  linkClassName?: string;
};

/** Convierte la palabra «Instagram» en un enlace dentro de un párrafo de texto plano. */
export function InstagramRichText({ text, linkClassName }: Props) {
  const parts = text.split(/(Instagram)/g);

  return (
    <>
      {parts.map((part, i) =>
        part === "Instagram" ? (
          <InstagramLink key={i} className={linkClassName} />
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}
