type Day = {
  date: string;
  visitors: number;
  pageviews: number;
};

type Props = {
  days: Day[];
  formatDayLabel: (iso: string) => string;
};

export function AnalyticsDayChart({ days, formatDayLabel }: Props) {
  const maxDayViews = Math.max(1, ...days.map((d) => d.pageviews));

  return (
    <div className="mt-4 flex items-end gap-1.5 sm:gap-2">
      {days.map((day) => {
        const h = Math.max(
          4,
          Math.round((day.pageviews / maxDayViews) * 100),
        );
        const label = formatDayLabel(day.date);

        return (
          <div
            key={day.date}
            className="group relative flex min-w-0 flex-1 flex-col items-center gap-1.5"
          >
            <div
              role="tooltip"
              className="pointer-events-none absolute bottom-[calc(100%+0.35rem)] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-900 px-2.5 py-1.5 text-[0.65rem] leading-tight text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
            >
              <span className="font-medium">{label}</span>
              <span className="mx-1.5 text-zinc-400">·</span>
              <span>{day.pageviews} vistas</span>
              <span className="mx-1.5 text-zinc-400">·</span>
              <span>{day.visitors} visitantes</span>
              <span
                className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-zinc-900"
                aria-hidden
              />
            </div>

            <div className="flex h-24 w-full cursor-default items-end rounded-sm group-hover:bg-zinc-50/80">
              <div
                className="w-full rounded-t-md bg-zinc-800/85 transition-colors group-hover:bg-zinc-900"
                style={{ height: `${h}%` }}
                tabIndex={0}
                aria-label={`${label}: ${day.pageviews} vistas, ${day.visitors} visitantes`}
              />
            </div>

            <span className="truncate text-[0.6rem] text-zinc-400">{label}</span>
          </div>
        );
      })}
    </div>
  );
}
