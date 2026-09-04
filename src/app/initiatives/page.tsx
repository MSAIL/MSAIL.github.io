import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { SectionHeading } from "@/components/content-blocks";
import { ArrowIcon } from "@/components/icons";
import { initiatives, mlDiscussionArchive, directionsUrl } from "@/data/initiatives";
import type { InitiativeLink, Room } from "@/data/initiatives";

export const metadata: Metadata = {
  title: "Initiatives",
  description:
    "The projects, courses, and reading groups MSAIL runs, plus the ML Discussion archive of slides, notebooks, and recordings.",
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
      <ArrowIcon className="h-3.5 w-3.5 shrink-0 -rotate-45" />
    </a>
  );
}

/**
 * The room code, tappable for walking directions. Inline in a sentence rather
 * than a button: WCAG's target-size rule exempts links set in running text, and
 * a 44px control here would break the line. The accessible name leads with the
 * visible code so it still contains the label.
 */
function RoomLink({ room }: { room: Room }) {
  return (
    <a
      href={directionsUrl(room)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Directions to ${room.code}, ${room.building}`}
      className="underline decoration-dotted underline-offset-2 transition-colors duration-150 hover:text-navy"
    >
      {room.code}
    </a>
  );
}

export default function InitiativesPage() {
  return (
    <PageShell
      title="Projects & Initiatives"
      lead="The projects, courses, and reading groups MSAIL runs, plus the ML Discussion archive."
    >
      <div className="mt-12 flex flex-col gap-14">
        <section className="flex flex-col gap-6">
          <SectionHeading>Fall 2026</SectionHeading>
          <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {initiatives.items.map((item) => (
            <article key={item.name} className="flex flex-col gap-2 border-t border-border pt-5">
              <h2 className="font-display text-h3 text-navy">{item.name}</h2>
              <p className="text-meta text-ink-3">
                {item.level} · led by {item.lead}
              </p>
              {item.when ? (
                <p className="text-meta text-ink-3">
                  Meets {item.when}
                  {item.room ? (
                    <>
                      {", "}
                      <RoomLink room={item.room} />
                    </>
                  ) : null}
                </p>
              ) : null}
              <p className="max-w-prose text-body text-ink-2">{item.description}</p>
              {item.links.length ? (
                <p className="flex flex-wrap gap-x-5">
                  {item.links.map((l) => (
                    <ExternalLink key={l.href} link={l} />
                  ))}
                </p>
              ) : null}
            </article>
          ))}
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <SectionHeading>ML Discussion: {mlDiscussionArchive.term} material</SectionHeading>
          <p className="max-w-prose text-body text-ink-2">{mlDiscussionArchive.intro}</p>
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
