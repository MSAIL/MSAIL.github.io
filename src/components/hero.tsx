import { home, site } from "@/data/site";
import { CtaLink } from "./cta-link";
import { ArrowIcon } from "./icons";

/** Renders the data-driven headline: plain runs, maize-highlight, or serif italic. */
function Headline() {
  return (
    <h1 className="font-display text-display font-semibold text-ink">
      {home.headline.map((seg, i) => {
        if (seg.emphasis === "highlight") {
          return (
            <span key={i} className="maize-highlight">
              {seg.text}
            </span>
          );
        }
        if (seg.emphasis === "italic") {
          return (
            <em key={i} className="italic">
              {seg.text}
            </em>
          );
        }
        return <span key={i}>{seg.text}</span>;
      })}
    </h1>
  );
}

export function Hero() {
  return (
    <section className="container-bleed py-section-sm sm:py-section">
      {/* Editorial meta row */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <p className="eyebrow text-faint">
          {home.location} · est. {site.foundedYear}
        </p>
        <p className="eyebrow text-faint">{home.stat}</p>
      </div>

      <div className="mt-12 grid items-start gap-12 lg:mt-16 lg:grid-cols-12 lg:gap-8">
        {/* Left: giant, left-aligned serif headline */}
        <div className="lg:col-span-7">
          <p className="eyebrow text-faint">00 — {home.eyebrow}</p>
          <div className="mt-5 h-1 w-16 bg-maize" />
          <div className="mt-7">
            <Headline />
          </div>
          <p className="mt-8 max-w-prose text-lead text-muted">{home.lead}</p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <CtaLink href={site.cta.href}>
              {site.cta.label} MSAIL
              <ArrowIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </CtaLink>
            <CtaLink href="/about" variant="ghost">
              About the lab
            </CtaLink>
          </div>
        </div>

        {/* Right: asymmetric navy facts panel — the color block in the hero */}
        <aside className="navy-field relative flex flex-col gap-6 p-8 lg:col-span-4 lg:col-start-9 lg:mt-3">
          <div className="absolute left-0 top-0 h-1 w-16 bg-maize" />
          <p className="eyebrow text-maize">What we do</p>
          <ul className="flex flex-col">
            {home.pillars.map((p) => (
              <li
                key={p.index}
                className="flex items-baseline gap-4 border-b border-border-on-navy py-4 last:border-0"
              >
                <span className="font-mono text-meta text-maize">{p.index}</span>
                <span className="flex flex-col">
                  <span className="font-display text-h3 font-semibold text-on-navy">{p.label}</span>
                  <span className="mt-0.5 text-meta text-on-navy-muted">{p.blurb}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-1 flex flex-col gap-1 font-mono text-meta text-on-navy-muted">
            <span className="uppercase tracking-[0.16em]">est. {site.foundedYear} · Ann Arbor</span>
            <span className="uppercase tracking-[0.16em]">{site.university}</span>
          </div>
        </aside>
      </div>

      <p className="eyebrow mt-16 border-t border-border pt-5 text-faint">
        Homepage sections in progress — shell preview
      </p>
    </section>
  );
}
