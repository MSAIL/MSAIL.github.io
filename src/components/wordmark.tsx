import Link from "next/link";
import Image from "next/image";
import { site } from "@/data/site";

/**
 * The MSAIL identity: the real circuit-M logo mark + the wordmark. `tone="cream"`
 * adapts the text for placement on a navy field (footer); default `ink` for paper.
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
      aria-label={`${site.name}, home`}
      className={`group inline-flex flex-col ${className}`}
    >
      {/* Mark + wordmark share one centered row, so the M is vertically centered
          against the MSAIL cap line in both the (single-line) header and the
          (tagline) footer — never floating against the taller two-line block. */}
      <span className="inline-flex items-center gap-2.5">
        <Image
          src="/msail-wordmark-m.png"
          alt=""
          width={284}
          height={235}
          /* Glyph-trimmed mark sized to the wordmark cap height (Anton ≈ 0.71em
             of the 1.5rem wordmark ≈ 1.05rem) so it reads as a peer of the
             letters rather than an oversized square. */
          className="h-[1.05rem] w-auto shrink-0"
        />
        <span
          className={`font-display text-[1.5rem] leading-none tracking-[0.06em] ${
            onNavy ? "text-on-navy" : "text-ink"
          }`}
        >
          {site.name}
        </span>
      </span>
      {withTagline ? (
        // pl ≈ mark width (1.05rem × 284/235 ≈ 1.27rem) + row gap (0.625rem), so
        // the tagline starts under the wordmark text, not under the mark.
        <span
          className={`mt-1.5 pl-[1.9rem] text-[0.6875rem] font-medium uppercase tracking-[0.14em] ${
            onNavy ? "text-on-navy-muted" : "text-faint"
          }`}
        >
          {site.longName}
        </span>
      ) : null}
    </Link>
  );
}
