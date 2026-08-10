import { site } from "@/data/site";

type Props = {
  className?: string;
};

/** Enlace a la cuenta oficial de Cleoh; texto visible siempre «Instagram». */
export function InstagramLink({
  className = "text-ink underline-offset-2 hover:underline",
}: Props) {
  return (
    <a
      href={site.social.instagram}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      Instagram
    </a>
  );
}
