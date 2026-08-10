import Link from "next/link";
import { site, footerColumns } from "@/data/site";
import { Wordmark } from "./wordmark";
import { CtaLink } from "./cta-link";
import { ArrowIcon } from "./icons";
import { ChannelIcon, channelAriaLabel, channelLinkProps } from "./channel-icon";
import { Year } from "./year";

/** Small footer column heading. */
function ColTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-meta text-on-navy-muted">{children}</p>;
}

export function SiteFooter() {
  // Build-time year as the prerendered value; <Year> refreshes it client-side
  // so the colophon stays current even without a rebuild.
  const year = new Date().getFullYear();

  return (
    <footer data-nav-ink className="ground-ink">
      <div className="container-bleed py-section-sm">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
          {/* Identity + CTA */}
          <div className="flex flex-col items-start gap-6">
            <Wordmark withTagline tone="cream" />
            <p className="max-w-xs text-meta text-on-navy-muted">{site.tagline}</p>
            <CtaLink href={site.cta.href}>
              {site.cta.label} MSAIL
              <ArrowIcon className="h-4 w-4" />
            </CtaLink>
          </div>

          {/* Link columns */}
          {footerColumns.map((col) => (
            <nav key={col.title} aria-label={col.title} className="flex flex-col gap-4">
              <ColTitle>{col.title}</ColTitle>
              <ul className="flex flex-col">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="flex min-h-11 w-fit min-w-11 items-center text-label text-on-navy-muted transition-colors duration-150 hover:text-maize"
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
            <ColTitle>Connect</ColTitle>
            <ul className="flex flex-col gap-1">
              {site.channels.map((c) => (
                <li key={c.key} className="flex flex-col">
                  <a
                    href={c.href}
                    {...channelLinkProps(c)}
                    aria-label={channelAriaLabel(c)}
                    className="inline-flex min-h-11 items-center gap-2 text-label text-on-navy transition-colors duration-150 hover:text-maize"
                  >
                    <ChannelIcon name={c.key} className="h-4 w-4 shrink-0" />
                    {c.label}
                  </a>
                  <span className="-mt-1 ml-6 text-meta text-on-navy-muted">{c.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Colophon */}
        <div className="mt-16 flex flex-col gap-3 border-t border-border-on-navy pt-6 text-meta text-on-navy-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © <Year initial={year} /> {site.name} · {site.longName}
          </p>
          <p>
            {site.university} · Since {site.foundedYear}
          </p>
        </div>
      </div>
    </footer>
  );
}
