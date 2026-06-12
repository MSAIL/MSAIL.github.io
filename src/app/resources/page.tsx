import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { SectionHeading } from "@/components/content-blocks";
import { ArrowIcon } from "@/components/icons";
import { learningConcepts, agingSections, resourcesMeta } from "@/data/resources";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "MSAIL's curated AI/ML learning library — foundational courses in deep learning, computer vision, NLP, and reinforcement learning.",
};

export default function ResourcesPage() {
  return (
    <PageShell title="Resource Library" lead={resourcesMeta.intro} note={resourcesMeta.note}>
      <div className="mt-12 flex flex-col gap-12">
        <section className="flex flex-col gap-8">
          <SectionHeading>Learning Concepts</SectionHeading>
          <div className="grid gap-8 sm:grid-cols-2">
            {learningConcepts.map((group) => (
              <div key={group.title} className="flex flex-col gap-3">
                <h3 className="text-label font-semibold uppercase tracking-[0.12em] text-navy">
                  {group.title}
                </h3>
                <ul className="flex flex-col">
                  {group.items.map((r) => (
                    <li key={r.href}>
                      <a
                        href={r.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between gap-3 border-t border-border py-2.5 text-body text-ink transition-colors hover:text-navy hover:underline"
                      >
                        {r.label}
                        <ArrowIcon className="h-4 w-4 shrink-0 -rotate-45 text-faint transition-transform group-hover:translate-x-0.5" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <SectionHeading>More in the library</SectionHeading>
          <p className="max-w-prose text-meta text-faint">
            These live-site sections are being refreshed before they&rsquo;re carried over.
          </p>
          <ul className="flex flex-col">
            {agingSections.map((s) => (
              <li key={s.title} className="flex flex-col gap-1 border-t border-border py-4">
                <span className="text-body font-semibold text-ink">{s.title}</span>
                <span className="text-meta text-muted">{s.summary}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PageShell>
  );
}
