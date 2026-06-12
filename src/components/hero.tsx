import Image from "next/image";
import { home, site } from "@/data/site";
import { CtaLink } from "./cta-link";
import { ArrowIcon } from "./icons";

export function Hero() {
  return (
    <section className="container-bleed py-section-sm sm:py-section">
      <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
        {/* Left: confident, left-aligned, full-name headline */}
        <div className="lg:col-span-7">
          <h1 className="font-display text-display text-ink">{home.headline}</h1>

          {/* The acronym, tied to the full name with the one maize highlight. */}
          <p className="mt-6">
            <span className="maize-highlight font-display text-h3">{home.acronym}</span>
          </p>

          <p className="mt-7 max-w-prose text-lead text-muted">{home.subline}</p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            {home.ctas.map((cta) => (
              <CtaLink key={cta.href} href={cta.href} variant={cta.variant}>
                {cta.label}
                {cta.variant === "primary" ? (
                  <ArrowIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                ) : null}
              </CtaLink>
            ))}
          </div>
        </div>

        {/* Right: navy color-block identity panel with the real logo mark */}
        <aside className="navy-field relative flex flex-col gap-7 p-8 lg:col-span-4 lg:col-start-9">
          <div className="absolute left-0 top-0 h-1 w-20 bg-maize" />
          {/* Decorative: the panel already names MSAIL in text right below. */}
          <Image
            src="/msail-mark.png"
            alt=""
            width={240}
            height={240}
            loading="eager"
            className="h-20 w-20"
          />
          <p className="font-display text-h3 text-on-navy">{site.name}</p>
          <div className="h-px w-full bg-border-on-navy" />
          <ul className="flex flex-col gap-2">
            {home.affiliation.map((line) => (
              <li key={line} className="font-mono text-meta uppercase tracking-[0.12em] text-on-navy-muted">
                {line}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}
