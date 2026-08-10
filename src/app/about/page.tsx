import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { SectionHeading } from "@/components/content-blocks";
import { ArrowIcon, GlobeIcon } from "@/components/icons";
import { ChannelIcon } from "@/components/channel-icon";
import { about } from "@/data/about";

export const metadata: Metadata = {
  title: "About",
  description:
    "What MSAIL is: a student organization devoted to AI research at the University of Michigan, founded in 2008.",
};

export default function AboutPage() {
  return (
    <PageShell title="About MSAIL" lead={about.mission}>
      <div className="mt-10 flex flex-col gap-10">
        <p className="max-w-prose text-body text-ink-2">{about.history}</p>

        {/* The Fall 2026 team, per Matthew's roster sheet: MDST-style cards.
            Cards wear the real headshot where one has been uploaded and the
            sunset-initials placeholder otherwise; the faculty mentor stays
            off until re-confirmed. */}
        <section className="flex flex-col gap-6">
          <SectionHeading>Leadership, {about.roster.term}</SectionHeading>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {about.roster.people.map((p) => {
              const initials = p.name
                .split(/\s+/)
                .map((w) => w[0])
                .filter((_, i, arr) => i === 0 || i === arr.length - 1)
                .join("")
                .toUpperCase();
              return (
                <li
                  key={p.name}
                  className="flex flex-col overflow-hidden rounded-xl border border-white/60 bg-white/40 text-center shadow-card backdrop-blur-md"
                >
                  {p.photo ? (
                    // alt stays empty: the name is the very next text node, so
                    // a screen reader would otherwise announce it twice.
                    <Image
                      src={p.photo}
                      alt=""
                      width={640}
                      height={640}
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <div
                      aria-hidden
                      className="avatar-fallback flex aspect-square w-full items-center justify-center text-[3.25rem] font-bold text-white"
                    >
                      {initials}
                    </div>
                  )}
                  <div className="flex flex-col gap-0.5 px-4 pt-4">
                    <span className="text-body font-semibold text-ink">{p.name}</span>
                    <span className="text-meta text-ink-2">{p.role}</span>
                  </div>
                  <div className="flex min-h-9 items-center justify-center gap-1 pb-4">
                    {p.email ? (
                      <a
                        href={`mailto:${p.email}`}
                        aria-label={`Email ${p.name}`}
                        title={p.email}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-2 transition-colors duration-150 hover:bg-navy/5 hover:text-navy"
                      >
                        <ChannelIcon name="email" className="h-4.5 w-4.5" />
                      </a>
                    ) : null}
                    {p.linkedin ? (
                      <a
                        href={p.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${p.name} on LinkedIn`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-2 transition-colors duration-150 hover:bg-navy/5 hover:text-navy"
                      >
                        <ChannelIcon name="linkedin" className="h-4.5 w-4.5" />
                      </a>
                    ) : null}
                    {p.website ? (
                      <a
                        href={p.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${p.name}'s website`}
                        title={p.website.replace("https://", "")}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-2 transition-colors duration-150 hover:bg-navy/5 hover:text-navy"
                      >
                        <GlobeIcon className="h-4.5 w-4.5" />
                      </a>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeading>Governance</SectionHeading>
          <Link
            href="/constitution"
            className="group inline-flex w-fit min-h-11 items-center gap-2 border-t border-border pt-4 text-body text-ink transition-colors hover:text-navy hover:underline"
          >
            Read the MSAIL constitution
            <ArrowIcon className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </PageShell>
  );
}
