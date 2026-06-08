import Link from "next/link";
import { site, footerColumns } from "@/data/site";
import { Wordmark } from "./wordmark";
import { CtaLink } from "./cta-link";
import { ArrowIcon } from "./icons";

export function SiteFooter() {
  // Auto-year (baked at each static build) — never a hardcoded, stale year.
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-canvas-deep">
      <div className="container-bleed py-section-sm">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          {/* Identity + CTA */}
          <div className="flex flex-col gap-6">
            <Wordmark withTagline />
            <p className="max-w-xs text-meta text-muted">{site.tagline}</p>
            <CtaLink href={site.cta.href} className="w-fit">
              {site.cta.label} MSAIL
              <ArrowIcon className="h-4 w-4 text-maize transition-transform duration-200 group-hover:translate-x-0.5" />
            </CtaLink>
          </div>

          {/* Link columns */}
          {footerColumns.map((col) => (
            <nav key={col.title} aria-label={col.title} className="flex flex-col gap-4">
              <p className="eyebrow">{col.title}</p>
              <ul className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-label text-muted transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* Channels */}
          <div className="flex flex-col gap-4">
            <p className="eyebrow">Connect</p>
            <ul className="flex flex-col gap-3">
              {site.channels.map((c) => (
                <li key={c.key} className="flex flex-col">
                  <a
                    href={c.href}
                    target={c.key === "email" ? undefined : "_blank"}
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 text-label text-foreground transition-colors"
                  >
                    {c.label}
                    <span className="text-faint transition-colors group-hover:text-maize">↗</span>
                  </a>
                  <span className="font-mono text-meta text-faint">{c.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Colophon */}
        <div className="mt-16 flex flex-col gap-3 border-t border-border pt-6 font-mono text-meta text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {site.name} — {site.longName}
          </p>
          <p className="uppercase tracking-[0.18em]">{site.university}</p>
        </div>
      </div>
    </footer>
  );
}
