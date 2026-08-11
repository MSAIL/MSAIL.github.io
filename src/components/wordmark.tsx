import Link from "next/link";
import { site } from "@/data/site";

/**
 * The MSAIL identity lockup: the name set in Graduate (the varsity block
 * letterface) wearing the sunset gradient — the same navy→violet→gold walk
 * the Block M wears. `withTagline` adds the full org name under it (footer).
 * `tone="cream"` swaps in the dark-ground cut of the gradient and mutes the
 * tagline for navy surfaces.
 */
export function Wordmark({
  className = "",
  tone = "ink",
  withTagline = false,
  onClick,
}: {
  className?: string;
  tone?: "ink" | "cream";
  withTagline?: boolean;
  onClick?: () => void;
}) {
  const onNavy = tone === "cream";
  return (
    // No aria-label: the visible text IS the accessible name (a label that
    // omits the tagline fails label-content-name-mismatch).
    <Link
      href="/"
      onClick={onClick}
      className={`group flex min-h-11 w-fit flex-col items-start justify-center gap-y-1 ${className}`}
    >
      <span
        className={`${onNavy ? "wordmark-glass-dark" : "wordmark-glass"} text-[1.1875rem] font-black leading-none tracking-[0.015em]`}
      >
        {site.name}
      </span>
      {withTagline ? (
        <span
          className={`text-[0.6875rem] leading-tight ${
            onNavy ? "text-on-navy-muted" : "text-ink-3"
          }`}
        >
          {site.longName}
        </span>
      ) : null}
    </Link>
  );
}
