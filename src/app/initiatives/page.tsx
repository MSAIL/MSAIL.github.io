import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { AwaitingNotice, SectionHeading } from "@/components/content-blocks";
import { ArrowIcon } from "@/components/icons";
import { initiatives, initiativesMeta, mlDiscussionArchive } from "@/data/initiatives";
import type { InitiativeLink } from "@/data/initiatives";

export const metadata: Metadata = {
  title: "Initiatives",
  description:
    "The projects and reading groups MSAIL runs, plus the ML Discussion archive of slides, notebooks, and recordings.",
};

function ExternalLink({ link }: { link: InitiativeLink }) {
  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex min-h-11 items-center gap-1.5 text-label font-medium text-navy hover:underline"
    >
      {link.label}
      <ArrowIcon className="h-3.5 w-3.5 shrink-0 -rotate-45 transition-transform group-hover:translate-x-0.5" />
    </a>
  );
}

export default function InitiativesPage() {
  return (
    <PageShell
      title="Projects & Initiatives"
      lead="The projects and reading groups you can join this term."
    >
      <div className="mt-12 flex flex-col gap-14">
        <section className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {initiatives.items.map((item) => (
            <article key={item.name} className="flex flex-col gap-2 border-t border-border pt-5">
              <h2 className="font-display text-h3 text-ink">{item.name}</h2>
              <p className="font-mono text-meta uppercase tracking-[0.12em] text-faint">
                {item.level} · led by {item.lead}
              </p>
              <p className="max-w-prose text-body text-muted">{item.description}</p>
              {item.links.length ? (
                <p className="flex flex-wrap gap-x-5">
                  {item.links.map((l) => (
                    <ExternalLink key={l.href} link={l} />
                  ))}
                </p>
              ) : null}
            </article>
          ))}
        </section>

        <AwaitingNotice label="New initiatives incoming">
          {initiativesMeta.notice}
        </AwaitingNotice>

        <section className="flex flex-col gap-6">
          <SectionHeading>ML Discussion: {mlDiscussionArchive.term} material</SectionHeading>
          <p className="max-w-prose text-body text-muted">{mlDiscussionArchive.intro}</p>
          <ul className="flex flex-col">
            {mlDiscussionArchive.lessons.map((lesson) => (
              <li
                key={lesson.title}
                className="flex flex-col gap-1 border-t border-border py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
              >
                <h3 className="text-body font-semibold text-ink">{lesson.title}</h3>
                <p className="flex flex-wrap gap-x-5 sm:justify-end">
                  {lesson.links.map((l) => (
                    <ExternalLink key={l.href} link={l} />
                  ))}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PageShell>
  );
}
