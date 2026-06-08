/**
 * A tasteful, stylized Michigan block-M mark (our own geometry — not the
 * trademarked logo). Maize "M" on a navy tile for paper contexts; a bare maize
 * "M" for placing on navy fields.
 */
export function BlockM({
  className = "",
  variant = "tile",
}: {
  className?: string;
  variant?: "tile" | "bare";
}) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="MSAIL block M">
      {variant === "tile" ? (
        <rect x="0" y="0" width="100" height="100" rx="6" className="fill-navy" />
      ) : null}
      <path
        d="M26 74 V30 L50 55 L74 30 V74"
        fill="none"
        strokeWidth="13"
        strokeLinejoin="miter"
        strokeLinecap="butt"
        className="stroke-maize"
      />
    </svg>
  );
}
