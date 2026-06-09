import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";
import { talksArchive, talksMeta } from "@/data/talks";

export const metadata: Metadata = { title: "Talks" };

// Group by year (desc); undated talks come last.
const years = Array.from(new Set(talksArchive.map((t) => t.year)))
  .filter((y): y is number => y !== null)
  .sort((a, b) => b - a);
const undated = talksArchive.filter((t) => t.year === null);

export default function TalksPage() {
  return (
    <PlaceholderPage
      title="Talks & Speaker Series"
      lead={`An archive of MSAIL talks (${talksMeta.span}) — researchers, students, and guests on the ideas shaping modern AI.`}
      note={talksMeta.flag.note}
    >
      <div className="mt-12 flex flex-col gap-12">
        {[...years.map((y) => ({ key: String(y), label: String(y), talks: talksArchive.filter((t) => t.year === y) })),
          ...(undated.length ? [{ key: "undated", label: "Date unconfirmed", talks: undated }] : [])].map(
          (group) => (
            <section key={group.key} className="flex flex-col gap-5">
              <h2 className="font-display text-h3 font-bold text-maize-deep">{group.label}</h2>
              <ul className="flex flex-col">
                {group.talks.map((t) => (
                  <li key={t.slug} className="flex flex-col gap-1 border-t border-border py-4">
                    <span className="text-body font-semibold text-ink">{t.title}</span>
                    <span className="text-meta text-muted">{t.speaker}</span>
                  </li>
                ))}
              </ul>
            </section>
          ),
        )}
      </div>
    </PlaceholderPage>
  );
}
