import Link from "next/link";

type Props = {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
};

export function AdminPageHeader({
  title,
  description,
  actionHref,
  actionLabel,
}: Props) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-zinc-500">{description}</p>
        )}
      </div>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium !text-white hover:bg-zinc-800"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
