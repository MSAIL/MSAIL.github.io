import Link from "next/link";
import { Hero } from "@/components/hero";
import { ExplainerIsland } from "@/components/explainer-island";
import { CtaLink } from "@/components/cta-link";
import { ArrowIcon } from "@/components/icons";
import { ChannelIcon, channelAriaLabel, channelLinkProps } from "@/components/channel-icon";
import { home, site } from "@/data/site";
import { initiatives } from "@/data/initiatives";
import { talksArchive } from "@/data/talks";

/** Six talks that show the archive's range, picked from the real 37. */
const SAMPLE_SLUGS = [
  "alphafold_2_092021",
  "aisafety_012522",
  "ntk_020122",
  "laird_102720",
  "gpt3_091520",
  "fairness_032222",
];
const SAMPLE_TALKS = SAMPLE_SLUGS.map(
  (s) => talksArchive.find((t) => t.slug === s)!,
);

export default function Home() {
  return (
    <>
      <Hero />

      {/* First beat below the fold: what this is, and the two doors in. */}
      <section className="container-page flex flex-col items-center pb-section-sm pt-4 text-center">
        <p className="max-w-2xl text-lead text-ink-2">{home.subline}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {home.ctas.map((cta) => (
            <CtaLink key={cta.href} href={cta.href} variant={cta.variant}>
              {cta.label}
            </CtaLink>
          ))}
        </div>
      </section>

      {/* The one prismatic hairline — the only place the spectral ramp exists
          outside the simulation. */}
      <hr className="prism-rule mx-auto w-full max-w-xl" aria-hidden />

      <ExplainerIsland />

      {/* What MSAIL is. Sentence craft, no icon cards. */}
      <section className="container-page pb-section-sm sm:pb-section">
        <p className="font-display max-w-[30ch] text-h2 text-navy">{site.mission}</p>
        <p className="mt-8 max-w-prose text-body text-ink-2">
          MSAIL was founded in 2008. During the semester we run reading groups and
          project teams; since 2020 the speaker series has hosted University of
          Michigan faculty, PhD researchers, and engineering teams from Bloomberg,
          ProQuest, and Datature.
        </p>
      </section>

      {/* Initiatives as an index, not cards. */}
      <section className="container-page pb-section-sm sm:pb-section">
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-border pb-5">
          <h2 className="font-display text-h3 text-navy">Initiatives</h2>
          <Link
            href="/initiatives"
            className="group inline-flex min-h-11 items-center gap-1.5 text-label font-medium text-navy hover:underline"
          >
            All initiatives and the archive
            <ArrowIcon className="h-4 w-4" />
          </Link>
        </div>
        <ul>
          {initiatives.items.map((item) => (
            <li key={item.name}>
              <Link
                href="/initiatives"
                className="grid items-baseline gap-x-8 gap-y-1 border-b border-border py-6 transition-colors duration-150 hover:bg-tile sm:grid-cols-[15rem_1fr_auto]"
              >
                <h3 className="font-display text-[1.375rem] leading-snug text-navy">
                  {item.name}
                </h3>
                <p className="max-w-prose text-body text-ink-2">{item.description}</p>
                <span className="text-meta text-ink-3">{item.level}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* The talk archive, in the site's own light. */}
      <section className="container-page pb-section-sm sm:pb-section">
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-border pb-5">
          <h2 className="font-display text-h3 text-navy">37 recorded talks, 2020 to 2024</h2>
        </div>
        <ul className="grid gap-x-10 sm:grid-cols-2">
          {SAMPLE_TALKS.map((t) => (
            <li
              key={t.slug}
              className="flex flex-col gap-0.5 border-b border-border py-4"
            >
              <span className="text-body font-semibold text-ink">{t.title}</span>
              <span className="text-meta text-ink-3">{t.speaker}</span>
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <CtaLink href="/talks">
            Browse all 37
            <ArrowIcon className="h-4 w-4" />
          </CtaLink>
        </div>
      </section>

      {/* Join: the real channels, no form theater. */}
      <section className="container-page py-section-sm sm:py-section">
        <h2 className="font-display text-h3 text-navy">Find us</h2>
        <p className="mt-4 max-w-prose text-body text-ink-2">
          MSAIL is open to every University of Michigan student. These are our
          channels; Slack is the most active.
        </p>
        <ul className="mt-8 flex flex-wrap gap-3">
          {site.channels.map((c) => (
            <li key={c.key}>
              <a
                href={c.href}
                {...channelLinkProps(c)}
                aria-label={channelAriaLabel(c)}
                className="btn-glass btn-glass-clear inline-flex min-h-11 items-center gap-2.5 rounded-full px-5 py-2.5 text-label font-medium"
              >
                <ChannelIcon name={c.key} className="h-4 w-4 shrink-0 text-navy" />
                {c.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
