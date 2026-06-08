import Link from "next/link";
import { site } from "@/data/site";

/**
 * The MSAIL wordmark: expanded grotesk + the single rationed maize "period".
 * Used in the header (compact) and footer (with tagline).
 */
export function Wordmark({
  className = "",
  withTagline = false,
}: {
  className?: string;
  withTagline?: boolean;
}) {
  return (
    <Link
      href="/"
      aria-label={`${site.name} — home`}
      className={`group inline-flex flex-col ${className}`}
    >
      <span className="expanded text-h3 font-extrabold leading-none tracking-tight text-foreground">
        {site.name}
        <span className="maize-period" aria-hidden />
      </span>
      {withTagline ? (
        <span className="mt-2 font-mono text-meta uppercase tracking-[0.2em] text-faint">
          {site.longName}
        </span>
      ) : null}
    </Link>
  );
}
