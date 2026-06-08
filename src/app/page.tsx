import { site } from "@/data/site";
import { CtaLink } from "@/components/cta-link";
import { ArrowIcon } from "@/components/icons";

export default function Home() {
  return (
    <section className="relative flex flex-1 flex-col justify-center overflow-hidden">
      {/* Engineered coordinate texture — sensed, never loud. */}
      <div
        className="pointer-events-none absolute inset-0 grid-paper opacity-70 [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_75%)]"
        aria-hidden
      />

      <div className="container-bleed relative py-section-sm sm:py-section">
        <p className="eyebrow">
          <span className="text-maize">00</span>
          <span className="mx-2 text-border-strong">/</span>
          {site.university}
        </p>

        <h1 className="expanded mt-6 max-w-[15ch] text-display font-extrabold leading-[0.95] text-foreground">
          {site.longName}
          <span className="maize-period" aria-hidden />
        </h1>

        <p className="mt-8 max-w-prose text-lead text-muted">{site.tagline}</p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <CtaLink href={site.cta.href}>
            {site.cta.label} MSAIL
            <ArrowIcon className="h-4 w-4 text-maize transition-transform duration-200 group-hover:translate-x-0.5" />
          </CtaLink>
          <CtaLink href="/about" variant="ghost">
            About us
          </CtaLink>
        </div>

        <div className="mt-16 flex items-center gap-3 border-t border-border pt-6">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full bg-maize motion-safe:animate-pulse"
            aria-hidden
          />
          <p className="eyebrow text-faint">Homepage sections in progress — shell preview</p>
        </div>
      </div>
    </section>
  );
}
