import {
  SIZE_GUIDE_INTRO,
  SIZE_GUIDE_ROWS,
} from "@/data/size-guide";

type Props = {
  compact?: boolean;
};

export function SizeGuideContent({ compact = false }: Props) {
  return (
    <>
      <p
        className={`animate-fade-up text-sm leading-relaxed text-ink-soft ${
          compact ? "" : "mt-4"
        }`}
      >
        {SIZE_GUIDE_INTRO}
      </p>

      <div
        className={`animate-fade-up-delay overflow-x-auto border border-line ${
          compact ? "mt-5" : "mt-10"
        }`}
      >
        <table className="w-full min-w-[28rem] text-left text-sm">
          <thead className="bg-petal text-[0.65rem] uppercase tracking-[0.16em]">
            <tr>
              <th className="px-4 py-3 font-medium">Talla Cleoh</th>
              <th className="px-4 py-3 font-medium">Ref.</th>
              <th className="px-4 py-3 font-medium">Pecho</th>
              <th className="px-4 py-3 font-medium">Cintura</th>
            </tr>
          </thead>
          <tbody className="text-ink-soft">
            {SIZE_GUIDE_ROWS.map((row) => (
              <tr
                key={row.size}
                className="border-t border-line transition-colors duration-300 hover:bg-petal/50"
              >
                <td className="px-4 py-3 text-ink">{row.size}</td>
                <td className="px-4 py-3">{row.label}</td>
                <td className="px-4 py-3">{row.bust}</td>
                <td className="px-4 py-3">{row.waist}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p
        className={`animate-fade-up-delay-2 text-sm leading-relaxed text-ink-soft ${
          compact ? "mt-4" : "mt-6"
        }`}
      >
        Nota: si el modelo tiene copa, la talla corresponde a copa{" "}
        <span className="text-ink">B–C</span>. No manejamos copa D.
      </p>
    </>
  );
}
