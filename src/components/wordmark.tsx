import Link from "next/link";
import { site } from "@/data/site";
import { BlockM } from "./block-m";

/**
 * The MSAIL identity: block-M mark + serif wordmark. `tone="cream"` adapts it
 * for placement on a navy field (footer); default `ink` is for paper.
 */
export function Wordmark({
  className = "",
  tone = "ink",
  withTagline = false,
}: {
  className?: string;
  tone?: "ink" | "cream";
  withTagline?: boolean;
}) {
  const onNavy = tone === "cream";
  return (
    <Link
      href="/"
      aria-label={`${site.name} — home`}
      className={`group inline-flex items-center gap-3 ${className}`}
    >
      <BlockM variant={onNavy ? "bare" : "tile"} className="h-9 w-9 shrink-0" />
      <span className="flex flex-col leading-none">
        <span
          className={`font-display text-[1.4rem] font-semibold tracking-tight ${
            onNavy ? "text-on-navy" : "text-ink"
          }`}
        >
          {site.name}
        </span>
        {withTagline ? (
          <span
            className={`mt-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.18em] ${
              onNavy ? "text-on-navy-muted" : "text-faint"
            }`}
          >
            {site.longName}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
