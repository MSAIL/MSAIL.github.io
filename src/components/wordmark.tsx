import Link from "next/link";
import Image from "next/image";
import { site } from "@/data/site";

/**
 * The MSAIL identity lockup: the real circuit-M mark + the wordmark.
 * `tone="cream"` adapts the text for a navy field (footer); default `ink` for
 * paper. `withTagline` adds the full org name under the wordmark (footer).
 *
 * Layout: a 2-column grid (mark | text). The mark lives in the first text row
 * and is `items-center`-aligned to the MSAIL word, so it's vertically centered
 * against the wordmark in BOTH the single-line header and the tagline footer —
 * the tagline drops into row 2 of the text column and auto-indents under MSAIL,
 * with no hand-tuned padding. Same proportions in both; the footer just scales.
 *
 * The mark is sized by eye (~1.6× the MSAIL cap height) so it reads as a
 * confident anchor for the wordmark, not a tiny icon, and nudged up a hair to
 * sit optically centered on the caps (Anton's baseline sits low in its line box).
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
    <Link
      href="/"
      aria-label={`${site.name}, home`}
      onClick={onClick}
      className={`group grid min-h-11 grid-cols-[auto_1fr] content-center items-center gap-x-[0.6rem] gap-y-1 ${className}`}
    >
      <Image
        src="/msail-wordmark-m.png"
        alt=""
        width={96}
        height={80}
        loading="eager"
        className="h-[1.6rem] w-auto translate-y-[0.03em] self-center"
      />
      <span
        className={`font-display text-[1.5rem] leading-none tracking-[0.06em] ${
          onNavy ? "text-on-navy" : "text-ink"
        }`}
      >
        {site.name}
      </span>
      {withTagline ? (
        <span
          className={`col-start-2 text-[0.6875rem] font-medium uppercase leading-tight tracking-[0.14em] ${
            onNavy ? "text-on-navy-muted" : "text-faint"
          }`}
        >
          {site.longName}
        </span>
      ) : null}
    </Link>
  );
}
