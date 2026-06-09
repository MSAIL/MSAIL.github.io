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
      className={`group inline-flex items-center gap-3 ${className}`}
    >
      <Image
        src="/msail-mark.png"
        alt=""
        width={285}
        height={285}
        className="h-10 w-10 shrink-0"
      />
      <span className="flex flex-col leading-none">
        <span
          className={`font-display text-[1.45rem] font-extrabold tracking-tight ${
            onNavy ? "text-on-navy" : "text-ink"
          }`}
        >
          {site.name}
        </span>
        {withTagline ? (
          <span
            className={`mt-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.14em] ${
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
